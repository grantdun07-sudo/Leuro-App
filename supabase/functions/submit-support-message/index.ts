// Supabase Edge Function: submit-support-message
// (self-contained, no _shared imports)
// DEPLOY: supabase functions deploy submit-support-message --no-verify-jwt
// SECRETS: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, RESEND_API_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonOk(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Safety detection — inlined from app.js to match client-side parity exactly.
const TIER1_PHRASES = [
  "suicid", "kill myself", "killing myself", "end my life", "ending my life",
  "end it all", "how do i end it", "want to die", "wanted to die", "wanting to die",
  "wanna die", "rather be dead", "wish i was dead", "wish i were dead",
  "wished i was dead", "wished i were dead", "wish i was never born",
  "wished i was never born", "wish i wasnt alive", "self harm", "self-harm",
  "selfharm", "harm myself", "harming myself", "cutting myself", "cut myself",
  "hurt myself", "hurting myself", "dont want to live", "dont want to be alive",
  "dont want to be here", "no reason to live", "no point in living",
  "better off dead", "better off without me", "dont like life", "hate my life",
  "hate life", "not worth living", "life is not worth", "nobody cares about me",
  "nobody would miss me", "cant go on", "tired of living", "tired of life",
  "life is pointless", "i give up on life", "no one cares", "no one would care",
  "pointless being here", "i suffer", "suffering too much", "cant take it anymore",
  "too much pain", "make it stop", "how do i make it stop",
  "how do i cut", "how to cut myself", "how do i hurt myself", "how to hurt myself",
  "how do i harm myself", "how to harm myself", "how do i kill myself",
  "how to kill myself", "how do i end my life", "how to end my life",
  "how do i commit suicide", "how to commit suicide", "ways to hurt myself",
  "ways to harm myself", "ways to die", "where can i cut", "what can i use to hurt",
  "does cutting help", "does hurting help", "i want to cut", "i want to hurt",
  "i want to harm", "i need to cut", "i need to hurt", "i need to harm",
  "selfmoord", "wil selfmoord pleeg", "wil moord pleeg", "wil nie meer lewe",
  "wil nie meer leef", "sny myself", "seermaak myself", "geen rede om te lewe",
  "geen rede om te leef", "wil doodgaan", "wil dood gaan",
];

