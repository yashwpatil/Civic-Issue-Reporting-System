'use client';

import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageIcon } from 'lucide-react';
import { DepartmentIssue, DepartmentCode } from '@/lib/department-data';
import { statusLabels, statusColors, categoryLabels } from '@/lib/utils-civic';

interface DepartmentIssueTableProps {
  departmentCode: DepartmentCode;
  issues: DepartmentIssue[];
}

export function DepartmentIssueTable({ departmentCode, issues }: DepartmentIssueTableProps) {
  const { toast } = useToast();
  const [localIssues, setLocalIssues] = useState(issues);

  // Sync local issues with props
  useEffect(() => {
    setLocalIssues(issues);
  }, [issues]);

  const sortedIssues = useMemo(
    () => [...localIssues].sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()),
    [localIssues]
  );

  const handleChangeStatus = async (id: string, status: DepartmentIssue['status']) => {
    try {
      const response = await fetch(`/api/departments/${departmentCode}/issues/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Unable to update status');
      }

      const updated = await response.json();
      setLocalIssues((current) => current.map((issue) => (issue.id === id ? { ...issue, status } : issue)));
      toast({
        title: 'Status updated',
        description: `Issue status changed to ${statusLabels[status]}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'Could not update issue status.',
      });
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-card/90 shadow-lg shadow-black/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-card/95 text-left text-xs uppercase tracking-[0.2em] text-foreground/50">
            <tr>
              <th className="px-6 py-4">Issue</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Reported</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-card/80">
            {sortedIssues.map((issue) => (
              <tr key={issue.id} className="transition-colors hover:bg-card/95">
                <td className="px-6 py-4 min-h-20">
                  <div className="font-semibold text-foreground line-clamp-1">{issue.title}</div>
                  <p className="mt-1 text-xs text-foreground/60 line-clamp-2">{issue.description}</p>
                  <div className="mt-2 text-xs text-foreground/50 line-clamp-1">{issue.location}</div>
                </td>
                <td className="px-6 py-4 min-h-20">
                  <Badge className="rounded-full bg-slate-800 text-slate-100 whitespace-nowrap">{issue.priority}</Badge>
                </td>
                <td className="px-6 py-4 min-h-20">
                  <Badge className={`rounded-full px-3 py-1 whitespace-nowrap ${statusColors[issue.status]}`}>{statusLabels[issue.status]}</Badge>
                </td>
                <td className="px-6 py-4 min-h-20 text-foreground/60 line-clamp-1">{new Date(issue.reported_at).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2 items-center">
                    {issue.status !== 'resolved' ? (
                      <Button size="sm" variant="default" onClick={() => handleChangeStatus(issue.id, 'resolved')} className="whitespace-nowrap">
                        Resolve
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled className="whitespace-nowrap">
                        Completed
                      </Button>
                    )}
                    {issue.image_url ? (
                      <Button asChild size="sm" variant="secondary" className="whitespace-nowrap">
                        <a href={issue.image_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          View Image
                        </a>
                      </Button>
                    ) : null}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="whitespace-nowrap">Details</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl bg-card/95 border border-white/10">
                        <DialogHeader className="border-b border-white/10 pb-4">
                          <DialogTitle className="text-foreground">{issue.title}</DialogTitle>
                          <DialogDescription className="text-foreground/70">{issue.location}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 text-sm text-foreground/80 max-h-96 overflow-y-auto">
                          {issue.image_url && (
                            <div className="space-y-2">
                              <span className="font-semibold text-foreground">Image:</span>
                              <div className="w-full max-w-full overflow-hidden rounded-lg border border-border">
                                <img src={issue.image_url} alt="Complaint image" className="w-full h-48 object-cover" />
                              </div>
                            </div>
                          )}
                          <p>{issue.description}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                              <p className="text-foreground/70">
                                <span className="font-semibold text-foreground">Priority:</span> <span className="text-foreground/80">{issue.priority}</span>
                              </p>
                            </div>
                            <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                              <p className="text-foreground/70">
                                <span className="font-semibold text-foreground">Status:</span> <span className="text-foreground/80">{statusLabels[issue.status]}</span>
                              </p>
                            </div>
                          </div>
                          <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                            <p className="text-foreground/70">
                              <span className="font-semibold text-foreground">Reported:</span> <span className="text-foreground/80">{new Date(issue.reported_at).toLocaleString()}</span>
                            </p>
                          </div>
                          {issue.latitude && issue.longitude ? (
                            <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                              <p className="text-foreground/70">
                                <span className="font-semibold text-foreground">Location:</span> <span className="text-foreground/80">{issue.latitude}, {issue.longitude}</span>
                              </p>
                            </div>
                          ) : null}
                          {issue.contact_email && (
                            <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                              <p className="text-foreground/70">
                                <span className="font-semibold text-foreground">Email:</span> <span className="text-foreground/80">{issue.contact_email}</span>
                              </p>
                            </div>
                          )}
                          {issue.contact_phone && (
                            <div className="rounded-lg bg-card/90 p-3 border border-white/10">
                              <p className="text-foreground/70">
                                <span className="font-semibold text-foreground">Phone:</span> <span className="text-foreground/80">{issue.contact_phone}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4 bg-card/95 text-foreground/60">
        <span>{sortedIssues.length} issues assigned</span>
        <span>Last updated just now</span>
      </div>
    </div>
  );
}
