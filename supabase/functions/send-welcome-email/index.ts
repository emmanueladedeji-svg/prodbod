import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, user_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "email is required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const brevoSenderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const supabaseUrlEnv = Deno.env.get("SUPABASE_URL") || "";

    const isLocalDev = supabaseUrlEnv.includes("127.0.0.1") || supabaseUrlEnv.includes("localhost");
    if (!brevoApiKey || !brevoSenderEmail) {
      if (isLocalDev) {
        console.log("[local-dev] Brevo not configured — skipping welcome email send.");
        return new Response(
          JSON.stringify({ success: true, local_only: true, message: "Local dev: welcome email skipped." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nameDisplay = user_name || "there";

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
  <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0a0a0a;">Welcome to ProdBod!</p>
  <p style="margin:0 0 24px;font-size:16px;color:#0a0a0a;line-height:1.6;font-weight:500;">
    Hi ${nameDisplay},
  </p>
  <p style="margin:0 0 24px;font-size:14px;color:#525252;line-height:1.6;">
    Welcome to ProdBod where visibility and Productivity are combined to help you achieve your objectives. Enjoy the feel.
  </p>
  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="background:#0a0a0a;border-radius:8px;">
      <a href="https://prodbod.vercel.app" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#f6c445;text-decoration:none;">Go to Dashboard</a>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #ebebeb;">
  <p style="margin:0;font-size:11px;color:#a3a3a3;line-height:1.6;">
    &copy; 2026 ProdBod. All rights reserved.
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
        subject: `Welcome to ProdBod!`,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error("Brevo error:", brevoRes.status, errBody);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
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
