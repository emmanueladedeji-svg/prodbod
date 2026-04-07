import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Telescope, Plus } from 'lucide-react';
import { useVision } from '@/hooks/useVision';
import { useMarketSegments } from '@/hooks/useMarketSegments';
import { useBusinessObjectives } from '@/hooks/useBusinessObjectives';
import { useApp } from '@/contexts/AppContext';
import VisionWizard from '@/components/vision/VisionWizard';
import VisionStoryView from '@/components/vision/VisionStoryView';

export default function Vision() {
  const { currentProduct } = useApp();
  const { vision, isLoading, upsertVision, isSaving } = useVision();
  const { segments } = useMarketSegments();
  const { objectives } = useBusinessObjectives();
  const [isEditing, setIsEditing] = useState(false);

  if (!currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Select a product to define its vision.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  // Empty state
  if (!vision && !isEditing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Vision</h1>
          <p className="text-muted-foreground">Tell your product's transformation story</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border-2 border-dashed rounded-lg p-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Telescope className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No Vision Defined Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            A clear product vision aligns your team and grounds every strategic decision in purpose. Create yours through a guided storytelling experience.
          </p>
          <Button onClick={() => setIsEditing(true)} size="lg" className="gap-2">
            <Plus className="h-4 w-4" /> Create Vision Story
          </Button>
        </div>
      </div>
    );
  }

  // Wizard mode
  if (isEditing) {
    return (
      <VisionWizard
        initialData={vision}
        segments={segments}
        onSave={async (values) => {
          await upsertVision(values);
          setIsEditing(false);
        }}
        isSaving={isSaving}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // View mode
  return (
    <VisionStoryView
      vision={vision!}
      segments={segments}
      objectivesCount={objectives.length}
      onEdit={() => setIsEditing(true)}
    />
  );
}
