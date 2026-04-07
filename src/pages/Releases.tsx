import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Calendar, Plus, Loader2 } from 'lucide-react';
import { useReleases } from '@/hooks/useReleases';
import { useFeatures } from '@/hooks/useFeatures';
import { CreateReleaseDialog } from '@/components/features/CreateReleaseDialog';

const STATUS_COLORS: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info',
  released: 'bg-success/10 text-success',
  archived: 'bg-muted text-muted-foreground',
};

export default function Releases() {
  const { releases, isLoading } = useReleases();
  const { features } = useFeatures();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Releases</h1>
          <p className="text-muted-foreground">Track product releases and their progress</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Release
        </Button>
      </div>

      {releases.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No releases yet</h3>
            <p className="text-muted-foreground mb-4">Create releases to group and track feature deployment</p>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Release
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {releases.map(release => {
          const mappedFeatures = features.filter(f => f.release_id === release.id);

          return (
            <Card key={release.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {release.version || 'Release'}
                        <Badge className={STATUS_COLORS[release.status] || ''} variant="secondary">
                          {release.status}
                        </Badge>
                        <Badge variant="outline">{release.release_type}</Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {release.target_date && (
                          <>
                            <Calendar className="h-4 w-4" />
                            Target: {release.target_date}
                          </>
                        )}
                        <span>· {mappedFeatures.length} features</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={release.progress} className="h-2 w-24" />
                    <span className="text-sm font-medium">{release.progress}%</span>
                  </div>
                </div>
              </CardHeader>
              {(release.goal || mappedFeatures.length > 0) && (
                <CardContent className="space-y-3">
                  {release.goal && <p className="text-sm text-muted-foreground">{release.goal}</p>}
                  {mappedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {mappedFeatures.map(f => (
                        <Badge key={f.id} variant="outline">{f.feature_code} {f.name}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <CreateReleaseDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
