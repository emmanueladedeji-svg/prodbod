import { useState, useEffect } from 'react';
import { useMarketTargets } from '@/hooks/useMarketTargets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Target, Plus, TrendingUp, DollarSign, Users, LayoutGrid, List, Save, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMarketModel } from '@/hooks/useMarketModel';
import { useMarketSegments, computeSegmentMetrics, getSegmentClassification, getCoveragePct, getRevenueCoveragePct } from '@/hooks/useMarketSegments';
import { useAllMarketTargets, getTargetProgress, getTargetStatus } from '@/hooks/useMarketTargets';
import { AddSegmentDialog } from '@/components/market/AddSegmentDialog';
import { SegmentCard } from '@/components/market/SegmentCard';
import { AddTargetDialog } from '@/components/market/AddTargetDialog';
import { useApp } from '@/contexts/AppContext';
import type { MarketSegmentData } from '@/hooks/useMarketSegments';

const SEGMENT_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(258, 90%, 66%)', 'hsl(238, 84%, 67%)',
  'hsl(199, 89%, 48%)', 'hsl(142, 76%, 45%)', 'hsl(25, 95%, 55%)',
];

const STATUS_COLORS: Record<string, string> = {
  Achieved: 'text-green-700 bg-green-50 border-green-200',
  'On Track': 'text-blue-700 bg-blue-50 border-blue-200',
  'At Risk': 'text-amber-700 bg-amber-50 border-amber-200',
  Behind: 'text-red-700 bg-red-50 border-red-200',
};

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

const METRIC_LABELS: Record<string, string> = {
  market_share_pct: 'Market Share %', revenue: 'Revenue',
  customer_count: 'Customers', penetration_pct: 'Penetration %',
};

