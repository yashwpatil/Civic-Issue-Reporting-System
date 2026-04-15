'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { getDepartmentByCode } from '@/lib/department-data';

export default function DepartmentProfilePage() {
  const params = useParams() as { department?: string };
  const department = getDepartmentByCode(params.department ?? '');
  if (!department) {
    return <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">Department not found.</div>;
  }

  return (
    <ProtectedRoute requiredRole="department">
      <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Profile</p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">{department.name}</h2>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card/90 px-5 py-4 text-sm text-foreground/70">
            Department contact
            <div className="mt-2 font-medium text-foreground">{department.email}</div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <h3 className="text-xl font-semibold text-foreground">About</h3>
          <p className="mt-4 text-foreground/70">{department.description}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <h3 className="text-xl font-semibold text-foreground">Key responsibilities</h3>
          <ul className="mt-4 space-y-3 text-foreground/70">
            <li>• Respond to department-specific complaints.</li>
            <li>• Update issue status and add remarks.</li>
            <li>• Upload resolution proof for completed tasks.</li>
            <li>• Review weekly and monthly analytics.</li>
          </ul>
        </div>
      </div>
    </section>
    </ProtectedRoute>
  );
}
