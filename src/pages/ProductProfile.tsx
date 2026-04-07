import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Globe, Users, Edit, Save, Loader2, Target, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateProduct } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import MarketModel from '@/pages/MarketModel';

export default function ProductProfile() {
  const { currentProduct, setCurrentProduct } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const productId = currentProduct?.id;

  // Sync edit fields when product changes
  useEffect(() => {
    if (currentProduct) {
      setEditName(currentProduct.name);
      setEditUrl(currentProduct.url || '');
      setEditDescription(currentProduct.description || '');
    }
  }, [currentProduct]);

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ['product-team-members', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data: ptData, error: ptErr } = await supabase
        .from('product_teams')
        .select('team_id')
        .eq('product_id', productId!);
      if (ptErr) throw ptErr;
      if (!ptData || ptData.length === 0) return [];

      const teamIds = ptData.map(pt => pt.team_id);
      const { data: members, error: memErr } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds);
      if (memErr) throw memErr;
      return members || [];
    },
  });

  if (!currentProduct) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No product selected</h2>
        <p className="text-muted-foreground">Select or create a product from the sidebar.</p>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      const updated = await updateProduct.mutateAsync({
        id: currentProduct.id,
        name: editName,
        url: editUrl,
        description: editDescription,
      });
      setCurrentProduct(updated);
      setIsEditing(false);
      toast({ title: 'Product updated successfully' });
    } catch (err: any) {
      toast({ title: 'Error updating product', description: err.message, variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditName(currentProduct.name);
    setEditUrl(currentProduct.url || '');
    setEditDescription(currentProduct.description || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{currentProduct.name}</h1>
        <p className="text-muted-foreground">Product settings and configuration</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <Building2 className="h-4 w-4" />
            Product Profile
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-2">
            <Target className="h-4 w-4" />
            Market Model
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateProduct.isPending || !editName.trim()} className="gap-2">
                  <Save className="h-4 w-4" /> {updateProduct.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            )}
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>Basic information about your product</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  {isEditing ? (
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    <p className="text-foreground font-medium">{currentProduct.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Product URL</Label>
                  {isEditing ? (
                    <Input id="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://" />
                  ) : (
                    <a
                      href={currentProduct.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {currentProduct.url || 'Not set'}
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea id="description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} placeholder="Describe your product..." />
                ) : (
                  <p className="text-muted-foreground">{currentProduct.description || 'No description'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Product Team</CardTitle>
                  <CardDescription>Team members assigned to this product</CardDescription>
                </div>
                {teamMembers.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {teamMembers.length} members
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : teamMembers.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {teamMembers.map(m => {
                    const initials = m.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                    return (
                      <div key={m.id} className="flex items-center gap-2 bg-muted/40 border border-border rounded-full px-3 py-1.5">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold">
                          {initials}
                        </div>
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        {m.role && <Badge variant="secondary" className="text-xs py-0">{m.role}</Badge>}
                      </div>
                    );
                  })}
                </div>
              ) : currentProduct.product_manager_name ? (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {currentProduct.product_manager_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{currentProduct.product_manager_name}</p>
                    <p className="text-xs text-muted-foreground">Product Manager</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-lg">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">No team assigned yet</p>
                    <p className="text-sm text-muted-foreground">Assign teams to this product to see members here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  <span className="text-foreground">
                    {currentProduct.created_at ? new Date(currentProduct.created_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Last updated:</span>{' '}
                  <span className="text-foreground">
                    {currentProduct.updated_at ? new Date(currentProduct.updated_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="mt-6">
          <MarketModel />
        </TabsContent>
      </Tabs>
    </div>
  );
}