import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to manually trigger a snapshot of current feature status counts.
 * In production, this would typically run on a cron schedule via Edge Functions.
 */
export async function snapshotFeatureStatuses() {
  // Since we need to join products to features, we'll do this in the DB if possible,
  // or fetch and process in JS.
  
  const { data: products, error: pErr } = await supabase.from('products').select('id');
  if (pErr) throw pErr;

  const today = new Date().toISOString().split('T')[0];

  for (const product of products) {
    // Get business objectives -> strategies -> product objectives -> features chain
    // To simplify for the utility, we'll fetch features that belong to this product's hierarchy
    
    const { data: pos } = await supabase
      .from('product_objectives')
      .select('id, strategies!inner(business_objectives!inner(product_id))')
      .eq('strategies.business_objectives.product_id', product.id);
    
    const poIds = (pos || []).map((p: any) => p.id);
    if (poIds.length === 0) continue;

    const { data: features, error: fErr } = await supabase
      .from('features')
      .select('status')
      .in('product_objective_id', poIds);
    
    if (fErr) continue;

    const counts: Record<string, number> = {};
    features.forEach(f => {
      counts[f.status] = (counts[f.status] || 0) + 1;
    });

    const snapshots = Object.entries(counts).map(([status, count]) => ({
      product_id: product.id,
      snapshot_date: today,
      status,
      count
    }));

    if (snapshots.length > 0) {
      await supabase
        .from('feature_status_snapshots')
        .upsert(snapshots, { onConflict: 'product_id, snapshot_date, status' });
    }
  }
}
