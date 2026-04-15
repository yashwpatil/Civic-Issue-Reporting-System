'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { getDepartmentByCode, getDepartmentStats, getIssueTrend, getAverageResolutionTime, getClosureRate } from '@/lib/department-data';

export default function DepartmentReportsPage() {
  const params = useParams() as { department?: string };
  const department = getDepartmentByCode(params.department ?? '');
  if (!department) {
    return <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">Department not found.</div>;
  }

  const stats = getDepartmentStats(department.code);
  const trend = getIssueTrend(department.code);
  const avgResolutionTime = getAverageResolutionTime(department.code);
  const closureRateData = getClosureRate(department.code);

  return (
    <ProtectedRoute requiredRole="department">
      <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Performance</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">Resolution metrics</h2>
          <div className="mt-6 space-y-4 text-sm text-foreground/70">
            <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 px-4 py-4">
              <span>Average resolution time</span>
              <strong>{avgResolutionTime > 0 ? `${avgResolutionTime} days` : 'N/A'}</strong>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 px-4 py-4">
              <span>Closure rate</span>
              <strong>{closureRateData.percentage}% ({closureRateData.resolved}/{closureRateData.total})</strong>
            </div>
            <div className="flex items-center justify-between rounded-3xl bg-slate-950/10 px-4 py-4">
              <span>Team workload</span>
              <strong>{stats.pending + stats.inProgress} active</strong>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Trends</p>
              <h2 className="text-2xl font-semibold text-foreground">Weekly and monthly volume</h2>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm text-foreground/60">Weekly complaints</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trend.weekly.map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-950/10 p-4">
                    <div className="flex items-center justify-between text-sm text-foreground/70">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.count * 18)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-foreground/60">Monthly complaints</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {trend.monthly.map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-950/10 p-4">
                    <div className="flex items-center justify-between text-sm text-foreground/70">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.min(100, item.count * 12)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </ProtectedRoute>
  );
}
