import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, token, org_name, inviter_name, site_url } = await req.json();
    const baseUrl = site_url || "https://prodbod.vercel.app";

    if (!email || !token) {
      return new Response(
        JSON.stringify({ success: false, error: "email and token are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL") || "";

    // Local dev mode: Brevo not configured but running against local Supabase.
    // Return success so the invite link shown in the UI can be used for testing.
    const isLocalDev = supabaseUrlEnv.includes("127.0.0.1") || supabaseUrlEnv.includes("localhost") || supabaseUrlEnv.includes("kong");
    if (!brevoApiKey || !brevoSenderEmail) {
      if (isLocalDev) {
        console.log("[local-dev] Brevo not configured — skipping email send. Use the invite link shown in the UI.");
        return new Response(
          JSON.stringify({ success: true, local_only: true, message: "Local dev: email skipped — use the invite link in the UI." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("BREVO_API_KEY or BREVO_SENDER_EMAIL secret not set");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured — BREVO_API_KEY or BREVO_SENDER_EMAIL missing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Generate Supabase magic link WITHOUT triggering Supabase's own email ---
    // Uses /admin/generate_link which returns the OTP link but does NOT send any email.
    // This means only our Brevo email is sent — no double emails.
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const redirectTo = `${baseUrl}/invite?invite=${token}`;
    let inviteUrl = redirectTo; // static fallback

    if (supabaseUrl && serviceRoleKey) {
      try {
        // Try 'invite' type first — creates auth user if new + returns OTP link (no email sent)
        const genRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
          method: "POST",
          headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: "invite", email, redirect_to: redirectTo }),
        });

        if (genRes.ok) {
          const genData = await genRes.json();
          if (genData?.action_link) {
            inviteUrl = genData.action_link;
            console.log("Generated invite magic link for:", email);
          }
        } else {
          const errText = await genRes.text();
          console.log("generate_link invite response:", genRes.status, errText);

          // User already exists — generate a magic link sign-in instead (no email sent)
          if (genRes.status === 422 || errText.includes("already registered") || errText.includes("already been registered")) {
            const mlRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
              method: "POST",
              headers: {
                "apikey": serviceRoleKey,
                "Authorization": `Bearer ${serviceRoleKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ type: "magiclink", email, redirect_to: redirectTo }),
            });

            if (mlRes.ok) {
              const mlData = await mlRes.json();
              if (mlData?.action_link) {
                inviteUrl = mlData.action_link;
                console.log("Generated magiclink for existing user:", email);
              }
            } else {
              console.error("generate_link magiclink error:", mlRes.status, await mlRes.text());
            }
          }
        }
      } catch (linkErr) {
        console.error("generate_link exception:", String(linkErr));
        // Non-fatal — Brevo email still sends with static fallback URL
      }
    }
    // --------------------------------------------------------------------------

    const orgDisplay = org_name || "a workspace";
    const inviterDisplay = inviter_name || "Someone";

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ebebeb;border-radius:16px;overflow:hidden;">
<tr><td style="background:#0a0a0a;padding:20px 32px;">
  <span style="font-size:20px;font-weight:800;color:#ffffff;">Prod<span style="color:#f6c445;">Bod</span></span>
</td></tr>
<tr><td style="padding:36px 32px 28px;">
  <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0a0a0a;">You've been invited</p>
  <p style="margin:0 0 24px;font-size:14px;color:#525252;line-height:1.6;">
    <strong style="color:#0a0a0a;">${inviterDisplay}</strong> has invited
    <strong style="color:#0a0a0a;">${email}</strong> to join
    <strong style="color:#0a0a0a;">${orgDisplay}</strong> on ProdBod.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="background:#f6c445;border-radius:8px;">
      <a href="${inviteUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0a0a0a;text-decoration:none;">Accept invitation</a>
    </td></tr>
  </table>
  <p style="margin:0 0 4px;font-size:12px;color:#a3a3a3;">Or copy this link:</p>
  <p style="margin:0;font-size:11px;color:#525252;word-break:break-all;">
    <a href="${inviteUrl}" style="color:#525252;">${inviteUrl}</a>
  </p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #ebebeb;">
  <p style="margin:0;font-size:11px;color:#a3a3a3;line-height:1.6;">
    Sent to ${email}. If unexpected, ignore this. Link expires in 7 days.
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ProdBod", email: brevoSenderEmail },
        to: [{ email }],
        subject: `${inviterDisplay} invited you to ${orgDisplay} on ProdBod`,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error("Brevo error:", brevoRes.status, errBody);
      let parsedError: string;
      try { parsedError = JSON.parse(errBody)?.message || errBody; }
      catch { parsedError = errBody; }
      return new Response(
        JSON.stringify({ success: false, error: parsedError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoData = await brevoRes.json();
    return new Response(
      JSON.stringify({ success: true, messageId: brevoData.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", String(err));
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
