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
//   LEURO prefix — those are mapped via subscription_code first, customer_code
//   only as a fallback (see below for why customer_code alone is unsafe).
//
// IMPORTANT — why subscription_code, not just customer_code:
//   Paystack deduplicates customers by email. Since every one of a parent's
//   children subscribes using the PARENT's email, ALL of a parent's children
//   share the exact same Paystack customer_code. customer_code therefore
//   cannot distinguish which of a parent's several paid children a given
//   subscription/event belongs to — only subscription_code is unique per
//   learner. subscription_code is captured two ways: (1) actively fetched and
//   claimed right after the INITIAL charge (see handleChargeSuccess), rather
//   than relying on the subscription.create webhook event, which we've
//   confirmed doesn't reliably fire/deliver. (2) On RENEWAL charges, used as
//   the PRIMARY mapping key when present on the event; customer_code is only
//   a fallback, and if that fallback matches more than one learner (i.e. two
//   siblings on paid tiers with no subscription_code recorded on the event),
//   the handler refuses to guess and does not write anything.
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

type Learner = { id: string; user_id: string; subscription_tier: string | null; full_name: string | null };
type LearnerClaim = { id: string; subscription_code: string | null };

type PaystackSubscriptionListItem = {
  subscription_code?: string;
  email_token?: string;
  status?: string;
  createdAt?: string;
  plan?: { plan_code?: string };
};

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
    .select("id, user_id, subscription_tier, full_name")
    .eq("paystack_customer_code", customerCode)
    .maybeSingle();
  if (error || !data) return null;
  return data as Learner;
}

async function findLearnerBySubscriptionCode(subscriptionCode: string): Promise<Learner | null> {
  const { data, error } = await supabase
    .from("learners")
    .select("id, user_id, subscription_tier, full_name")
    .eq("subscription_code", subscriptionCode)
    .maybeSingle();
  if (error || !data) return null;
  return data as Learner;
}

// Returns EVERY learner matching this customer_code — unlike
// findLearnerByCustomerCode (.maybeSingle()), this is used specifically to
// DETECT ambiguity (siblings sharing one Paystack customer), not to resolve
// a single row.
async function findLearnersByCustomerCode(customerCode: string): Promise<Learner[]> {
  const { data, error } = await supabase
    .from("learners")
    .select("id, user_id, subscription_tier, full_name")
    .eq("paystack_customer_code", customerCode);
  if (error || !data) return [];
  return data as Learner[];
}

// Notifies every parent linked to a learner by inserting parent_alerts rows
// directly via the service_role client, rather than calling the
// create_parent_alert() RPC used by notify-parent for learner-initiated
// safety alerts. That RPC's SECURITY DEFINER body requires
// `auth.uid() = learners.user_id` — it's designed to be called with the
// LEARNER's own JWT in the request. This webhook has no end-user session at
// all (service_role only), so auth.uid() would resolve to NULL there and
// that check would ALWAYS fail, meaning the RPC would throw "not authorized"
// on every call and never actually create an alert. Since service_role
// already bypasses RLS, we replicate the RPC's actual insert directly
// instead — same shape (parent_id, learner_id, alert_type, message), same
// "every parent whose linked_learners contains this learner" targeting.
async function notifyParentsDirectly(learnerId: string, alertType: string, message: string): Promise<void> {
  const { data: parents, error: parentsErr } = await supabase
    .from("parents")
    .select("id")
    .contains("linked_learners", [learnerId]);

  if (parentsErr) {
    console.error("paystack-webhook: notifyParentsDirectly — parent lookup failed:", parentsErr.message);
    return;
  }

  if (!parents || parents.length === 0) {
    console.warn("paystack-webhook: notifyParentsDirectly — no parents linked to learner", learnerId, "— alert not created");
    return;
  }

  const { error: alertErr } = await supabase
    .from("parent_alerts")
    .insert(parents.map((p: { id: string }) => ({ parent_id: p.id, learner_id: learnerId, alert_type: alertType, message })));

  if (alertErr) {
    console.error("paystack-webhook: notifyParentsDirectly — parent_alerts insert failed:", alertErr.message);
  } else {
    console.log("paystack-webhook: notifyParentsDirectly — notified", parents.length, "parent(s) for learner", learnerId, "| alert_type:", alertType);
  }
}