function containsTier1Language(text: string): boolean {
  const normalized = text.toLowerCase().replace(/['’]/g, "");
  return TIER1_PHRASES.some((phrase) => normalized.includes(phrase));
}

const TIER2_WORDS = [
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch",
  "bastard", "asshole", "dumbass", "jackass", "ass", "dick", "dickhead",
  "pussy", "cunt", "cock", "prick", "wanker", "twat", "slut", "whore", "douche", "douchebag",
  "nigger", "nigga", "chink", "spic", "kike", "gook", "wetback", "paki", "coon", "kaffir", "kaffer",
  "faggot", "fag", "dyke", "tranny", "retard", "retarded",
  "porn", "porno", "pornography", "blowjob", "handjob", "cumshot",
  "masturbate", "masturbation", "dildo", "orgasm", "horny", "nude", "nudes",
  "sext", "sexting", "boobs", "tits", "vagina", "penis", "fellatio", "cunnilingus",
  "fok", "fokken", "fokkof", "fokop", "kak", "poephol", "hoer", "teef",
  "piel", "doos", "naai", "verdomp", "verdomde", "klootsak", "moerskont", "kont",
];

function buildWordRegex(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
}

const TIER2_REGEX = buildWordRegex(TIER2_WORDS);
const ALLOWED_CATEGORIES = new Set(["", "general", "billing", "technical", "report"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonErr("Method not allowed", 405);

  return await (async () => {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const resendKey   = Deno.env.get("RESEND_API_KEY") ?? "";

    if (!supabaseUrl || !serviceKey || !anonKey) {
      console.error("submit-support-message: missing required env vars");
      return jsonErr("Server configuration error", 500);
    }

    // 1. Verify caller JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return jsonErr("Unauthorized", 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user: caller }, error: jwtErr } = await userClient.auth.getUser();
    if (jwtErr || !caller) {
      console.warn("submit-support-message: invalid JWT:", jwtErr?.message);
      return jsonErr("Unauthorized", 401);
    }

    const callerId = caller.id;

    const admin = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileErr } = await admin
      .from("profiles").select("role").eq("id", callerId).single();

    if (profileErr || !profile) {
      console.error("submit-support-message: profile lookup failed:", profileErr?.message);
      return jsonErr("Unauthorized", 401);
    }

    // 2. Parse & validate body
    let body: { name?: unknown; email?: unknown; category?: unknown; message?: unknown };
    try { body = await req.json(); } catch { return jsonErr("Request body must be valid JSON"); }

    const name     = String(body.name ?? "").trim();
    const email    = String(body.email ?? "").trim().toLowerCase();
    const category = String(body.category ?? "").trim().toLowerCase();
    const message  = String(body.message ?? "").trim();

    if (!name) return jsonErr("Name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonErr("Invalid email address");
    if (!ALLOWED_CATEGORIES.has(category)) return jsonErr("Invalid category");
    if (message.length < 5) return jsonErr("Message must be at least 5 characters");

    // 3. Insert into support_messages
    const { data: inserted, error: insertErr } = await admin
      .from("support_messages")
      .insert({ user_id: callerId, user_role: profile.role, name, email, category: category || null, message, status: "new" })
      .select("id").single();

    if (insertErr || !inserted) {
      console.error("submit-support-message: insert failed:", insertErr?.message);
      return jsonErr("Could not submit your message. Please try again.", 500);
    }

    console.log("submit-support-message: stored message id:", inserted.id, "user:", callerId, "role:", profile.role);
    console.log("[safety] caller role:", profile.role);

    // 4. Safety detection (learners only)
    // The Tier 2 cumulative "freeze after 3 flags in 7 days" check is now
    // evaluated inside save-content-flag itself (moved server-side in the
    // July 2026 audit), so this path gets the same escalation as every
    // other flag source.
    if (profile.role === "learner") {
      console.log("[safety] running detection on message, role=" + profile.role);
      const tier1 = containsTier1Language(message);
      const tier2 = !tier1 && TIER2_REGEX.test(message);
      console.log("[safety] tier1=" + tier1 + " tier2=" + tier2);

      if (tier1 || tier2) {
        const severity = tier1 ? 1 : 2;
        console.log("[safety] FLAG severity=" + severity + ", calling save-content-flag");

        const { data: learnerRow } = await admin
          .from("learners").select("id").eq("user_id", callerId).maybeSingle();

        console.log("[safety] learnerRow.id =", learnerRow?.id, "| callerId =", callerId, "| sending learner_id =", learnerRow?.id ?? null);

        try {
          // Forward the SUBMITTER's own JWT — save-content-flag now
          // authenticates its caller and derives user_id from the token
          // (it no longer trusts a body-supplied user_id).
          const flagRes = await fetch(`${supabaseUrl}/functions/v1/save-content-flag`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}`, "apikey": anonKey },
            body: JSON.stringify({
              learner_id: learnerRow?.id ?? null, severity,
              flagged_text: message, context: "support-message",
            }),
          });

          const flagStatus = flagRes.status;
          const flagBody = await flagRes.text();
          console.log("[safety] save-content-flag status=" + flagStatus);

          if (!flagRes.ok) {
            console.error("submit-support-message: save-content-flag failed:", flagBody);
          }

          // Notify the parent regardless of the flag insert outcome —
          // the parent alert/email matters MORE than the audit row. This
          // used to be gated on a flagId read from save-content-flag's
          // response, but that function deliberately stopped returning
          // the flag id (security fix), so the gate silently disabled
          // parent notification for every support-message flag — a
          // frozen child with no alert for the parent to acknowledge.
          if (learnerRow?.id) {
            try {
              const notifyRes = await fetch(`${supabaseUrl}/functions/v1/notify-parent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}`, "apikey": anonKey },
                body: JSON.stringify({
                  learnerId: learnerRow.id, severity, flaggedText: message,
                  context: "support-message",
                }),
              });
              const notifyStatus = notifyRes.status;
              const notifyBody = await notifyRes.text();
              console.log("[safety] notify-parent status=" + notifyStatus + " body=" + notifyBody);
              if (!notifyRes.ok) {
                console.error("submit-support-message: notify-parent failed:", notifyBody);
              } else {
                console.log("submit-support-message: notify-parent ok");
              }
            } catch (e) { console.error("submit-support-message: notify-parent threw:", e); }
          } else {
            console.log("[safety] skipping notify-parent: no learners row for caller", callerId);
          }
        } catch (e) { console.error("submit-support-message: safety pipeline threw:", e); }
      } else {
        console.log("[safety] no flag triggered for this message");
      }
    } else {
      console.log("[safety] skipping safety check: role is not learner, role=" + profile.role);
    }

    // 5. Send email via Resend (non-fatal if it fails)
    const categoryLabel = category || "general";
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const subject = `New support message [${categoryLabel}] from ${name}`;
    const emailHtml = `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#5A3E76;margin-bottom:4px;">New Support Message</h2>
        <p style="color:#888;margin-top:0;font-size:13px;">${timestamp}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:6px 0;color:#555;font-weight:600;width:120px;">Name</td><td style="padding:6px 0;color:#222;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#555;font-weight:600;">Email</td><td style="padding:6px 0;color:#222;">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 0;color:#555;font-weight:600;">Role</td><td style="padding:6px 0;color:#222;">${escapeHtml(profile.role)}</td></tr>
          <tr><td style="padding:6px 0;color:#555;font-weight:600;">Category</td><td style="padding:6px 0;color:#222;">${escapeHtml(categoryLabel)}</td></tr>
        </table>
        <div style="background:#f5f5f5;border-radius:8px;padding:16px;">
          <p style="margin:0;color:#333;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">Message id: ${inserted.id}</p>
      </div>
    `;

    if (!resendKey) {
      console.error("submit-support-message: RESEND_API_KEY not set — email skipped for message", inserted.id);
    } else {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "Leuro Support <noreply@leuroai.co.za>", to: ["hello@leuroai.co.za"], subject, html: emailHtml }),
        });
        if (!emailRes.ok) {
          console.error("submit-support-message: Resend error for message", inserted.id, ":", await emailRes.text());
        } else {
          console.log("submit-support-message: email sent for message", inserted.id);
        }
      } catch (e) {
        console.error("submit-support-message: Resend fetch threw for message", inserted.id, ":", e);
      }
    }

    return jsonOk({ ok: true });

  })().catch((e: unknown) => {
    const eMsg = e instanceof Error ? `${e.message} | stack: ${e.stack ?? "none"}` : String(e);
    console.error("submit-support-message: UNHANDLED EXCEPTION:", eMsg);
    return jsonErr("Server error. Please try again.", 500);
  });
});
