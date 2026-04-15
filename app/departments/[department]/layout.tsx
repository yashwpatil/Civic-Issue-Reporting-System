import { ReactNode } from 'react';
import { DepartmentSidebar } from '@/components/department-sidebar';
import { getDepartmentByCode } from '@/lib/department-data';

interface DepartmentLayoutProps {
  children: ReactNode;
  params: Promise<{ department: string }>;
}

export default async function DepartmentLayout({ children, params }: DepartmentLayoutProps) {
  const { department: departmentSlug } = await params;
  const department = getDepartmentByCode(departmentSlug);
  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10 text-center text-foreground">
        <div className="max-w-xl rounded-3xl border border-white/10 bg-card/80 p-10 shadow-xl shadow-black/5">
          <h1 className="text-3xl font-semibold text-foreground">Department not recognized</h1>
          <p className="mt-4 text-foreground/70">No department matches <span className="font-semibold">{departmentSlug}</span>. Please use a valid department code like <span className="font-semibold">water</span>, <span className="font-semibold">roads</span>, <span className="font-semibold">electricity</span>, or <span className="font-semibold">garbage</span>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-8">
        <div className="hidden lg:block lg:w-80">
          <DepartmentSidebar departmentCode={department.code} />
        </div>

        <main className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">{department.name}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Department Dashboard</h1>
              </div>
              <div className="rounded-3xl border border-white/10 bg-card/90 px-4 py-3 text-sm text-foreground/70">
                Contact: <span className="font-medium text-foreground">{department.email}</span>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