// Used when claiming a subscription_code for a newly-activated learner, to
// exclude any candidate subscription already claimed by a DIFFERENT learner
// row (a sibling on the same plan).
async function findLearnersBySubscriptionCodes(subscriptionCodes: string[]): Promise<LearnerClaim[]> {
  if (subscriptionCodes.length === 0) return [];
  const { data, error } = await supabase
    .from("learners")
    .select("id, subscription_code")
    .in("subscription_code", subscriptionCodes);
  if (error || !data) return [];
  return data as LearnerClaim[];
}

// Actively fetches this customer's subscription list from Paystack and
// claims the one that belongs to THIS learner, rather than trusting
// data.subscription_code on the charge event blindly — Paystack customer
// records are shared across siblings, so the list can contain a sibling's
// subscription too. Filters to this plan + excludes codes already claimed by
// OTHER learner rows, then picks the most recently created remaining
// candidate. Best-effort only: returns null (never throws) on any failure so
// tier activation in the caller is never blocked by this.
async function resolveSubscriptionCodeForNewLearner(
  numericCustomerId: number,
  planCode: string,
  thisLearnerId: string,
): Promise<string | null> {
  try {
    const paystackSecret = Deno.env.get("PAYSTACK_TEST_SECRET") ?? "";
    const listRes = await fetch(
      `https://api.paystack.co/subscription?customer=${numericCustomerId}`,
      { method: "GET", headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const listBody = await listRes.json();
    const subs: PaystackSubscriptionListItem[] = Array.isArray(listBody?.data) ? listBody.data : [];

    const candidates = subs.filter((s) => s.status === "active" && s.plan?.plan_code === planCode);
    if (candidates.length === 0) {
      console.warn(
        "paystack-webhook: charge.success (initial) — no active subscriptions matching plan", planCode,
        "found at Paystack for customer", numericCustomerId, "| raw list:", JSON.stringify(listBody),
      );
      return null;
    }

    const candidateCodes = candidates.map((c) => c.subscription_code).filter((c): c is string => !!c);
    const claims = await findLearnersBySubscriptionCodes(candidateCodes);
    const claimedByOthers = new Set(
      claims.filter((l) => l.id !== thisLearnerId && l.subscription_code).map((l) => l.subscription_code as string),
    );

    const unclaimed = candidates.filter((c) => c.subscription_code && !claimedByOthers.has(c.subscription_code));
    if (unclaimed.length === 0) {
      console.warn(
        "paystack-webhook: charge.success (initial) — all", candidates.length,
        "candidate subscription(s) for customer", numericCustomerId, "plan", planCode,
        "are already claimed by sibling learners — cannot claim one for learner", thisLearnerId,
      );
      return null;
    }

    unclaimed.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const chosen = unclaimed[0];
    console.log(
      "paystack-webhook: charge.success (initial) — claimed subscription_code", chosen.subscription_code,
      "for learner", thisLearnerId, "(", candidates.length, "candidate(s) total,", claimedByOthers.size, "already claimed by siblings)",
    );
    return chosen.subscription_code ?? null;
  } catch (e) {
    const eMsg = e instanceof Error ? e.message : String(e);
    console.error("paystack-webhook: charge.success (initial) — subscription_code resolution threw:", eMsg);
    return null;
  }
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
  const customerNumericId = typeof customer?.id === "number" ? customer.id : null;
  const subscriptionCode = (data.subscription_code as string) ?? null;
  const planCode = extractPlanCode(data);
  const amountRand = Number(data.amount ?? 0) / 100;

  console.log(
    "paystack-webhook: charge.success — ref:", reference,
    "| customer_code:", customerCode,
    "| customer numeric id:", customerNumericId,
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
    if (!tier || !planCode) {
      console.error(
        "paystack-webhook: charge.success (initial) — cannot determine tier, unrecognised/missing plan_code:",
        planCode, "— skipping activation for learner", learnerIdFromRef,
      );
      return;
    }

    const tierFrom = learner.subscription_tier ?? null;

    // Actively fetch-and-claim THIS learner's subscription_code rather than
    // trusting data.subscription_code blindly: paystack_customer_code is
    // shared across all of a parent's children (Paystack dedupes customers
    // by email), so the customer's subscription list at Paystack can contain
    // a sibling's subscription too. See resolveSubscriptionCodeForNewLearner.
    let resolvedSubscriptionCode: string | null = null;
    if (customerNumericId != null) {
      resolvedSubscriptionCode = await resolveSubscriptionCodeForNewLearner(customerNumericId, planCode, learnerIdFromRef);
    } else {
      console.warn(
        "paystack-webhook: charge.success (initial) — no numeric customer id (data.customer.id) on event, cannot claim subscription_code for learner",
        learnerIdFromRef,
      );
    }

    const learnerUpdateFields: Record<string, unknown> = {
      subscription_tier: tier,
      subscription_status: "active",
      last_charge_at: nowIso,
      next_payment_date: nextPaymentDate,
      paystack_customer_code: customerCode,
    };
    // Best-effort enrichment only — tier activation must succeed even if this
    // failed. Omitting the field (rather than writing null) also protects a
    // previously-successful claim from being wiped out on a webhook retry.
    if (resolvedSubscriptionCode) {
      learnerUpdateFields.subscription_code = resolvedSubscriptionCode;
    }

    await updateLearner(learnerIdFromRef, learnerUpdateFields);

    await insertSubscriptionHistory({
      userId: learner.user_id,
      learnerId: learnerIdFromRef,
      tierFrom,
      tierTo: tier,
      amountPaid: amountRand,
      paymentRef: reference,
    });

    console.log(
      `paystack-webhook: charge.success (initial) — activated learner ${learnerIdFromRef} → ${tier}`,
      resolvedSubscriptionCode
        ? `(subscription_code claimed: ${resolvedSubscriptionCode})`
        : "(subscription_code NOT claimed — best-effort enrichment failed, tier activation still succeeded)",
    );
  } else {
    // RENEWAL charge — no LEURO reference. subscription_code (when present
    // on the event) is the ONLY unambiguous mapping key: paystack_customer_code
    // is shared across all of a parent's children, so customer_code alone
    // cannot tell siblings apart. Fallback to customer_code is only used
    // when the event has no subscription_code at all, and even then a
    // customer_code match against MORE THAN ONE learner is refused rather
    // than guessed.
    let learner: Learner | null = null;
    let pathUsed = "none";

    if (subscriptionCode) {
      learner = await findLearnerBySubscriptionCode(subscriptionCode);
      if (learner) {
        pathUsed = "subscription_code";
      } else {
        console.error(
          "paystack-webhook: charge.success (renewal) — subscription_code present but no learner found for it:",
          subscriptionCode, "— NOT falling back to customer_code (would be ambiguous across siblings). ref:", reference,
        );
        return;
      }
    } else if (customerCode) {
      const matches = await findLearnersByCustomerCode(customerCode);
      if (matches.length === 0) {
        console.error("paystack-webhook: charge.success (renewal) — no learner found for customer_code:", customerCode);
        return;
      }
      if (matches.length > 1) {
        console.error(
          "paystack-webhook: charge.success (renewal) — AMBIGUOUS: customer_code", customerCode,
          "matches", matches.length, "learners (ids:", matches.map((m) => m.id).join(", "),
          ") and the event has no subscription_code to disambiguate. Refusing to guess — no write performed. Raw event data:",
          JSON.stringify(data),
        );
        return;
      }
      learner = matches[0];
      pathUsed = "paystack_customer_code (single match)";
    } else {
      console.error("paystack-webhook: charge.success (renewal) — no subscription_code and no customer_code on event, cannot map. ref:", reference);
      return;
    }

    if (!learner) {
      console.error("paystack-webhook: charge.success (renewal) — unexpected: no learner resolved after mapping logic. ref:", reference);
      return;
    }

    console.log("paystack-webhook: charge.success (renewal) — mapped via:", pathUsed, "| learner:", learner.id);

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

  const learnerName = learner.full_name || "your child";
  await notifyParentsDirectly(
    learner.id,
    "payment_failed",
    `Payment failed for ${learnerName} — please renew to avoid losing Premium access.`,
  );

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
