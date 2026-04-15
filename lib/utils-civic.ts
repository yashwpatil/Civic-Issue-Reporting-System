import { Complaint } from './db';

export const categoryIcons = {
  garbage: '🗑️',
  roads: '🛣️',
  water: '💧',
  electricity: '⚡',
  other: '📝',
} as const;

export const categoryLabels = {
  garbage: 'Garbage',
  roads: 'Roads',
  water: 'Water',
  electricity: 'Electricity',
  other: 'Other',
} as const;

export const statusColors = {
  pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
  'in-progress': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
  resolved: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200',
} as const;

export const statusLabels = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
} as const;

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function getInitials(email?: string): string {
  if (!email) return 'U';
  return email.substring(0, 2).toUpperCase();
}
