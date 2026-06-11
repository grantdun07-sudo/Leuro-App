// Netlify Function: PayFast ITN (Instant Transaction Notification) webhook
//
// PayFast posts application/x-www-form-urlencoded data here after a
// payment attempt. We:
//   1. Verify the signature against PAYFAST_PASSPHRASE
//   2. Validate the notification with PayFast's servers
//   3. Update the user's subscription_tier in Supabase
//   4. Log the transaction to subscription_history
//   5. Process referral redemptions / free-month upgrades
//
// Required environment variables (set in Netlify):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   PAYFAST_PASSPHRASE
//   PAYFAST_MODE = 'sandbox' | 'live'  (defaults to 'sandbox')

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const PAYFAST_MODE = process.env.PAYFAST_MODE || "sandbox";

const PAYFAST_VALIDATE_URL =
  PAYFAST_MODE === "live"
    ? "https://www.payfast.co.za/eng/query/validate"
    : "https://sandbox.payfast.co.za/eng/query/validate";

const TIER_ORDER = ["free", "basic", "premium"];
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function generateSignature(data, passPhrase) {
  const pairs = [];
  for (const key of Object.keys(data)) {
    if (key === "signature") continue;
    const value = data[key];
    if (value === undefined || value === null || value === "") continue;
    pairs.push(`${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, "+")}`);
  }
  let output = pairs.join("&");
  if (passPhrase) {
    output += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
  }
  return crypto.createHash("md5").update(output).digest("hex");
}

async function validateWithPayFast(rawBody) {
  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
    });
    const text = await res.text();
    return text.trim() === "VALID";
  } catch (err) {
    console.error("PayFast validation request failed:", err);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase configuration");
    return { statusCode: 500, body: "Server misconfigured" };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf-8")
    : event.body || "";

  const params = new URLSearchParams(rawBody);
  const data = Object.fromEntries(params.entries());

  // 1. Signature check
  const expectedSignature = generateSignature(data, PAYFAST_PASSPHRASE);
  if (!data.signature || data.signature !== expectedSignature) {
    console.warn("PayFast signature mismatch");
    return { statusCode: 400, body: "Invalid signature" };
  }

  // 2. Server-to-server validation
  const isValid = await validateWithPayFast(rawBody);
  if (!isValid) {
    console.warn("PayFast server-side validation failed");
    return { statusCode: 400, body: "Validation failed" };
  }

  // 3. Only act on completed payments
  if (data.payment_status !== "COMPLETE") {
    return { statusCode: 200, body: "OK (ignored - not complete)" };
  }

  const userId = data.custom_str1;
  const targetTier = (data.custom_str2 || "").toLowerCase();

  if (!userId || !TIER_ORDER.includes(targetTier)) {
    console.error("PayFast ITN missing/invalid custom fields", { userId, targetTier });
    return { statusCode: 400, body: "Missing or invalid custom fields" };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("subscription_tier, referred_by")
      .eq("id", userId)
      .single();

    if (profileErr || !profile) {
      console.error("Profile not found for PayFast ITN", userId, profileErr);
      return { statusCode: 404, body: "Profile not found" };
    }

    const tierFrom = profile.subscription_tier;
    const subscriptionEndsAt = new Date(Date.now() + ONE_MONTH_MS).toISOString();

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ subscription_tier: targetTier, subscription_ends_at: subscriptionEndsAt })
      .eq("id", userId);

    if (updateErr) throw updateErr;

    await supabase.from("subscription_history").insert({
      user_id: userId,
      tier_from: tierFrom,
      tier_to: targetTier,
      amount_paid: data.amount_gross ? Number(data.amount_gross) : null,
      currency: "ZAR",
      payment_ref: data.pf_payment_id || data.m_payment_id || null,
      source: "payfast",
    });

    // Referral redemption: if this user was referred and this is their
    // first paid upgrade, credit the referrer.
    if (profile.referred_by && tierFrom === "free" && targetTier !== "free") {
      await processReferralRedemption(supabase, userId, profile.referred_by);
    }

    return { statusCode: 200, body: "OK" };
  } catch (err) {
    console.error("PayFast webhook processing error:", err);
    return { statusCode: 500, body: "Internal error" };
  }
};

async function processReferralRedemption(supabase, refereeUserId, referrerCode) {
  try {
    const { data: referrerProfile, error: referrerErr } = await supabase
      .from("profiles")
      .select("id, referral_count, subscription_tier")
      .eq("referral_code", referrerCode)
      .single();

    if (referrerErr || !referrerProfile) return;

    const { data: referrerLearner } = await supabase
      .from("learners")
      .select("id")
      .eq("user_id", referrerProfile.id)
      .single();

    const { data: refereeLearner } = await supabase
      .from("learners")
      .select("id")
      .eq("user_id", refereeUserId)
      .single();

    if (!referrerLearner || !refereeLearner) return;

    // Avoid double-counting the same referral
    const { data: existingRedemption } = await supabase
      .from("referral_redemptions")
      .select("id")
      .eq("referrer_id", referrerLearner.id)
      .eq("referee_id", refereeLearner.id)
      .maybeSingle();

    if (existingRedemption) return;

    await supabase.from("referral_redemptions").insert({
      referrer_id: referrerLearner.id,
      referee_id: refereeLearner.id,
    });

    const newReferralCount = (referrerProfile.referral_count || 0) + 1;
    const updates = { referral_count: newReferralCount };

    // Every 3 successful referrals = 1 month free upgrade
    if (newReferralCount % 3 === 0) {
      const currentTierIndex = TIER_ORDER.indexOf(referrerProfile.subscription_tier);
      const nextTier = TIER_ORDER[Math.min(currentTierIndex + 1, TIER_ORDER.length - 1)];

      if (nextTier !== referrerProfile.subscription_tier) {
        updates.subscription_tier = nextTier;
        updates.subscription_ends_at = new Date(Date.now() + ONE_MONTH_MS).toISOString();

        await supabase.from("subscription_history").insert({
          user_id: referrerProfile.id,
          tier_from: referrerProfile.subscription_tier,
          tier_to: nextTier,
          amount_paid: 0,
          currency: "ZAR",
          payment_ref: null,
          source: "referral",
        });
      }
    }

    await supabase.from("profiles").update(updates).eq("id", referrerProfile.id);
  } catch (err) {
    console.error("Referral redemption error:", err);
  }
}
