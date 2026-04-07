import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { MarketSegmentData } from '@/hooks/useMarketSegments';

interface AddSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<MarketSegmentData, 'id' | 'product_id' | 'created_at' | 'updated_at'>) => Promise<unknown>;
  initialData?: MarketSegmentData | null;
  isSaving?: boolean;
}

const defaultForm = {
  name: '',
  customer_type: '',
  industry: '',
  geography: '',
  competitive_intensity: 'Medium',
  strategic_importance: 'Medium',
  purchasing_power: '',
  notes: '',
  assumptions: '',
  population: 0,
  size: 0,
  tam: 0,
  sam: 0,
  som: 0,
  measurement_type: 'revenue',
  current_customers: 0,
  current_revenue: 0,
};

function formatCurrencyShort(val: number) {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toLocaleString()}`;
}

export function AddSegmentDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  isSaving,
}: AddSegmentDialogProps) {
  const [form, setForm] = useState(defaultForm);
  const [personas, setPersonas] = useState<string[]>([]);
  const [personaInput, setPersonaInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        customer_type: initialData.customer_type || '',
        industry: initialData.industry || '',
        geography: initialData.geography || '',
        competitive_intensity: initialData.competitive_intensity || 'Medium',
        strategic_importance: initialData.strategic_importance || 'Medium',
        purchasing_power: initialData.purchasing_power || '',
        notes: initialData.notes || '',
        assumptions: initialData.assumptions || '',
        population: initialData.population || 0,
        size: initialData.size || 0,
        tam: initialData.tam || 0,
        sam: initialData.sam || 0,
        som: initialData.som || 0,
        measurement_type: initialData.measurement_type || 'revenue',
        current_customers: initialData.current_customers || 0,
        current_revenue: initialData.current_revenue || 0,
      });
      // Parse comma-separated personas
      const existing = initialData.customer_type
        ? initialData.customer_type.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      setPersonas(existing);
    } else {
      setForm(defaultForm);
      setPersonas([]);
    }
    setPersonaInput('');
  }, [initialData, open]);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addPersona = () => {
    const val = personaInput.trim();
    if (val && !personas.includes(val)) {
      setPersonas(prev => [...prev, val]);
    }
    setPersonaInput('');
  };

  const removePersona = (idx: number) => {
    setPersonas(prev => prev.filter((_, i) => i !== idx));
  };

  // Coverage preview based on TAM
  const tamNum = Number(form.tam) || 0;
  const previewCoverage = (() => {
    if (!tamNum) return 0;
    const performance = form.measurement_type === 'customers'
      ? (Number(form.current_customers) || 0)
      : (Number(form.current_revenue) || 0);
    return Math.min(100, (performance / tamNum) * 100);
  })();

  const previewClassification = (() => {
    if (previewCoverage > 60) return 'Dominant';
    if (previewCoverage >= 20) return 'Growth Stage';
    if (previewCoverage >= 1) return 'Emerging';
    return 'Untapped';
  })();

  const classificationColor: Record<string, string> = {
    Dominant: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Growth Stage': 'bg-blue-100 text-blue-800 border-blue-300',
    Emerging: 'bg-purple-100 text-purple-800 border-purple-300',
    Untapped: 'bg-muted text-muted-foreground border-border',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerType = personas.join(', ');
    await onSave({
      ...form,
      customer_type: customerType,
      population: Number(form.population),
      size: Number(form.tam),
      tam: Number(form.tam),
      sam: Number(form.sam),
      som: form.som ? Number(form.som) : null,
      current_customers: Number(form.current_customers),
      current_revenue: Number(form.current_revenue),
    } as Omit<MarketSegmentData, 'id' | 'product_id' | 'created_at' | 'updated_at'>);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Segment' : 'Add Market Segment'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Segment Profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="seg-name">Segment Name <span className="text-destructive">*</span></Label>
                <Input
                  id="seg-name"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Fintech SMEs in West Africa"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Customer Type / Persona</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {personas.map((p, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                      {p}
                      <button type="button" onClick={() => removePersona(i)} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={personaInput}
                    onChange={(e) => setPersonaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPersona();
                      }
                    }}
                    placeholder="Type a persona and press Enter"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addPersona} disabled={!personaInput.trim()}>
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Add multiple personas e.g. Finance Director, Developer, CTO</p>
              </div>
              <div className="space-y-2">
                <Label>Industry / Category</Label>
                <Input
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                  placeholder="e.g. Financial Services, SaaS"
                />
              </div>
              <div className="space-y-2">
                <Label>Geography</Label>
                <Input
                  value={form.geography}
                  onChange={(e) => set('geography', e.target.value)}
                  placeholder="e.g. West Africa, Global, EU"
                />
              </div>
              <div className="space-y-2">
                <Label>Purchasing Power</Label>
                <Input
                  value={form.purchasing_power}
                  onChange={(e) => set('purchasing_power', e.target.value)}
                  placeholder="e.g. $5K–$50K ARR"
                />
              </div>
              <div className="space-y-2">
                <Label>Competitive Intensity</Label>
                <Select value={form.competitive_intensity} onValueChange={(v) => set('competitive_intensity', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strategic Importance</Label>
                <Select value={form.strategic_importance} onValueChange={(v) => set('strategic_importance', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes / Description</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Key characteristics, pain points, or strategic context…"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Market Size */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Market Size</h3>
            <div className="space-y-2">
              <Label>Measurement Type</Label>
              <Select value={form.measurement_type} onValueChange={(v) => set('measurement_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue ($)</SelectItem>
                  <SelectItem value="customers">Customer Count</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose whether you'll measure this segment by revenue or number of customers.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>TAM — Total Addressable</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.tam || ''}
                  onChange={(e) => set('tam', e.target.value)}
                  placeholder={form.measurement_type === 'revenue' ? '50000000' : '500000'}
                />
                <p className="text-xs text-muted-foreground">
                  {form.tam ? (form.measurement_type === 'revenue' ? formatCurrencyShort(Number(form.tam)) : `${Number(form.tam).toLocaleString()} customers`) : 'Full segment opportunity'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>SAM — Serviceable <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sam || ''}
                  onChange={(e) => set('sam', e.target.value)}
                  placeholder="10000000"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {form.sam ? (form.measurement_type === 'revenue' ? formatCurrencyShort(Number(form.sam)) : `${Number(form.sam).toLocaleString()} customers`) : 'Reachable portion of TAM'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>SOM — Obtainable (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.som || ''}
                  onChange={(e) => set('som', e.target.value)}
                  placeholder="1000000"
                />
                <p className="text-xs text-muted-foreground">Short-term realistic target</p>
              </div>
            </div>
          </div>

          {/* Current Performance */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Current Performance</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Current Customers</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.current_customers || ''}
                  onChange={(e) => set('current_customers', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Revenue ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.current_revenue || ''}
                  onChange={(e) => set('current_revenue', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Coverage Preview based on TAM */}
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">TAM Coverage Preview</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${classificationColor[previewClassification]}`}>
                  {previewClassification}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${previewCoverage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-12 text-right">
                  {previewCoverage.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                TAM coverage based on current {form.measurement_type === 'customers' ? 'customer count' : 'revenue'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !form.name}>
              {isSaving ? 'Saving…' : initialData ? 'Update Segment' : 'Add Segment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}