import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date().toISOString().split("T")[0];

    const { data: products, error: pErr } = await supabase.from("products").select("id");
    if (pErr) throw pErr;

    let totalSnapshots = 0;
    const errors: string[] = [];

    for (const product of products || []) {
      try {
        const { data: features, error: fErr } = await supabase
          .from("workspace_features")
          .select(`
            id,
            product_statuses!workspace_features_status_id_fkey (
              name
            )
          `)
          .eq("product_id", product.id)
          .neq("level", "task"); // EXCLUDE TASKS FROM SNAPSHOTS

        if (fErr) {
          // Fallback if relationship name is different
          const { data: fallbackFeatures } = await supabase
            .from("workspace_features")
            .select(`id, product_statuses(name)`)
            .eq("product_id", product.id)
            .neq("level", "task");
          
          processFeatures(product.id, fallbackFeatures || []);
        } else {
          processFeatures(product.id, features || []);
        }

        async function processFeatures(prodId: string, featureList: any[]) {
          const mapStatus = (name: string): string | null => {
            const n = name.toLowerCase();
            if (n.includes('idea') || n.includes('problem')) return 'idea';
            if (n.includes('discovery') || n.includes('prototyping')) return 'discovery';
            if (n.includes('development')) return 'in_development';
            if (n.includes('testing')) return 'in_testing';
            if (n.includes('live')) return 'live';
            if (n.includes('closed')) return 'closed';
            return null;
          };

          const counts: Record<string, number> = {
            idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0
          };

          featureList.forEach((f: any) => {
            const statusName = f.product_statuses?.name || (Array.isArray(f.product_statuses) ? f.product_statuses[0]?.name : null);
            const mappedStatus = statusName ? mapStatus(statusName) : null;
            if (mappedStatus && mappedStatus in counts) {
              counts[mappedStatus]++;
            }
          });

          const snapshots = Object.entries(counts).map(([status, count]) => ({
            product_id: prodId,
            snapshot_date: today,
            status,
            count,
          }));

          if (snapshots.length > 0) {
            const { error: uErr } = await supabase
              .from("feature_status_snapshots")
              .upsert(snapshots, { onConflict: "product_id, snapshot_date, status" });

            if (uErr) errors.push(`Product ${prodId} upsert: ${uErr.message}`);
            else totalSnapshots += snapshots.length;
          }
        }
      } catch (productErr) {
        errors.push(`Product ${product.id}: ${String(productErr)}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, snapshot_date: today, products_processed: (products || []).length, snapshots_upserted: totalSnapshots, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
