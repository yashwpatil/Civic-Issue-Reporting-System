'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, Clock3, CheckCircle2, AlertTriangle, Edit, ImageIcon, RefreshCw } from 'lucide-react';
import { DepartmentStatsCard } from '@/components/department-stats-card';
import { ProtectedRoute } from '@/components/protected-route';
import { categoryLabels, statusLabels } from '@/lib/utils-civic';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface DepartmentIssue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location: string;
  user_id: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  reported_at: string;
  resolved_at?: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

export default function DepartmentDashboardPage() {
  const params = useParams() as { department?: string };
  const department = params.department as string;
  const [issues, setIssues] = useState<DepartmentIssue[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate department
  const validDepartments = ['water', 'roads', 'electricity', 'garbage'];
  const isValidDepartment = validDepartments.includes(department);

  useEffect(() => {
    if (!isValidDepartment) return;

    const fetchLiveIssues = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/complaints-supabase/${department}`);
        if (response.ok) {
          const data = await response.json();
          setIssues(data.complaints || []);
          
          // Calculate stats from complaints
          const complaints = data.complaints || [];
          setStats({
            total: complaints.length,
            pending: complaints.filter((c: any) => c.status === 'pending').length,
            in_progress: complaints.filter((c: any) => c.status === 'in-progress').length,
            resolved: complaints.filter((c: any) => c.status === 'resolved').length,
          });
        } else {
          console.error('Failed to fetch issues:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching live issues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveIssues();
    
    // Auto-refresh every 15 seconds for real-time updates
    const interval = setInterval(fetchLiveIssues, 15000);
    return () => clearInterval(interval);
  }, [department, isValidDepartment]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/complaints-supabase/${department}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data.complaints || []);
        const complaints = data.complaints || [];
        setStats({
          total: complaints.length,
          pending: complaints.filter((c: any) => c.status === 'pending').length,
          in_progress: complaints.filter((c: any) => c.status === 'in-progress').length,
          resolved: complaints.filter((c: any) => c.status === 'resolved').length,
        });
      }
    } catch (error) {
      console.error('Error refreshing issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidDepartment) {
    return (
      <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">
        Invalid department. Must be: water, roads, electricity, or garbage
      </div>
    );
  }

  const updateIssueStatus = async (issueId: string, newStatus: string) => {
    setUpdating(issueId);
    try {
      const response = await fetch(`/api/complaints-supabase/${department}/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setIssues((currentIssues) =>
          currentIssues.map((issue) =>
            issue.id === issueId ? { ...issue, status: newStatus } : issue
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <ProtectedRoute requiredRole="department">
      <section className="space-y-6">
        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-card/80 p-8 text-center text-foreground">
            Loading live complaints...
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DepartmentStatsCard
                title="Total Complaints"
                value={stats?.total || 0}
                description="Assigned issues for this department."
                icon={<ArrowRight className="h-5 w-5" />}
              />
              <DepartmentStatsCard
                title="Pending"
                value={stats?.pending || 0}
                description="Awaiting review or assignment."
                accent="bg-yellow-500"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <DepartmentStatsCard
                title="In Progress"
                value={stats?.in_progress || 0}
                description="Currently being resolved."
                accent="bg-blue-500"
                icon={<Clock3 className="h-5 w-5" />}
              />
              <DepartmentStatsCard
                title="Resolved"
                value={stats?.resolved || 0}
                description="Completed service requests."
                accent="bg-emerald-500"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
            </div>
          </>
        )}

        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">All Issues</p>
              <h2 className="text-xl font-semibold text-foreground">Complaints for {department} department</h2>
            </div>
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

          {issues.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              No complaints yet for this department
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium max-w-xs truncate">{issue.title}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="line-clamp-2 text-sm break-words">{issue.location}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{issue.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{issue.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(issue.reported_at || issue.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">
                        {issue.image_url ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="secondary" className="whitespace-nowrap">
                                <ImageIcon className="h-4 w-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <img
                                src={issue.image_url}
                                alt="Complaint image"
                                className="w-full h-auto rounded-lg"
                              />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs text-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs truncate">{issue.contact_email}</TableCell>
                      <TableCell>
                        <Select value={issue.status} onValueChange={(newStatus) => updateIssueStatus(issue.id, newStatus)} disabled={updating === issue.id}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </section>
    </ProtectedRoute>
  );
}
