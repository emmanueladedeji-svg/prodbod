import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, token, org_name, inviter_name } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ error: "email and token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const redirectTo = `https://prodbod.vercel.app/invite?invite=${token}`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        invite_token: token,
        org_name: org_name ?? "",
        inviter_name: inviter_name ?? "",
      },
    });

    if (error) {
      // Non-fatal: user may already exist. The shareable link still works.
      console.error("inviteUserByEmail error:", error.message);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, userId: data.user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
