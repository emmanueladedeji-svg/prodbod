export type StatusCategory = 'not_started' | 'active' | 'done' | 'closed';

export interface ProductStatus {
  id: string;
  product_id: string;
  org_id: string;
  name: string;
  color: string;
  category: StatusCategory;
  position: number;
  is_default: boolean;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_ORDER: StatusCategory[] = ['not_started', 'active', 'done', 'closed'];

export const CATEGORY_LABELS: Record<StatusCategory, string> = {
  not_started: 'Not Started',
  active: 'Active',
  done: 'Done',
  closed: 'Closed',
};

export const STATUS_COLOR_PALETTE = [
  '#8b5cf6','#7c3aed','#6d28d9','#4c1d95','#c4b5fd',
  '#2563eb','#1d4ed8','#0891b2','#0e7490','#bfdbfe',
  '#16a34a','#15803d','#65a30d','#4d7c0f','#bbf7d0',
  '#d97706','#dc2626','#e11d48','#f97316','#fde68a',
];
