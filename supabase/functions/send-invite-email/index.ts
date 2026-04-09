import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, token, org_name, inviter_name } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "email and token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY secret not set");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviteUrl = `https://prodbod.vercel.app/invite?invite=${token}`;
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

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ProdBod <onboarding@resend.dev>",
        to: [email],
        subject: `${inviterDisplay} invited you to ${orgDisplay} on ProdBod`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", resendRes.status, errBody);
      return new Response(
        JSON.stringify({ success: false, error: `Resend API ${resendRes.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendData = await resendRes.json();
    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
