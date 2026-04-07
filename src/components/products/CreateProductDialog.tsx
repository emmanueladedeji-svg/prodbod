import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Building2, Users, ChevronRight, ChevronLeft, CheckCircle2, Package, ClipboardList } from 'lucide-react';
import { useCreateProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { TeamStep } from './TeamStep';
import {
  ProductTeamData,
  EMPTY_TEAM_DATA,
  saveProductTeam,
  loadOrgMembers,
  MOCK_TEAM_DIRECTORY,
  getUserById,
} from '@/data/mockTeamDirectory';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onCreated?: (product: { id: string; name: string }) => void;
}

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 1, label: 'Product Details', Icon: Package },
  { id: 2, label: 'Assign Team', Icon: Users },
  { id: 3, label: 'Review', Icon: ClipboardList },
];

export function CreateProductDialog({ open, onOpenChange, organizationId, onCreated }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [teamData, setTeamData] = useState<ProductTeamData>(EMPTY_TEAM_DATA);
  const createProduct = useCreateProduct();

  // Only org members can be assigned to a product team
  const allowedUserIds = loadOrgMembers(organizationId);

  const resetForm = () => {
    setStep(1);
    setName('');
    setUrl('');
    setDescription('');
    setTeamData(EMPTY_TEAM_DATA);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const step1Valid = name.trim().length > 0;
  const step2Valid =
    teamData.selectedMemberIds.length > 0 &&
    !!teamData.productManager &&
    !!teamData.scrumMaster &&
    !!teamData.leadDeveloper &&
    !!teamData.leadDesigner;

  const handleNext = () => {
    if (step === 1 && step1Valid) setStep(2);
    else if (step === 2 && step2Valid) setStep(3);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    try {
      const pmUser = getUserById(teamData.productManager!);
      const product = await createProduct.mutateAsync({
        organization_id: organizationId,
        name: name.trim(),
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        product_manager_name: pmUser?.name,
      });

      saveProductTeam(product.id, teamData);

      toast.success('Product created successfully!');
      onCreated?.({ id: product.id, name: product.name });
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create product');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="pb-3">
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Define your product identity and basic information.'}
            {step === 2 && 'Select team members and assign key leadership roles.'}
            {step === 3 && 'Review your product setup before creating.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center px-1 py-3 border-b border-border mb-3">
          {STEPS.map(({ id, label, Icon }, i) => {
            const isActive = step === id;
            const isDone = step > id;
            return (
              <div key={id} className="flex items-center flex-1">
                <div className={cn(
                  'flex items-center gap-2 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : isDone ? 'text-primary/70' : 'text-muted-foreground'
                )}>
                  <div className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0',
                    isActive ? 'border-primary bg-primary text-primary-foreground' :
                    isDone ? 'border-primary/70 bg-primary/10 text-primary' :
                    'border-border bg-muted text-muted-foreground'
                  )}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2 transition-colors', isDone ? 'bg-primary/40' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {step === 1 && (
            <div className="grid gap-4 pb-2">
              <div className="grid gap-2">
                <Label htmlFor="prod-name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prod-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. REST ERP"
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prod-url">URL</Label>
                <Input
                  id="prod-url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prod-desc">Description</Label>
                <Textarea
                  id="prod-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this product do?"
                  rows={4}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <TeamStep teamData={teamData} onChange={setTeamData} allowedUserIds={allowedUserIds} />
          )}

          {step === 3 && (
            <ReviewStep name={name} url={url} description={description} teamData={teamData} />
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-border mt-3">
          <div>
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                className="gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={createProduct.isPending}>
                {createProduct.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Review Step ────────────────────────────────────────────────────────────

function ReviewStep({
  name, url, description, teamData,
}: {
  name: string;
  url: string;
  description: string;
  teamData: ProductTeamData;
}) {
  const selectedUsers = MOCK_TEAM_DIRECTORY.filter(u => teamData.selectedMemberIds.includes(u.id));
  const leadershipMap = [
    { label: 'Product Manager', id: teamData.productManager },
    { label: 'Scrum Master', id: teamData.scrumMaster },
    { label: 'Lead Developer', id: teamData.leadDeveloper },
    { label: 'Lead Designer', id: teamData.leadDesigner },
  ];

  return (
    <div className="space-y-4 pb-2">
      {/* Product details */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Product Details</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Name</span>
            <span className="font-medium text-foreground">{name}</span>
          </div>
          {url && (
            <div>
              <span className="text-muted-foreground block text-xs mb-0.5">URL</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-xs hover:underline truncate">
                <Globe className="h-3 w-3" /> {url}
              </a>
            </div>
          )}
        </div>
        {description && (
          <div>
            <span className="text-muted-foreground block text-xs mb-0.5">Description</span>
            <p className="text-sm text-foreground">{description}</p>
          </div>
        )}
      </div>

      {/* Leadership roles */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Leadership Roles</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {leadershipMap.map(({ label, id }) => {
            const user = id ? getUserById(id) : null;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={cn(
                  'h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
                  user?.avatarColor ?? 'from-muted to-muted-foreground'
                )}>
                  {user?.initials ?? '?'}
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{user?.name ?? '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full team */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Full Team</span>
          </div>
          <Badge variant="secondary">{selectedUsers.length} members</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map(u => (
            <div key={u.id} className="flex items-center gap-1.5 bg-muted/40 border border-border rounded-full px-2.5 py-1">
              <div className={cn(
                'h-5 w-5 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[9px] font-bold',
                u.avatarColor
              )}>
                {u.initials}
              </div>
              <span className="text-xs font-medium text-foreground">{u.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
