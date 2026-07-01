// Supabase Edge Function: paystack-webhook
//
// Receives Paystack webhooks (JSON, HMAC-SHA512 signed) for the FULL native
// Subscriptions lifecycle — not just one-off charges. Dispatches on
// event.event (the actual Paystack event name), not on data.status, since
// only charge.success uses status:"success" — subscription.create arrives
// with status:"active" and invoice/subscription lifecycle events don't use
// a "success" status field at all. The old code's `if (data.status !==
// "success") return` silently dropped every event except charge.success —
// that bug is why subscription.create was never seen taking effect.
//
// DEPLOY WITHOUT JWT VERIFICATION:
//   supabase functions deploy paystack-webhook --no-verify-jwt
//
// Reference format (INITIAL charge only): LEURO-{learner_id}-{timestamp}
//   learner_id is the UUID from the learners table (NOT the parent user_id).
//   Renewal charges (month 2+) carry a Paystack-generated reference with no
//   LEURO prefix — those are mapped via paystack_customer_code instead.
//
// Ground truth confirmed from real production logs:
//   - charge.success fires FIRST for the initial subscription payment, with
//     data.reference = "LEURO-{learnerId}-{ts}", data.customer.customer_code,
//     and data.subscription_code present on the same event.
//   - subscription.create fires SECOND (~7s later) with status:"active" and
//     NO reference field. It is treated as a no-op / best-effort enrichment
//     only — charge.success is the anchor point for the customer_code /
//     subscription_code link, not this event.
// NOT yet confirmed from real logs (Code's best design against Paystack's
// documented shape — flagged so the first real occurrence can correct it):
//   - invoice.payment_failed's exact field path for customer_code.
//   - subscription.disable / subscription.not_renew's exact payload shape.
//   Both paths log the full raw event JSON on first arrival and fail safe
//   (log + return 200) rather than throwing if the assumed shape is wrong.
//
// Referral codes / subscription_discounts: the old discount-validation block
// is removed. Paystack Plans have fixed prices, so mid-charge discounting no
// longer applies. Referral codes will be repurposed later as school-tracking
// only, unrelated to billing — not reintroduced here.
//
// Flow:
//   1. Verify HMAC-SHA512 x-paystack-signature header. Bad signature → 401.
//   2. Parse event.event and dispatch:
//        charge.success            → activate tier / advance renewal
//        subscription.create       → log + best-effort enrichment (no-op safe)
//        invoice.payment_failed    → mark past_due
//        subscription.disable      → mark cancelled, tier → free
//        subscription.not_renew    → mark cancelled, tier → free
//        anything else             → log + ignore
//   3. Always return 200 OK except on bad signature (Paystack retries on
//      non-2xx, so a processing error must never cause a retry storm).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Paystack plan_code → our internal tier name. Plans have fixed prices now,
// so tier is derived from plan_code, never from the charged amount.
const PLAN_TIER_MAP: Record<string, "basic" | "premium"> = {
  PLN_x2bz5sdsky99bk5: "basic",
  PLN_gmx6yhgo5ikqg64: "premium",
};

function tierFromPlanCode(planCode: string | null): "basic" | "premium" | null {
  if (!planCode) return null;
  return PLAN_TIER_MAP[planCode] ?? null;
}

// Best-effort extraction of a plan_code from whatever shape Paystack sent —
// seen as an object (data.plan.plan_code) in our confirmed logs, but some
// Paystack payload variants send a bare plan_code string or data.plan_object.
function extractPlanCode(data: Record<string, unknown>): string | null {
  const plan = data.plan as Record<string, unknown> | string | undefined;
  if (typeof plan === "string") return plan;
  if (plan && typeof plan === "object" && typeof plan.plan_code === "string") return plan.plan_code;
  const planObject = data.plan_object as Record<string, unknown> | undefined;
  if (planObject && typeof planObject.plan_code === "string") return planObject.plan_code;
  return null;
}

