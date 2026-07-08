export const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  backlog:     { label: 'Backlog',    color: 'text-pink-700 dark:text-pink-400',    dot: 'bg-pink-500',    bg: 'bg-pink-500/10'    },
  in_progress: { label: 'Discovery',  color: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-500',    bg: 'bg-blue-500/10'    },
  in_review:   { label: 'Dev',        color: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500',   bg: 'bg-amber-500/10'   },
  done:        { label: 'Testing',    color: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500', bg: 'bg-purple-500/10'  },
  live:        { label: 'Live',       color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
};

export const STATUS_ORDER = ['backlog', 'in_progress', 'in_review', 'done', 'live'];
