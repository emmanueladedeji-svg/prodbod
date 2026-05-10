import { Feature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/hooks/useProductStatuses';

/**
 * Calculates progress percentage for a feature based on its descendants' statuses.
 */
export function calculateProgress(
  featureId: string,
  allFeatures: Feature[] = [],
  productStatuses: ProductStatus[] = []
): number {
  if (!allFeatures || allFeatures.length === 0) return 0;
  
  const allDescendants = getAllDescendants(featureId, allFeatures);
  if (allDescendants.length === 0) return 0;

  const doneStatusIds = new Set(
    (productStatuses || [])
      .filter(s => s && (s.category === 'done' || s.category === 'closed'))
      .map(s => s.id)
  );

  const doneCount = allDescendants.filter(f => f && f.status_id && doneStatusIds.has(f.status_id)).length;
  
  return Math.round((doneCount / allDescendants.length) * 100);
}

function getAllDescendants(parentId: string, allFeatures: Feature[]): Feature[] {
  const directChildren = allFeatures.filter(f => f && f.parent_id === parentId);
  let descendants = [...directChildren];
  
  for (const child of directChildren) {
    descendants = [...descendants, ...getAllDescendants(child.id, allFeatures)];
  }
  
  return descendants;
}