// Parse LEURO-{uuid}-{timestamp}. Returns null for anything else, including
// Paystack's own auto-generated renewal references (no LEURO- prefix) — the
// UUID/timestamp shape is validated, not just the prefix, so a malformed or
// coincidentally-prefixed reference can never be mistaken for a real one.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseLeuroReference(reference: string): string | null {
  if (!reference || !reference.startsWith("LEURO-")) return null;
  const withoutPrefix = reference.slice("LEURO-".length);
  const lastDash = withoutPrefix.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const learnerId = withoutPrefix.slice(0, lastDash).trim();
  const timestampPart = withoutPrefix.slice(lastDash + 1).trim();
  if (!UUID_RE.test(learnerId) || !/^\d+$/.test(timestampPart)) return null;
  return learnerId;
}

function addOneMonthIso(from: Date): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

// Verify Paystack HMAC-SHA512 signature over the raw request body.
async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  try {
    const secret = Deno.env.get("PAYSTACK_TEST_SECRET") ?? "";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const hex = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === signature;
  } catch {
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Learner = { id: string; user_id: string; subscription_tier: string | null };

async function updateLearner(learnerId: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from("learners").update(fields).eq("id", learnerId);
  if (error) {
    console.error("paystack-webhook: learners update failed for", learnerId, ":", error.message);
  }
}

async function insertSubscriptionHistory(row: {
  userId: string;
  learnerId: string;
  tierFrom: string | null;
  tierTo: string | null;
  amountPaid: number;
  paymentRef: string | null;
}): Promise<void> {
  const { error } = await supabase.from("subscription_history").insert({
    user_id: row.userId,
    learner_id: row.learnerId,
    tier_from: row.tierFrom,
    tier_to: row.tierTo,
    amount_paid: row.amountPaid,
    currency: "ZAR",
    payment_ref: row.paymentRef,
    source: "paystack",
  });
  if (error) {
    console.error("paystack-webhook: subscription_history insert failed:", error.message);
  }
}

async function findLearnerByCustomerCode(customerCode: string): Promise<Learner | null> {
  const { data, error } = await supabase
    .from("learners")
    .select("id, user_id, subscription_tier")
    .eq("paystack_customer_code", customerCode)
    .maybeSingle();
  if (error || !data) return null;
  return data as Learner;
}

async function findLearnerBySubscriptionCode(subscriptionCode: string): Promise<Learner | null> {
  const { data, error } = await supabase
    .from("learners")
    .select("id, user_id, subscription_tier")
    .eq("subscription_code", subscriptionCode)
    .maybeSingle();
  if (error || !data) return null;
  return data as Learner;
}

// ---------------------------------------------------------------------------
// charge.success — the anchor event. Initial charges carry the LEURO
// reference and MUST set the tier + store customer_code/subscription_code.
// Renewal charges carry no reference and only advance the billing cycle.
// ---------------------------------------------------------------------------
async function handleChargeSuccess(data: Record<string, unknown>): Promise<void> {
  if (data.status !== "success") {
    console.log("paystack-webhook: charge.success — ignoring non-success status:", data.status);
    return;
  }

  const reference = String(data.reference ?? "");
  const customer = data.customer as Record<string, unknown> | undefined;
  const customerCode = (customer?.customer_code as string) ?? null;
  const subscriptionCode = (data.subscription_code as string) ?? null;
  const planCode = extractPlanCode(data);
  const amountRand = Number(data.amount ?? 0) / 100;

  console.log(
    "paystack-webhook: charge.success — ref:", reference,
    "| customer_code:", customerCode,
    "| subscription_code present:", subscriptionCode != null, "value:", subscriptionCode,
    "| plan_code:", planCode,
  );

  const subscriptionObj = data.subscription as Record<string, unknown> | undefined;
  const nextPaymentDate = subscriptionObj?.next_payment_date
    ? new Date(subscriptionObj.next_payment_date as string).toISOString()
    : addOneMonthIso(new Date());
  const nowIso = new Date().toISOString();

  const learnerIdFromRef = parseLeuroReference(reference);

  if (learnerIdFromRef) {
    // INITIAL charge — tier MUST come from plan_code, never from amount.
    const { data: learner, error } = await supabase
      .from("learners")
      .select("id, user_id, subscription_tier")
      .eq("id", learnerIdFromRef)
      .single();

    if (error || !learner) {
      console.error("paystack-webhook: charge.success (initial) — learner not found for id:", learnerIdFromRef, error?.message);
      return;
    }

    const tier = tierFromPlanCode(planCode);
    if (!tier) {
      console.error(
        "paystack-webhook: charge.success (initial) — cannot determine tier, unrecognised/missing plan_code:",
        planCode, "— skipping activation for learner", learnerIdFromRef,
      );
      return;
    }

    const tierFrom = learner.subscription_tier ?? null;

    await updateLearner(learnerIdFromRef, {
      subscription_tier: tier,
      subscription_status: "active",
      last_charge_at: nowIso,
      next_payment_date: nextPaymentDate,
      paystack_customer_code: customerCode,
      subscription_code: subscriptionCode,
    });

    await insertSubscriptionHistory({
      userId: learner.user_id,
      learnerId: learnerIdFromRef,
      tierFrom,
      tierTo: tier,
      amountPaid: amountRand,
      paymentRef: reference,
    });

    console.log(`paystack-webhook: charge.success (initial) — activated learner ${learnerIdFromRef} → ${tier}`);
  } else {
    // RENEWAL charge — no LEURO reference, map by customer_code instead.
    if (!customerCode) {
      console.error("paystack-webhook: charge.success (renewal) — no customer_code on event, cannot map. ref:", reference);
      return;
    }

    const learner = await findLearnerByCustomerCode(customerCode);
    if (!learner) {
      console.error("paystack-webhook: charge.success (renewal) — no learner found for customer_code:", customerCode);
      return;
    }

    await updateLearner(learner.id, {
      subscription_status: "active",
      last_charge_at: nowIso,
      next_payment_date: nextPaymentDate,
    });

    await insertSubscriptionHistory({
      userId: learner.user_id,
      learnerId: learner.id,
      tierFrom: learner.subscription_tier,
      tierTo: learner.subscription_tier,
      amountPaid: amountRand,
      paymentRef: reference,
    });

    console.log(`paystack-webhook: charge.success (renewal) — advanced billing cycle for learner ${learner.id}`);
  }
}

// ---------------------------------------------------------------------------
// subscription.create — confirmed to carry no reference and to arrive after
// charge.success. Treated as log-only / best-effort enrichment: never a
// blind write, only upserts subscription_code if a matching learner is
// already found via customer_code AND doesn't have one yet.
// ---------------------------------------------------------------------------
async function handleSubscriptionCreate(data: Record<string, unknown>, event: unknown): Promise<void> {
  console.log("paystack-webhook: subscription.create event:", JSON.stringify(event));

  const customer = data.customer as Record<string, unknown> | undefined;
  const customerCode = (customer?.customer_code as string) ?? null;
  if (!customerCode) {
    console.log("paystack-webhook: subscription.create — no customer_code on event, nothing to enrich");
    return;
  }

  const { data: learner, error } = await supabase
    .from("learners")
    .select("id, subscription_code")
    .eq("paystack_customer_code", customerCode)
    .maybeSingle();

  if (error || !learner) {
    console.log(
      "paystack-webhook: subscription.create — no learner found for customer_code:", customerCode,
      "(expected if charge.success hasn't landed yet)",
    );
    return;
  }

  if (learner.subscription_code) {
    console.log("paystack-webhook: subscription.create — learner", learner.id, "already has subscription_code, no-op");
    return;
  }

  const subscriptionCode = (data.subscription_code as string) ?? null;
  if (!subscriptionCode) {
    console.log("paystack-webhook: subscription.create — event has no subscription_code to backfill");
    return;
  }

  await updateLearner(learner.id, { subscription_code: subscriptionCode });
  console.log("paystack-webhook: subscription.create — backfilled subscription_code for learner", learner.id);
}

// ---------------------------------------------------------------------------
// invoice.payment_failed — payload shape NOT yet confirmed from real logs.
// Logs the full raw event first so the first real occurrence tells us
// definitively which customer_code path is correct.
// ---------------------------------------------------------------------------
async function handleInvoicePaymentFailed(data: Record<string, unknown>, event: unknown): Promise<void> {
  console.log("paystack-webhook: invoice.payment_failed RAW:", JSON.stringify(event));

  const directCustomer = data.customer as Record<string, unknown> | undefined;
  const subscription = data.subscription as Record<string, unknown> | undefined;
  const nestedCustomer = subscription?.customer as Record<string, unknown> | undefined;

  let customerCode: string | null = null;
  let pathUsed = "none";
  if (directCustomer?.customer_code) {
    customerCode = directCustomer.customer_code as string;
    pathUsed = "data.customer.customer_code";
  } else if (nestedCustomer?.customer_code) {
    customerCode = nestedCustomer.customer_code as string;
    pathUsed = "data.subscription.customer.customer_code";
  }
  console.log("paystack-webhook: invoice.payment_failed — customer_code resolved via:", pathUsed, "| value:", customerCode);

  if (!customerCode) {
    console.error("paystack-webhook: invoice.payment_failed — no customer_code found on any known path, cannot map to learner");
    return;
  }

  const learner = await findLearnerByCustomerCode(customerCode);
  if (!learner) {
    console.error("paystack-webhook: invoice.payment_failed — no learner found for customer_code:", customerCode);
    return;
  }

  await updateLearner(learner.id, { subscription_status: "past_due" });

  await insertSubscriptionHistory({
    userId: learner.user_id,
    learnerId: learner.id,
    tierFrom: learner.subscription_tier,
    tierTo: learner.subscription_tier,
    amountPaid: 0,
    paymentRef: null,
  });

  console.log("paystack-webhook: invoice.payment_failed — marked learner", learner.id, "past_due");
}

// ---------------------------------------------------------------------------
// subscription.disable / subscription.not_renew — payload shape NOT yet
// confirmed from real logs. Looks up primarily via paystack_customer_code
// (the field proven reliably present on every event so far), falling back
// to subscription_code only if that lookup finds nothing — subscription_code
// is usually null on our learner rows since subscription.create (the only
// event that backfills it) doesn't reliably arrive. Relying on
// subscription_code as the primary key would silently fail to cancel a real
// subscription, leaving the learner marked as a paid tier indefinitely.
// ---------------------------------------------------------------------------
async function handleSubscriptionCancelled(data: Record<string, unknown>, event: unknown, eventType: string): Promise<void> {
  console.log(`paystack-webhook: ${eventType} event:`, JSON.stringify(event));

  const customer = data.customer as Record<string, unknown> | undefined;
  const customerCode = (customer?.customer_code as string) ?? null;
  const subscriptionCode = (data.subscription_code as string) ?? null;

  let learner: Learner | null = null;
  let pathUsed = "none";

  if (customerCode) {
    learner = await findLearnerByCustomerCode(customerCode);
    if (learner) pathUsed = "paystack_customer_code";
  }

  if (!learner && subscriptionCode) {
    learner = await findLearnerBySubscriptionCode(subscriptionCode);
    if (learner) pathUsed = "subscription_code (fallback)";
  }

  console.log(
    `paystack-webhook: ${eventType} — lookup resolved via:`, pathUsed,
    "| customer_code:", customerCode, "| subscription_code:", subscriptionCode,
  );

  if (!learner) {
    console.error(
      `paystack-webhook: ${eventType} — no learner found via customer_code or subscription_code. Raw event:`,
      JSON.stringify(event),
    );
    return;
  }

  const tierFrom = learner.subscription_tier;

  await updateLearner(learner.id, { subscription_status: "cancelled", subscription_tier: "free" });

  await insertSubscriptionHistory({
    userId: learner.user_id,
    learnerId: learner.id,
    tierFrom,
    tierTo: "free",
    amountPaid: 0,
    paymentRef: null,
  });

  console.log(`paystack-webhook: ${eventType} — cancelled learner`, learner.id, `(matched via ${pathUsed})`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    if (!await verifySignature(rawBody, signature)) {
      console.error("paystack-webhook: invalid signature");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event ?? "";
    const data: Record<string, unknown> = event?.data ?? {};

    console.log("paystack-webhook: event:", eventType, "status:", data.status, "ref:", data.reference);

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(data, event);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(data, event);
        break;
      case "subscription.disable":
      case "subscription.not_renew":
        await handleSubscriptionCancelled(data, event, eventType);
        break;
      default:
        console.log("paystack-webhook: unhandled event type:", eventType);
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("paystack-webhook error:", err);
    // Return 200 to prevent Paystack retry storms.
    return new Response("OK", { status: 200 });
  }
});
