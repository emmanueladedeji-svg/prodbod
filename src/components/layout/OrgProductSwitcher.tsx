import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  Settings,
  Users,
  Plus,
  Search,
  Check,
  Package,
} from 'lucide-react';
import { CreateOrganizationDialog } from '@/components/organizations/CreateOrganizationDialog';
import { CreateProductDialog } from '@/components/products/CreateProductDialog';
import { ProductTeamSheet } from '@/components/products/ProductTeamSheet';
import { OrgPeopleSheet } from '@/components/organizations/OrgPeopleSheet';
import { DbOrganization } from '@/hooks/useOrganizations';
import { DbProduct } from '@/hooks/useProducts';

/* ── deterministic avatar color from org/product name ── */
const AVATAR_COLORS = [
  'from-blue-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-700',
  'from-rose-500 to-pink-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-sky-700',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function InitialsBadge({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = { sm: 'h-6 w-6 text-xs', md: 'h-8 w-8 text-sm', lg: 'h-10 w-10 text-base' };
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className={`bg-gradient-to-br ${avatarColor(name)} ${sizeClasses[size]} rounded-md flex items-center justify-center font-bold text-white shrink-0`}
    >
      {initials}
    </div>
  );
}

export function OrgProductSwitcher() {
  const navigate = useNavigate();
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    products,
    currentProduct,
    setCurrentProduct,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [teamSheetProductId, setTeamSheetProductId] = useState<string | null>(null);
  const [showOrgPeople, setShowOrgPeople] = useState(false);

  const filteredOrgs = organizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSwitchOrg = (org: DbOrganization) => {
    setCurrentOrganization(org);
    setOpen(false);
    setSearch('');
  };

  const handleSwitchProduct = (product: DbProduct) => {
    setCurrentProduct(product);
    setOpen(false);
  };

  const handleProductSettings = (product: DbProduct) => {
    setCurrentProduct(product);
    setOpen(false);
    navigate('/product-profile');
  };

  const handleProductTeam = (productId: string) => {
    setTeamSheetProductId(productId);
    // keep popover open so the sheet overlays
    setOpen(false);
  };

  const teamSheetProduct = products.find((p) => p.id === teamSheetProductId) ?? null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 w-full rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors text-sidebar-foreground group"
            aria-label="Switch organization or product"
          >
            {currentOrganization ? (
              <InitialsBadge name={currentOrganization.name} size="md" />
            ) : (
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate leading-tight">
                {currentOrganization?.name ?? 'Select organization'}
              </p>
              {currentProduct && (
                <p className="text-xs text-muted-foreground truncate leading-tight">
                  {currentProduct.name}
                </p>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 group-data-[state=open]:rotate-180 transition-transform" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={4}
          className="w-80 p-0 bg-popover border border-border shadow-xl z-[200] rounded-xl overflow-hidden"
          style={{ minWidth: '20rem' }}
        >
          {/* ── Current Organization Header ── */}
          {currentOrganization && (
            <div className="p-4 bg-muted/40">
              <div className="flex items-center gap-3 mb-3">
                <InitialsBadge name={currentOrganization.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {currentOrganization.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {products.length} product{products.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1.5"
                  onClick={() => { setOpen(false); navigate('/settings'); }}
                >
                  <Settings className="h-3 w-3" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1.5"
                  onClick={() => { setOpen(false); setShowOrgPeople(true); }}
                >
                  <Users className="h-3 w-3" />
                  People
                </Button>
              </div>
            </div>
          )}

          {/* ── Products Section ── */}
          {currentOrganization && (
            <>
              <Separator />
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Products
                </p>
                <div className="space-y-0.5">
                  {products.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                      No products yet
                    </p>
                  )}
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 group/row cursor-pointer transition-colors ${
                        currentProduct?.id === product.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-muted/60'
                      }`}
                      onClick={() => handleSwitchProduct(product)}
                    >
                      <InitialsBadge name={product.name} size="sm" />
                      <span className="flex-1 text-sm font-medium truncate text-foreground">
                        {product.name}
                      </span>
                      {currentProduct?.id === product.id && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      {/* Action icons — visible on hover */}
                      <div className="flex gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <button
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Product settings"
                          onClick={(e) => { e.stopPropagation(); handleProductSettings(product); }}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="h-6 w-6 rounded flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Manage team"
                          onClick={(e) => { e.stopPropagation(); handleProductTeam(product.id); }}
                        >
                          <Users className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add new product */}
                  <button
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 w-full text-left hover:bg-muted/60 transition-colors group/add"
                    onClick={() => { setOpen(false); setShowCreateProduct(true); }}
                  >
                    <div className="h-6 w-6 rounded-md border-2 border-dashed border-border flex items-center justify-center shrink-0 group-hover/add:border-primary transition-colors">
                      <Plus className="h-3 w-3 text-muted-foreground group-hover/add:text-primary transition-colors" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover/add:text-foreground transition-colors">
                      Add product
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Switch Organization Section ── */}
          <Separator />
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Switch Organization
              </p>
              <Search className="h-3 w-3 text-muted-foreground" />
            </div>

            {organizations.length > 3 && (
              <div className="px-2 mb-2">
                <Input
                  placeholder="Search organizations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            )}

            <div className="space-y-0.5 max-h-40 overflow-y-auto">
              {filteredOrgs.map((org) => (
                <button
                  key={org.id}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 w-full text-left transition-colors ${
                    currentOrganization?.id === org.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'hover:bg-muted/60'
                  }`}
                  onClick={() => handleSwitchOrg(org)}
                >
                  <InitialsBadge name={org.name} size="sm" />
                  <span className="flex-1 text-sm font-medium truncate text-foreground">
                    {org.name}
                  </span>
                  {currentOrganization?.id === org.id && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </button>
              ))}

              {filteredOrgs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No match</p>
              )}
            </div>

            {/* Create org */}
            <Separator className="my-2" />
            <button
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 w-full text-left hover:bg-muted/60 transition-colors group/new"
              onClick={() => { setOpen(false); setShowCreateOrg(true); }}
            >
              <div className="h-6 w-6 rounded-md border-2 border-dashed border-border flex items-center justify-center shrink-0 group-hover/new:border-primary transition-colors">
                <Plus className="h-3 w-3 text-muted-foreground group-hover/new:text-primary transition-colors" />
              </div>
              <span className="text-sm text-muted-foreground group-hover/new:text-foreground transition-colors">
                Create organization
              </span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialogs */}
      <CreateOrganizationDialog
        open={showCreateOrg}
        onOpenChange={setShowCreateOrg}
        onCreated={(org) => {
          const fullOrg: DbOrganization = {
            id: org.id,
            name: org.name,
            description: null,
            created_at: '',
            updated_at: '',
          };
          setCurrentOrganization(fullOrg);
        }}
      />

      {currentOrganization && (
        <CreateProductDialog
          open={showCreateProduct}
          onOpenChange={setShowCreateProduct}
          organizationId={currentOrganization.id}
          onCreated={(product) => {
            const fullProduct: DbProduct = {
              id: product.id,
              name: product.name,
              organization_id: currentOrganization.id,
              url: null,
              description: null,
              product_manager_name: null,
              created_at: '',
              updated_at: '',
            };
            setCurrentProduct(fullProduct);
          }}
        />
      )}

      {/* Team Sheet */}
      <ProductTeamSheet
        product={teamSheetProduct}
        organizationId={currentOrganization?.id ?? ''}
        open={!!teamSheetProductId}
        onOpenChange={(v) => { if (!v) setTeamSheetProductId(null); }}
      />

      {/* Org People Sheet */}
      {currentOrganization && (
        <OrgPeopleSheet
          orgId={currentOrganization.id}
          orgName={currentOrganization.name}
          open={showOrgPeople}
          onOpenChange={setShowOrgPeople}
        />
      )}
    </>
  );
}
