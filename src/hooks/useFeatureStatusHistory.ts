import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus } from '@/types';
import { format, subWeeks, subMonths, subQuarters, startOfWeek, startOfToday } from 'date-fns';

function mapStatusFromEnum(enumVal: string): FeatureStatus | null {
  if (enumVal === 'idea_or_problem') return 'idea';
  if (enumVal === 'discovery' || enumVal === 'prototyping') return 'discovery';
  if (enumVal === 'in_development') return 'in_development';
  if (enumVal === 'in_testing') return 'in_testing';
  if (enumVal === 'live') return 'live';
  if (enumVal === 'closed') return 'closed';
  return null;
}

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

      if (period === 'week') {
        startDate = subWeeks(referenceDate, 4);
        dataPoints = 4;
      } else if (period === 'month') {
        startDate = subMonths(referenceDate, 6);
        dataPoints = 6;
      } else {
        startDate = subQuarters(referenceDate, 4);
        dataPoints = 4;
      }

      // 1. Fetch snapshots (table may not exist — swallow error and fall back to live data)
      const { data: snapshots, error: snapError } = await supabase
        .from('feature_status_snapshots')
        .select('*')
        .eq('product_id', productId!)
        .gte('snapshot_date', startDate.toISOString())
        .order('snapshot_date', { ascending: true });

      if (snapError) {
        console.warn('feature_status_snapshots unavailable:', snapError.message);
      }

      // 2. Fetch current status + creation date using the reliable status enum column
      const { data: currentFeatures, error: cfError } = await (supabase as any)
        .from('workspace_features')
        .select('id, status, created_at')
        .eq('product_id', productId!)
        .neq('level', 'task');

      if (cfError) console.error('Error fetching features for history:', cfError);

      const emptyPoint = (): Record<FeatureStatus, number> => ({
        idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0,
      });

      const result: Array<{ label: string; counts: Record<FeatureStatus, number> }> = [];
      const today = startOfToday();

      if (period === 'week') {
        const year = referenceDate.getFullYear();
        const month = referenceDate.getMonth();
        const monthStart = new Date(year, month, 1);
        let weekStart = startOfWeek(monthStart);

        for (let i = 0; i < 5; i++) {
          const targetDate = weekStart;
          if (targetDate.getMonth() !== month && i > 0) break;

          const label = `W${i + 1}`;
          const isFuture = targetDate > today;
          const pointCounts = emptyPoint();

          if (!isFuture) {
            const dateStr = targetDate.toISOString().split('T')[0];
            const daySnapshots = snapshots?.filter(s => s.snapshot_date === dateStr);

            if (daySnapshots && daySnapshots.length > 0) {
              daySnapshots.forEach(s => {
                if (s.status in pointCounts) (pointCounts as any)[s.status] = s.count;
              });
            } else {
              (currentFeatures || []).forEach((f: any) => {
                if (new Date(f.created_at) <= targetDate) {
                  const mapped = mapStatusFromEnum(f.status);
                  if (mapped) pointCounts[mapped]++;
                }
              });
            }
          }

          result.push({ label, counts: pointCounts });
          weekStart = new Date(weekStart);
          weekStart.setDate(weekStart.getDate() + 7);
        }
      } else {
        for (let i = 0; i < dataPoints; i++) {
          let label = '';
          let targetDate: Date;

          if (period === 'month') {
            targetDate = subMonths(referenceDate, dataPoints - 1 - i);
            label = format(targetDate, 'MMM');
          } else {
            targetDate = subQuarters(referenceDate, dataPoints - 1 - i);
            label = `Q${Math.floor(targetDate.getMonth() / 3) + 1} ${format(targetDate, 'yy')}`;
          }

          const isFuture = targetDate > today;
          const pointCounts = emptyPoint();

          if (!isFuture) {
            const dateStr = targetDate.toISOString().split('T')[0];
            const daySnapshots = snapshots?.filter(s => s.snapshot_date === dateStr);

            if (daySnapshots && daySnapshots.length > 0) {
              daySnapshots.forEach(s => {
                if (s.status in pointCounts) (pointCounts as any)[s.status] = s.count;
              });
            } else {
              (currentFeatures || []).forEach((f: any) => {
                if (new Date(f.created_at) <= targetDate) {
                  const mapped = mapStatusFromEnum(f.status);
                  if (mapped) pointCounts[mapped]++;
                }
              });
            }
          }

          result.push({ label, counts: pointCounts });
        }
      }

      return result;
    },
  });
}
