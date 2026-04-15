'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { ComplaintCard } from '@/components/complaint-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { AlertTriangle, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryLabels } from '@/lib/utils-civic';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
  contact_email?: string;
  contact_phone?: string;
}

const departments = ['water', 'roads', 'electricity', 'garbage'];

export function DashboardView() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user?.id) {
      fetchComplaints();
    }
  }, [user?.id, categoryFilter, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user?.id) return;
    
    const interval = setInterval(() => {
      fetchComplaints();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, categoryFilter, statusFilter]);

  const fetchComplaints = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch from all department endpoints and combine results
      const allComplaints: Complaint[] = [];

      for (const dept of departments) {
        try {
          const response = await fetch(`/api/complaints-supabase/${dept}`);
          if (response.ok) {
            const data = await response.json();
            if (data.complaints && Array.isArray(data.complaints)) {
              // Filter complaints for current user
              const userComplaints = data.complaints.filter((c: any) => c.user_id === user.id);
              allComplaints.push(...userComplaints);
            }
          }
        } catch (error) {
          console.warn(`Error fetching ${dept} complaints:`, error);
        }
      }

      // Apply filters
      let filtered = allComplaints;
      
      if (categoryFilter !== 'all') {
        // Map category to department
        const categoryToDept: { [key: string]: string } = {
          'garbage': 'garbage',
          'roads': 'roads',
          'water': 'water',
          'electricity': 'electricity',
        };
        // Note: We need to infer department from complaint if possible
      }
      
      if (statusFilter !== 'all') {
        filtered = filtered.filter(c => c.status === statusFilter);
      }

      setComplaints(filtered);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRefresh = () => {
    fetchComplaints();
  };

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'pending').length;
  const inProgressCount = complaints.filter((c) => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Overview</p>
              <h2 className="text-2xl font-semibold text-foreground">Your Complaints</h2>
              <p className="mt-2 text-sm text-foreground/70 max-w-2xl">
                Track the progress of complaints you have submitted and review recent updates across departments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleRefresh}>
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground/70">Total complaints</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{totalComplaints}</p>
                </div>
                <ListChecks className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground/70">Pending</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{pendingCount}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground/70">In progress</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{inProgressCount}</p>
                </div>
                <Clock3 className="h-6 w-6 text-sky-500" />
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground/70">Resolved</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">{resolvedCount}</p>
                </div>
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-lg shadow-black/5">
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-foreground/50">Filters</p>
              <p className="mt-1 text-sm text-foreground/70">Refine the results by category or status.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground/70 block mb-2">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground/70 block mb-2">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {complaints.length === 0 ? (
        <Empty title="No Complaints Found" description="There are no complaints matching your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
