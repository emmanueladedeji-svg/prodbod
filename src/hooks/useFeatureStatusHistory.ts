import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus, FEATURE_STATUSES } from '@/types';
import { format, subWeeks, subMonths, subQuarters, startOfWeek, startOfMonth, startOfQuarter, startOfToday } from 'date-fns';

export function useFeatureStatusHistory(
  productId: string | null,
  period: 'week' | 'month' | 'year',
  referenceDate: Date = new Date()
) {
  return useQuery({
    queryKey: ['feature-status-history', productId, period, referenceDate.toISOString()],
    enabled: !!productId,
    queryFn: async () => {
      let startDate: Date;
      let dataPoints: number;
      let interval: 'day' | 'week' | 'month';

      if (period === 'week') {
        startDate = subWeeks(referenceDate, 4);
        dataPoints = 4;
        interval = 'week';
      } else if (period === 'month') {
        startDate = subMonths(referenceDate, 6);
        dataPoints = 6;
        interval = 'month';
      } else {
        startDate = subQuarters(referenceDate, 4);
        dataPoints = 4;
        interval = 'month'; // Year view shows quarters or months
      }

      // 1. Fetch snapshots
      const { data: snapshots, error } = await supabase
        .from('feature_status_snapshots')
        .select('*')
        .eq('product_id', productId!)
        .gte('snapshot_date', startDate.toISOString())
        .order('snapshot_date', { ascending: true });

      if (error) throw error;

      // 2. Fetch current status AND creation date for all features
      const { data: currentFeatures, error: cfError } = await (supabase as any)
        .from('workspace_features')
        .select(`
          id,
          created_at,
          product_statuses (
            name
          )
        `)
        .eq('product_id', productId!)
        .neq('level', 'task');

      if (cfError) console.error('Error fetching current features for history:', cfError);

      const mapStatus = (name: string): FeatureStatus | null => {
        const n = name.toLowerCase();
        if (n.includes('idea') || n.includes('problem')) return 'idea';
        if (n.includes('discovery') || n.includes('prototyping')) return 'discovery';
        if (n.includes('development')) return 'in_development';
        if (n.includes('testing')) return 'in_testing';
        if (n.includes('live')) return 'live';
        if (n.includes('closed')) return 'closed';
        return null;
      };

      const result: Array<{ label: string, counts: Record<FeatureStatus, number> }> = [];
      const today = startOfToday(); // Use today as cutoff

      // 3. Generate data points based on period
      if (period === 'week') {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const monthStart = new Date(year, month, 1);
        
        // Generate 4-5 weeks for the month of the referenceDate
        let weekStart = startOfWeek(monthStart);
        for (let i = 0; i < 5; i++) {
          const targetDate = weekStart;
          if (targetDate.getMonth() !== month && i > 0) break; // Stop if we've left the month

          const label = `W${i + 1}`;
          const isFuture = targetDate > today;
          
          const pointCounts: Record<FeatureStatus, number> = {
            idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0
          };

          if (!isFuture) {
            const dateStr = targetDate.toISOString().split('T')[0];
            const daySnapshots = snapshots?.filter(s => s.snapshot_date === dateStr);

            if (daySnapshots && daySnapshots.length > 0) {
              daySnapshots.forEach(s => {
                if (s.status in pointCounts) (pointCounts as any)[s.status] = s.count;
              });
            } else {
              (currentFeatures || []).forEach((f: any) => {
                const createdAt = new Date(f.created_at);
                if (createdAt <= targetDate) {
                  const statusObj = f.product_statuses;
                  const statusName = Array.isArray(statusObj) ? statusObj[0]?.name : statusObj?.name;
                  const mappedStatus = statusName ? mapStatus(statusName) : null;
                  if (mappedStatus) pointCounts[mappedStatus]++;
                }
              });
            }
          }
          result.push({ label, counts: pointCounts });
          weekStart = new Date(weekStart);
          weekStart.setDate(weekStart.getDate() + 7);
        }
      } else {
        // Monthly and Yearly periods
        for (let i = 0; i < dataPoints; i++) {
          let label = '';
          let targetDate: Date;

          if (period === 'month') {
            targetDate = subMonths(referenceDate, dataPoints - 1 - i);
            label = format(targetDate, 'MMM');
          } else {
            targetDate = subQuarters(referenceDate, dataPoints - 1 - i);
            label = `Q${(Math.floor(targetDate.getMonth() / 3) + 1)} ${format(targetDate, 'yy')}`;
          }

          const isFuture = targetDate > today;
          const pointCounts: Record<FeatureStatus, number> = {
            idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0
          };

          if (!isFuture) {
            const dateStr = targetDate.toISOString().split('T')[0];
            const daySnapshots = snapshots?.filter(s => s.snapshot_date === dateStr);

            if (daySnapshots && daySnapshots.length > 0) {
              daySnapshots.forEach(s => {
                if (s.status in pointCounts) (pointCounts as any)[s.status] = s.count;
              });
            } else {
              (currentFeatures || []).forEach((f: any) => {
                const createdAt = new Date(f.created_at);
                if (createdAt <= targetDate) {
                  const statusObj = f.product_statuses;
                  const statusName = Array.isArray(statusObj) ? statusObj[0]?.name : statusObj?.name;
                  const mappedStatus = statusName ? mapStatus(statusName) : null;
                  if (mappedStatus) pointCounts[mappedStatus]++;
                }
              });
            }
          }
          result.push({ label, counts: pointCounts });
        }
      }

      return result;
    }
  });
}
