export const STATUSES = [
  { key: 'idea_or_problem', label: 'Idea or Problem', color: '#8b5cf6', bgColor: '#ede9fe', dotColor: '#7c3aed' },
  { key: 'discovery', label: 'Discovery', color: '#0891b2', bgColor: '#ecfeff', dotColor: '#0e7490' },
  { key: 'prototyping', label: 'Prototyping', color: '#d97706', bgColor: '#fffbeb', dotColor: '#b45309' },
  { key: 'in_development', label: 'In Development', color: '#2563eb', bgColor: '#eff6ff', dotColor: '#1d4ed8' },
  { key: 'in_testing', label: 'In Testing', color: '#dc2626', bgColor: '#fef2f2', dotColor: '#b91c1c' },
  { key: 'live', label: 'Live', color: '#16a34a', bgColor: '#f0fdf4', dotColor: '#15803d' },
] as const;

export type StatusKey = typeof STATUSES[number]['key'];
export type ItemLevel = 'feature' | 'sub_feature' | 'task';
export type ItemPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITY_CONFIG = {
  none:   { label: 'None',   color: '#9a9a94' },
  low:    { label: 'Low',    color: '#2563eb' },
  medium: { label: 'Medium', color: '#d97706' },
  high:   { label: 'High',   color: '#ea580c' },
  urgent: { label: 'Urgent', color: '#dc2626' },
} as const;
