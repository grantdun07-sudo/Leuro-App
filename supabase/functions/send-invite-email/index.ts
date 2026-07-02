// Supabase Edge Function: send-invite-email
//
// Sends a child invite email via Resend when a parent adds a child
// in "Send invite" mode.
//
// *** SECURITY FIX ***
// This function used to accept and email ANY { email, name, token } with
// zero validation — no auth, no check that the token corresponded to a
// real invite. Anyone who could reach this URL could make it send a real
// "Activate My Account" email, from Leuro's trusted domain, to any inbox,
// embedding any token value they chose. Beyond spam/phishing-from-a-
// trusted-domain abuse: if an attacker already had a genuine, still-
// PENDING invite_token (e.g. leaked from a prior email, or from the
// child themselves), they could redirect where the activation link is
// delivered to their own inbox and take over that child's account — a
// real account-takeover path, not just noise.
//
// Fix: before sending anything, the token must resolve to a real,
// currently-pending learners row (the same lookup accept-child-invite
// itself performs before consuming the token), and the destination email
// must match that row's own stored email — so this function can no
// longer be used to email an arbitrary/guessed token to an arbitrary
// inbox. This doesn't require full JWT auth (the child has no session yet
// at invite time) — the invite token, now actually checked, IS the
// validation, exactly as it's meant to function.
//
// DEPLOY:
//   supabase functions deploy send-invite-email --no-verify-jwt
//
// SET SECRETS:
//   supabase secrets set RESEND_API_KEY=re_...
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-provided)
//
// Expected body: { email: string, name: string, token: string }
// Responses:
//   200 { ok: true }
//   400 { error: "..." }  — missing fields, invite not pending, email mismatch
//   500 { error: "..." }  — server / email-provider errors

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const APP_URL = "https://leuro-app.vercel.app";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, token } = await req.json();
    if (!email || !token) {
      return jsonResponse({ error: "Missing email or token" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("send-invite-email: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Validate the token genuinely corresponds to a real, still-pending
    // invite — the same check accept-child-invite performs before
    // consuming it. This is what stops the endpoint from emailing an
    // arbitrary/blank/already-used token.
    const { data: learner, error: lookupErr } = await admin
      .from("learners")
      .select("id, email, invite_status")
      .eq("invite_token", token)
      .maybeSingle();

    if (lookupErr) {
      console.error("send-invite-email: learners lookup failed:", lookupErr.message);
      return jsonResponse({ error: "Could not process invite. Please try again." }, 500);
    }

    if (!learner || learner.invite_status !== "pending") {
      console.warn("send-invite-email: rejected — token not found or not pending. requested email:", email);
      return jsonResponse({ error: "Invalid or already-used invite token" }, 400);
    }

    // The destination must match the invite's own stored email — otherwise
    // a valid pending token could be replayed to deliver the activation
    // link to a different inbox than the one it was actually issued for.
    if (learner.email && learner.email.toLowerCase() !== String(email).toLowerCase()) {
      console.warn(
        "send-invite-email: rejected — email does not match invite record. requested:", email,
        "expected:", learner.email,
      );
      return jsonResponse({ error: "Email does not match this invite" }, 400);
    }

    const inviteUrl = `${APP_URL}/accept-invite?token=${token}`;
    const firstName = (name || "").split(/\s+/)[0] || "there";

    const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!resendKey) {
      console.error("send-invite-email: RESEND_API_KEY not set");
      return jsonResponse({ error: "Email service not configured" }, 500);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Leuro <noreply@leuroai.co.za>",
        to: [email],
        subject: "You've been added to Leuro™ — activate your account",
        html: `
          <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <h2 style="color:#5A3E76;margin-bottom:8px;">Welcome to Leuro™, ${firstName}!</h2>
            <p style="color:#555;margin-top:0;">Your parent has added you as a learner on Leuro™ — South Africa's AI study companion.</p>
            <p style="color:#555;">Click the button below to set your password and activate your account:</p>
            <a href="${inviteUrl}" style="display:inline-block;background:#5A3E76;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0;">
              Activate My Account
            </a>
            <p style="color:#888;font-size:13px;margin-top:24px;">
              Or copy this link into your browser:<br/>
              <a href="${inviteUrl}" style="color:#5A3E76;word-break:break-all;">${inviteUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#aaa;font-size:12px;">If you didn't expect this email, you can ignore it safely.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("send-invite-email: Resend error:", body);
      return jsonResponse({ error: "Failed to send email" }, 500);
    }

    console.log("send-invite-email: sent to", email);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error("send-invite-email error:", err);
    return jsonResponse({ error: "Internal error" }, 500);
  }
});
