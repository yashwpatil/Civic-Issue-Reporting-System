'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { categoryLabels, formatDate, statusLabels } from '@/lib/utils-civic';

const DEPARTMENTS = ['water', 'roads', 'electricity', 'garbage'] as const;

type DepartmentCode = (typeof DEPARTMENTS)[number];

type Complaint = {
  reviewId: string;
  reportId?: string | null;
  source?: 'department' | 'legacy' | 'remark-only';
  id: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  status: 'pending' | 'in-progress' | 'resolved';
  category: DepartmentCode;
  reviewDepartment: DepartmentCode;
  created_at: string;
  latestRemark?: {
    id: string;
    remark: string;
    created_at: string;
    ai_reason?: string | null;
    confidence?: number | string | null;
    reporter_name?: string | null;
    reporter_contact?: string | null;
    location?: string | null;
  };
  remarks?: Array<{
    id: string;
    remark: string;
    created_at: string;
  }>;
};

type DraftState = Record<
  string,
  {
    targetDepartment: DepartmentCode;
    remark: string;
    saving: boolean;
    deleting: boolean;
  }
>;

export function AdminRemarksView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<DraftState>({});

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadComplaints();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const loadComplaints = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/complaints-supabase/remarks', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to load complaints');
      }

      const data = await response.json();
      const complaintList = (data.complaints || []) as Complaint[];

      setComplaints(complaintList);
      setDrafts((prev) => {
        const nextDrafts: DraftState = {};

        for (const complaint of complaintList) {
          nextDrafts[complaint.reviewId] = prev[complaint.reviewId] || {
            targetDepartment: complaint.category,
            remark: complaint.latestRemark?.remark || '',
            saving: false,
            deleting: false,
          };
        }

        return nextDrafts;
      });
    } catch (error) {
      console.error('Error loading remarks complaints:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to load complaints for manual allocation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (
    complaintId: string,
    updates: Partial<DraftState[string]>
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [complaintId]: {
        ...(prev[complaintId] || {
          targetDepartment: 'garbage',
          remark: '',
          saving: false,
          deleting: false,
        }),
        ...updates,
      },
    }));
  };

  const deleteComplaint = async (complaint: Complaint) => {
    updateDraft(complaint.reviewId, { deleting: true });

    try {
      const response = await fetch(
        `/api/complaints-supabase/remarks/${complaint.reviewId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete complaint');
      }

      setComplaints((prev) =>
        prev.filter((item) => item.reviewId !== complaint.reviewId)
      );
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[complaint.reviewId];
        return nextDrafts;
      });

      toast({
        title: 'Complaint deleted',
        description: 'The wrong complaint has been removed successfully.',
      });
    } catch (error) {
      console.error('Error deleting complaint:', error);
      updateDraft(complaint.reviewId, { deleting: false });
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete complaint.',
      });
    }
  };

  const reassignComplaint = async (complaint: Complaint) => {
    const draft = drafts[complaint.reviewId];
    if (!draft) {
      return;
    }

    if (draft.targetDepartment === complaint.category) {
      toast({
        title: 'No change needed',
        description: 'Select a different department before reallocating.',
      });
      return;
    }

    updateDraft(complaint.reviewId, { saving: true });

    try {
      const response = await fetch(
        `/api/complaints-supabase/remarks/${complaint.reviewId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDepartment: draft.targetDepartment,
            remark:
              draft.remark.trim() ||
              `Admin moved complaint from ${complaint.category} to ${draft.targetDepartment}.`,
            userId: user?.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reassign complaint');
      }

      setComplaints((prev) =>
        prev.filter((item) => item.reviewId !== complaint.reviewId)
      );
      setDrafts((prev) => {
        const nextDrafts = { ...prev };
        delete nextDrafts[complaint.reviewId];
        return nextDrafts;
      });

      toast({
        title: 'Department updated',
        description: 'Complaint has been moved to the selected department.',
      });
    } catch (error) {
      console.error('Error reassigning complaint:', error);
      updateDraft(complaint.reviewId, { saving: false });
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to reassign complaint.',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyTitle>No complaints waiting for review</EmptyTitle>
          <EmptyDescription>
            New rows added to `issue_remarks` will appear here automatically.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={loadComplaints}>
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Manual Department Allocation</CardTitle>
            <CardDescription>
              This page refreshes automatically and shows complaints flagged in `issue_remarks`.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={loadComplaints}>
            Refresh
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {complaints.map((complaint) => {
          const draft = drafts[complaint.reviewId] || {
            targetDepartment: complaint.category,
            remark: '',
            saving: false,
            deleting: false,
          };

          return (
            <Card key={complaint.reviewId}>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{complaint.title}</CardTitle>
                    <CardDescription>
                      Reported {formatDate(complaint.created_at)}
                    </CardDescription>
                    {complaint.reportId ? (
                      <p className="text-xs text-foreground/60">
                        Report ID: {complaint.reportId}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Current: {categoryLabels[complaint.category]}
                    </Badge>
                    <Badge variant="outline">
                      Review From: {categoryLabels[complaint.reviewDepartment]}
                    </Badge>
                    <Badge variant="secondary">
                      {statusLabels[complaint.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="space-y-2 text-sm text-foreground/75">
                  <p>{complaint.description || 'No description provided.'}</p>
                  <p>
                    <span className="font-medium text-foreground">Location:</span>{' '}
                    {complaint.location}
                  </p>
                  {complaint.address && complaint.address !== complaint.location ? (
                    <p>
                      <span className="font-medium text-foreground">Address:</span>{' '}
                      {complaint.address}
                    </p>
                  ) : null}
                  {complaint.latestRemark ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                      <p className="font-medium">Latest review remark</p>
                      <p>{complaint.latestRemark.remark}</p>
                      {complaint.latestRemark.ai_reason ? (
                        <p className="mt-2 text-sm">
                          AI Reason: {complaint.latestRemark.ai_reason}
                        </p>
                      ) : null}
                      {complaint.latestRemark.reporter_name ? (
                        <p className="mt-2 text-sm">
                          Reporter: {complaint.latestRemark.reporter_name}
                        </p>
                      ) : null}
                      {complaint.latestRemark.reporter_contact ? (
                        <p className="text-sm">
                          Contact: {complaint.latestRemark.reporter_contact}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Allocate Department
                    </p>
                    <Select
                      value={draft.targetDepartment}
                      onValueChange={(value) =>
                        updateDraft(complaint.reviewId, {
                          targetDepartment: value as DepartmentCode,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((department) => (
                          <SelectItem key={department} value={department}>
                            {categoryLabels[department]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Remark
                    </p>
                    <Textarea
                      value={draft.remark}
                      onChange={(event) =>
                        updateDraft(complaint.reviewId, {
                          remark: event.target.value,
                        })
                      }
                      placeholder="Why is this complaint being moved to another department?"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => reassignComplaint(complaint)}
                      disabled={draft.saving || draft.deleting}
                      className="w-full md:w-auto"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {draft.saving ? 'Submitting...' : 'Submit'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => deleteComplaint(complaint)}
                      disabled={draft.saving || draft.deleting}
                      className="w-full md:w-auto"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {draft.deleting ? 'Deleting...' : 'Wrong'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
