'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DepartmentIssueTable } from '@/components/department-issue-table';
import { ProtectedRoute } from '@/components/protected-route';
import { getDepartmentByCode, DepartmentIssue } from '@/lib/department-data';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function DepartmentIssuesPage() {
  const params = useParams() as { department?: string };
  const department = getDepartmentByCode(params.department ?? '');
  const [issues, setIssues] = useState<DepartmentIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (!department) {
    return <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">Department not found.</div>;
  }

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        // Use the new Supabase endpoint
        const response = await fetch(`/api/complaints-supabase/${department.code}`);
        if (response.ok) {
          const data = await response.json();
        // Map the API response to DepartmentIssue format
          const mappedIssues: DepartmentIssue[] = (data.complaints || []).map((complaint: any) => ({
            id: complaint.id,
            title: complaint.title,
            description: complaint.description,
            priority: complaint.priority || 'medium',
            status: complaint.status || 'pending',
            location: complaint.location,
            reported_at: complaint.reported_at,
            resolved_at: complaint.resolved_at,
            assignedDepartment: department.code,
            image_url: complaint.image_url,
            latitude: complaint.latitude?.toString(),
            longitude: complaint.longitude?.toString(),
            contact_email: complaint.contact_email,
            contact_phone: complaint.contact_phone,
          }));
          setIssues(mappedIssues);
        }
      } catch (error) {
        console.error('Error fetching issues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
    // Refresh every 15 seconds for real-time updates
    const interval = setInterval(fetchIssues, 15000);
    return () => clearInterval(interval);
  }, [department.code]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/complaints-supabase/${department.code}`);
      if (response.ok) {
        const data = await response.json();
        const mappedIssues: DepartmentIssue[] = (data.complaints || []).map((complaint: any) => ({
          id: complaint.id,
          title: complaint.title,
          description: complaint.description,
          priority: complaint.priority || 'medium',
          status: complaint.status || 'pending',
          location: complaint.location,
          reported_at: complaint.reported_at,
          resolved_at: complaint.resolved_at,
          assignedDepartment: department.code,
          image_url: complaint.image_url,
          latitude: complaint.latitude?.toString(),
          longitude: complaint.longitude?.toString(),
          contact_email: complaint.contact_email,
          contact_phone: complaint.contact_phone,
        }));
        setIssues(mappedIssues);
      }
    } catch (error) {
      console.error('Error refreshing issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="department">
      <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Issues</p>
            <h2 className="text-2xl font-semibold text-foreground">Assigned issue queue</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="max-w-xl text-sm text-foreground/70">Review assigned complaints, update status, and keep stakeholders up to date with resolution progress.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">
          Loading issues...
        </div>
      ) : (
        <DepartmentIssueTable departmentCode={department.code} issues={issues} />
      )}
    </section>
    </ProtectedRoute>
  );
}
