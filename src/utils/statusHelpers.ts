import { Feature } from '@/hooks/useWorkspaceFeatures';
import { ProductStatus } from '@/types/productStatus';

/**
 * Calculate completion percentage for a feature based on its descendants' statuses.
 * Done = status category is 'done' or 'closed'.
 */
export function calculateProgress(
  featureId: string,
  allFeatures: Feature[],
  productStatuses: ProductStatus[],
): number {
  const children = allFeatures.filter(f => f.parent_id === featureId);
  if (children.length === 0) return 0;

  const grandchildren = allFeatures.filter(f =>
    children.some(c => c.id === f.parent_id)
  );

  const allDescendants = [...children, ...grandchildren];
  if (allDescendants.length === 0) return 0;

  const doneStatusIds = new Set(
    productStatuses
      .filter(s => s.category === 'done' || s.category === 'closed')
      .map(s => s.id)
  );

  const doneCount = allDescendants.filter(f => f.status_id && doneStatusIds.has(f.status_id)).length;
  return Math.round((doneCount / allDescendants.length) * 100);
}

/**
 * Get category for a given status id.
 */
export function getStatusCategory(statusId: string | null, productStatuses: ProductStatus[]) {
  if (!statusId) return null;
  return productStatuses.find(s => s.id === statusId)?.category ?? null;
}
