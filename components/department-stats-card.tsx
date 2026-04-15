import { ReactNode } from 'react';

interface DepartmentStatsCardProps {
  title: string;
  value: number;
  description: string;
  accent?: string;
  icon?: ReactNode;
}

export function DepartmentStatsCard({ title, value, description, accent = 'bg-primary', icon }: DepartmentStatsCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-foreground/50">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
        </div>
        {icon ? (
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent} text-white`}>{icon}</div>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-foreground/70">{description}</p>
    </div>
  );
}
