export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  backlog: { label: 'NEW FEATURE', color: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500', bg: 'bg-pink-500/10' },
  in_progress: { label: 'IN PROGRESS', color: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', bg: 'bg-blue-500/10' },
  in_review: { label: 'IN REVIEW', color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', bg: 'bg-amber-500/10' },
  done: { label: 'COMPLETE', color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
};

export const STATUS_ORDER = ['backlog', 'in_progress', 'in_review', 'done'];
