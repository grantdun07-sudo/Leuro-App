// Supabase Edge Function: send-invite-email
//
// Sends a child invite email via Resend when a parent adds a child
// in "Send invite" mode.
//
// DEPLOY:
//   supabase functions deploy send-invite-email --no-verify-jwt
//
// SET SECRETS:
//   supabase secrets set RESEND_API_KEY=re_...
//
// Expected body: { email: string, name: string, token: string }

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
