import { getAllDepartments, getDepartmentStats } from '@/lib/department-data';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DepartmentsDashboardPage() {
  const departments = getAllDepartments();

  return (
    <ProtectedRoute requiredRole="admin">
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl border border-white/10 bg-card/80 p-8 shadow-xl shadow-black/5">
            <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Departments Overview</p>
            <h1 className="mt-3 text-4xl font-semibold text-foreground">All Departments Dashboard</h1>
            <p className="mt-4 text-lg text-foreground/70">Monitor complaints and performance across all municipal departments.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const stats = getDepartmentStats(department.code);
              return (
                <Card key={department.code} className="border-white/10 bg-card/90 shadow-lg shadow-black/5">
                  <CardHeader>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{department.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Issues:</span>
                      <span className="font-semibold">{stats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pending:</span>
                      <span className="font-semibold text-yellow-500">{stats.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">In Progress:</span>
                      <span className="font-semibold text-blue-500">{stats.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Resolved:</span>
                      <span className="font-semibold text-green-500">{stats.resolved}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
