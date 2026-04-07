import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketSegmentData {
  id: string;
  product_id: string;
  name: string;
  customer_type: string | null;
  industry: string | null;
  geography: string | null;
  location: string | null;
  competitive_intensity: string | null;
  strategic_importance: string | null;
  purchasing_power: string | null;
  notes: string | null;
  assumptions: string | null;
  population: number;
  size: number;
  // ARPU-based inputs
  tam_customers: number;
  tam_arpu: number;
  sam_customers: number;
  sam_arpu: number;
  som_capture_pct: number;
  // Computed values (stored)
  tam: number;
  sam: number;
  som: number | null;
  measurement_type: string;
  current_customers: number;
  current_revenue: number;
  // Lifecycle
  status: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type SegmentClassification = 'Dominant' | 'Growth Stage' | 'Emerging' | 'Untapped';

/** Compute derived values from ARPU inputs */
export function computeSegmentMetrics(seg: Partial<MarketSegmentData>) {
  const tamCustomers = seg.tam_customers || 0;
  const tamArpu = seg.tam_arpu || 0;
  const samCustomers = seg.sam_customers || 0;
  const samArpu = seg.sam_arpu || tamArpu;
  const somCapturePct = seg.som_capture_pct || 0;

  // Fallback to stored tam/sam/som when ARPU fields are zero
  const tamValue = (tamCustomers && tamArpu) ? tamCustomers * tamArpu : (seg.tam || 0);
  const samValue = (samCustomers && samArpu) ? samCustomers * samArpu : (seg.sam || 0);
  const somCustomers = somCapturePct ? Math.round(samCustomers * (somCapturePct / 100)) : 0;
  const somValue = somCapturePct ? samValue * (somCapturePct / 100) : (seg.som || 0);

  const currentCustomers = seg.current_customers || 0;
  const currentRevenue = seg.current_revenue || 0;

  const customerPenetrationPct = somCustomers > 0 ? (currentCustomers / somCustomers) * 100 : 0;
  const revenueCapturePct = somValue > 0 ? (currentRevenue / somValue) * 100 : 0;

  return {
    tam_customers: tamCustomers || (seg.population || 0),
    sam_customers: samCustomers,
    tam_value: tamValue,
    sam_value: samValue,
    som_customers: somCustomers,
    som_value: somValue,
    customer_penetration_pct: Math.min(100, customerPenetrationPct),
    revenue_capture_pct: Math.min(100, revenueCapturePct),
  };
}

export function getSegmentClassification(segment: MarketSegmentData): SegmentClassification {
  const metrics = computeSegmentMetrics(segment);
  const penetration = metrics.customer_penetration_pct;
  if (metrics.som_customers === 0 && (segment.current_customers || 0) === 0) return 'Untapped';
  if (penetration > 60) return 'Dominant';
  if (penetration >= 20) return 'Growth Stage';
  if (penetration >= 1) return 'Emerging';
  return 'Untapped';
}

/** Customer penetration % (acquired / SOM customers) */
export function getCoveragePct(segment: MarketSegmentData): number {
  const metrics = computeSegmentMetrics(segment);
  return metrics.customer_penetration_pct;
}

/** Revenue capture % (revenue / SOM value) */
export function getRevenueCoveragePct(segment: MarketSegmentData): number {
  const metrics = computeSegmentMetrics(segment);
  return metrics.revenue_capture_pct;
}

export function getTamReachPct(segment: MarketSegmentData): number {
  const metrics = computeSegmentMetrics(segment);
  if (metrics.tam_value === 0) return 0;
  return Math.min(100, ((segment.current_revenue || 0) / metrics.tam_value) * 100);
}

export function useMarketSegments() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['market_segments', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('market_segments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MarketSegmentData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Omit<MarketSegmentData, 'id' | 'product_id' | 'created_at' | 'updated_at'>) => {
      if (!productId) throw new Error('No product selected');
      // Auto-compute stored TAM/SAM/SOM values
      const computed = computeSegmentMetrics(values);
      const { data, error } = await supabase
        .from('market_segments')
        .insert({
          ...values,
          product_id: productId,
          tam: computed.tam_value,
          sam: computed.sam_value,
          som: computed.som_value,
          size: computed.tam_value,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_segments', productId] });
      toast({ title: 'Segment created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating segment', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<MarketSegmentData> & { id: string }) => {
      // Auto-compute stored TAM/SAM/SOM values
      const computed = computeSegmentMetrics(values);
      const { data, error } = await supabase
        .from('market_segments')
        .update({
          ...values,
          tam: computed.tam_value,
          sam: computed.sam_value,
          som: computed.som_value,
          size: computed.tam_value,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_segments', productId] });
      toast({ title: 'Segment updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating segment', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('market_segments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_segments', productId] });
      toast({ title: 'Segment deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting segment', description: error.message, variant: 'destructive' });
    },
  });

  return {
    segments,
    isLoading,
    createSegment: createMutation.mutateAsync,
    updateSegment: updateMutation.mutateAsync,
    deleteSegment: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