export default function MarketModel() {
  const { currentProduct } = useApp();
  const { marketModel, isLoading: modelLoading, upsertMarketModel, isSaving: savingModel } = useMarketModel();
  const { segments, isLoading: segmentsLoading, createSegment, updateSegment, deleteSegment, isCreating } = useMarketSegments();

  const segmentIds = segments.map((s) => s.id);
  const { targets, isLoading: targetsLoading } = useAllMarketTargets(segmentIds);

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [editingSegment, setEditingSegment] = useState<MarketSegmentData | null>(null);
  const [addTargetSegment, setAddTargetSegment] = useState<MarketSegmentData | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Config form state
  const [horizon, setHorizon] = useState(String(marketModel?.time_horizon_years || 3));
  const [currency, setCurrency] = useState(marketModel?.currency || 'USD');

  // Sync config state from DB when marketModel loads
  useEffect(() => {
    if (marketModel) {
      setHorizon(String(marketModel.time_horizon_years || 3));
      setCurrency(marketModel.currency || 'USD');
    }
  }, [marketModel]);

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Select a product to view the market model.</p>
      </div>
    );
  }

  // Auto-aggregate from segments
  const aggregated = segments.reduce(
    (acc, seg) => {
      const m = computeSegmentMetrics(seg);
      acc.totalTam += m.tam_value;
      acc.totalSam += m.sam_value;
      acc.totalSom += m.som_value;
      acc.totalTamCustomers += m.tam_customers;
      acc.totalSamCustomers += m.sam_customers;
      acc.totalSomCustomers += m.som_customers;
      acc.totalCustomers += seg.current_customers || 0;
      acc.totalRevenue += seg.current_revenue || 0;
      return acc;
    },
    { totalTam: 0, totalSam: 0, totalSom: 0, totalTamCustomers: 0, totalSamCustomers: 0, totalSomCustomers: 0, totalCustomers: 0, totalRevenue: 0 }
  );

  const marketPenetration = aggregated.totalSomCustomers > 0
    ? (aggregated.totalCustomers / aggregated.totalSomCustomers) * 100 : 0;
  const revenueCapture = aggregated.totalSom > 0
    ? (aggregated.totalRevenue / aggregated.totalSom) * 100 : 0;

  const pieData = segments.map((seg) => {
    const m = computeSegmentMetrics(seg);
    return { name: seg.name, value: m.tam_customers, percentage: aggregated.totalTamCustomers ? ((m.tam_customers / aggregated.totalTamCustomers) * 100).toFixed(1) : '0' };
  });

  const filteredSegments = statusFilter === 'all' ? segments : segments.filter((s) => s.status === statusFilter);

  const handleSaveConfig = async () => {
    await upsertMarketModel({
      total_addressable_market: aggregated.totalTam,
      serviceable_addressable_market: aggregated.totalSam,
      serviceable_obtainable_market: aggregated.totalSom,
      time_horizon_years: Number(horizon) || 3,
      currency,
    });
  };

  const handleDeleteSegment = async (id: string) => {
    if (confirm('Delete this segment? Its targets will also be removed.')) {
      await deleteSegment(id);
    }
  };

  const isLoading = modelLoading || segmentsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Market Model</h1>
          <p className="text-muted-foreground">ARPU-based market intelligence with auto-calculated TAM/SAM/SOM</p>
        </div>
        <Button onClick={() => setShowAddSegment(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="h-4 w-4" />
          Add Segment
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">
            Segments
            {segments.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{segments.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="targets">
            Targets
            {targets.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{targets.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ── */}
        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
          ) : (
            <>
              {/* Aggregated Stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total TAM</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(aggregated.totalTamCustomers)}</div>
                    <p className="text-xs text-muted-foreground">customers across {segments.length} segments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total SAM</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(aggregated.totalSamCustomers)}</div>
                    <div className="flex items-center gap-2">
                      <Progress value={aggregated.totalTamCustomers ? (aggregated.totalSamCustomers / aggregated.totalTamCustomers) * 100 : 0} className="flex-1 h-1" />
                      <span className="text-xs text-muted-foreground">{aggregated.totalTamCustomers ? ((aggregated.totalSamCustomers / aggregated.totalTamCustomers) * 100).toFixed(0) : 0}% of TAM</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total SOM</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(aggregated.totalSomCustomers)}</div>
                    <p className="text-xs text-muted-foreground">target customers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Market Penetration</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{marketPenetration.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(aggregated.totalCustomers)} / {formatNumber(aggregated.totalSomCustomers)} customers
                    </p>
                    <p className="text-xs text-primary font-medium mt-1">
                      {formatNumber(Math.max(0, aggregated.totalSomCustomers - aggregated.totalCustomers))} remaining
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Second row: Revenue + Performance */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(aggregated.totalRevenue)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={revenueCapture} className="flex-1 h-1.5" />
                      <span className="text-xs text-muted-foreground">{revenueCapture.toFixed(1)}% of SOM</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Remaining: {formatCurrency(Math.max(0, aggregated.totalSom - aggregated.totalRevenue))}</p>
                    <p className="text-xs text-primary font-medium mt-0.5">{formatNumber(Math.max(0, aggregated.totalTamCustomers - aggregated.totalCustomers))} customers to cover</p>
                  </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Segment Distribution</CardTitle>
                    <CardDescription>TAM customer breakdown by segment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {segments.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                        Add segments to see distribution
                      </div>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" label={({ percentage }) => `${percentage}%`}>
                              {pieData.map((_, i) => <Cell key={i} fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatNumber(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Segment Coverage Bar Chart */}
              {segments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Segment Coverage Analytics</CardTitle>
                    <CardDescription>TAM customers vs acquired customers per segment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={segments.map((seg, i) => {
                          const m = computeSegmentMetrics(seg);
                          const tamCust = m.tam_customers;
                          const acquired = seg.current_customers || 0;
                          return {
                            name: seg.name.length > 15 ? seg.name.substring(0, 15) + '…' : seg.name,
                            TAM: tamCust,
                            Acquired: acquired,
                            Remaining: Math.max(0, tamCust - acquired),
                          };
                        })} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tickFormatter={(v: number) => formatNumber(v)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip formatter={(value: number) => formatNumber(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="TAM" fill="hsl(var(--primary))" opacity={0.2} radius={[4, 4, 0, 0]} name="TAM Customers" />
                          <Bar dataKey="Acquired" fill="hsl(142, 76%, 45%)" radius={[4, 4, 0, 0]} name="Acquired" />
                          <Bar dataKey="Remaining" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[4, 4, 0, 0]} name="Remaining" />
                          <Legend />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Config Card — time horizon + currency only */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Market Configuration</CardTitle>
                  <CardDescription>Time horizon and currency (TAM/SAM/SOM auto-aggregated from segments)</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                  <div className="space-y-1 w-40">
                    <Label>Time Horizon</Label>
                    <Select value={horizon} onValueChange={setHorizon}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year</SelectItem>
                        <SelectItem value="3">3 Years</SelectItem>
                        <SelectItem value="5">5 Years</SelectItem>
                        <SelectItem value="10">10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 w-40">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="NGN">NGN (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveConfig} disabled={savingModel} className="gap-2">
                    <Save className="h-4 w-4" />
                    {savingModel ? 'Saving…' : 'Save'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── SEGMENTS TAB ── */}
        <TabsContent value="segments" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {filteredSegments.length} segment{filteredSegments.length !== 1 ? 's' : ''}
              </p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">🟢 Active</SelectItem>
                  <SelectItem value="monitored">🟡 Monitored</SelectItem>
                  <SelectItem value="archived">⚪ Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('card')}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {segmentsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-64" />)}</div>
          ) : filteredSegments.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center border-2 border-dashed rounded-lg p-8">
              <Users className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No segments {statusFilter !== 'all' ? 'with this status' : 'defined yet'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define market segments with customer counts and ARPU for auto-calculated market sizing.
              </p>
              <Button onClick={() => setShowAddSegment(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Segment
              </Button>
            </div>
          ) : viewMode === 'card' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSegments.map((segment, i) => (
                <SegmentCard key={segment.id} segment={segment} color={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                  onEdit={() => setEditingSegment(segment)} onDelete={() => handleDeleteSegment(segment.id)} onAddTarget={() => setAddTargetSegment(segment)} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 font-medium">Segment</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">TAM</th>
                      <th className="text-right p-3 font-medium">SAM</th>
                      <th className="text-right p-3 font-medium">SOM</th>
                      <th className="text-right p-3 font-medium">Penetration</th>
                      <th className="text-left p-3 font-medium">Classification</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSegments.map((segment, i) => {
                      const cls = getSegmentClassification(segment);
                      const m = computeSegmentMetrics(segment);
                      const clsBadge: Record<string, string> = {
                        Dominant: 'bg-yellow-100 text-yellow-800', 'Growth Stage': 'bg-blue-100 text-blue-800',
                        Emerging: 'bg-purple-100 text-purple-800', Untapped: 'bg-muted text-muted-foreground',
                      };
                      return (
                        <tr key={segment.id} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length] }} />
                              <span className="font-medium">{segment.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-xs capitalize">{segment.status || 'active'}</span>
                          </td>
                          <td className="p-3 text-right">{formatCurrency(m.tam_value)}</td>
                          <td className="p-3 text-right">{formatCurrency(m.sam_value)}</td>
                          <td className="p-3 text-right">{formatCurrency(m.som_value)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={m.customer_penetration_pct} className="w-16 h-1.5" />
                              <span>{m.customer_penetration_pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${clsBadge[cls]}`}>{cls}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAddTargetSegment(segment)}>
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingSegment(segment)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSegment(segment.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TARGETS TAB ── */}
        <TabsContent value="targets" className="space-y-4">
          {targetsLoading ? (
            <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40" />)}</div>
          ) : targets.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] text-center border-2 border-dashed rounded-lg p-8">
              <Target className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No market targets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add targets from the Segments tab using the + button.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {segments.map((segment) => {
                const segTargets = targets.filter((t) => t.segment_id === segment.id);
                if (!segTargets.length) return null;
                return (
                  <div key={segment.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{segment.name}</h3>
                      <Badge variant="secondary" className="text-xs">{segTargets.length} target{segTargets.length !== 1 ? 's' : ''}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {segTargets.map((target) => {
                        const progress = getTargetProgress(target);
                        const status = getTargetStatus(target);
                        return (
                          <Card key={target.id} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-foreground">{target.name}</p>
                                <p className="text-xs text-muted-foreground">{METRIC_LABELS[target.metric_type] || target.metric_type}</p>
                              </div>
                              <div className="flex gap-2 items-center shrink-0">
                                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_COLORS[status]}`}>{status}</span>
                                <Badge variant="outline" className="text-xs capitalize">{target.priority}</Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold">{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current: {target.current_value?.toLocaleString() ?? '—'}</span>
                                <span>Target: {target.target_value.toLocaleString()}</span>
                              </div>
                            </div>
                            {(target.deadline || target.owner) && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
                                {target.deadline && <span>Due: {new Date(target.deadline).toLocaleDateString()}</span>}
                                {target.owner && <span>Owner: {target.owner}</span>}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddSegmentDialog open={showAddSegment} onOpenChange={setShowAddSegment} onSave={createSegment} isSaving={isCreating} />
      <AddSegmentDialog
        open={!!editingSegment} onOpenChange={(open) => !open && setEditingSegment(null)}
        onSave={async (data) => { if (editingSegment) await updateSegment({ ...data, id: editingSegment.id }); }}
        initialData={editingSegment}
      />
      {addTargetSegment && (
        <AddTargetDialogInner segment={addTargetSegment} onClose={() => setAddTargetSegment(null)} />
      )}
    </div>
  );
}

function AddTargetDialogInner({ segment, onClose }: { segment: MarketSegmentData; onClose: () => void }) {
  const { createTarget, isCreating } = useMarketTargets(segment.id);
  return (
    <AddTargetDialog open onOpenChange={(open) => !open && onClose()} segment={segment}
      onSave={async (data) => { await createTarget(data); }} isSaving={isCreating} />
  );
}
