'use client';

import { useEffect, useState } from 'react';
import { Complaint } from '@/lib/db';
import type { User } from '@/lib/db';
import { ComplaintCard } from '@/components/complaint-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryLabels } from '@/lib/utils-civic';
import { useToast } from '@/hooks/use-toast';

interface AdminStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byCategory: Record<string, number>;
}

interface UserStats {
  totalUsers: number;
  admins: number;
  citizens: number;
}

export function AdminView() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('complaints');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [categoryFilter, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [categoryFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [complaintsRes, statsRes, usersRes] = await Promise.all([
        fetch(`/api/complaints?${params.toString()}`),
        fetch('/api/stats'),
        fetch('/api/users'),
      ]);

      const complaintsData = await complaintsRes.json();
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setComplaints(complaintsData);
      setStats(statsData);
      setUsers(usersData.users || []);
      setUserStats(usersData.stats || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load admin data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Complaint['status']) => {
    try {
      const response = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedComplaint = await response.json();
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? updatedComplaint : c))
      );

      // Update stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      toast({
        title: 'Success',
        description: `Complaint status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update complaint status.',
      });
    }
  };

  const handleDelete = (id: string) => {
    setComplaints((prev) => prev.filter((c) => c.id !== id));
    // Refresh stats after delete
    fetch('/api/stats')
      .then((res) => res.ok && res.json())
      .then((statsData) => statsData && setStats(statsData))
      .catch(console.error);
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete user');
        }

        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({
          title: 'Success',
          description: 'User deleted successfully.',
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete user.',
        });
      }
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="complaints">Complaints ({complaints.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
        </TabsList>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-8">
        {/* Stats Overview */}
        {stats && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.inProgress}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.resolved}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Number of complaints per category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">{count}</div>
                  <div className="text-sm text-foreground/70">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaints Management */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Manage Complaints</h2>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger
              value="all"
              onClick={() => setStatusFilter('all')}
            >
              All ({complaints.length})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="in-progress"
              onClick={() => setStatusFilter('in-progress')}
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="resolved"
              onClick={() => setStatusFilter('resolved')}
            >
              Resolved
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground/70 block mb-2">
              Filter by Category
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button
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

        {complaints.length === 0 ? (
          <Empty title="No Complaints Found" description="There are no complaints matching your filters." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onDelete={handleDelete}
                isAdmin
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-8">
        {/* User Stats */}
        {userStats && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">User Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{userStats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {userStats.admins}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Citizens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {userStats.citizens}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Management */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Manage Users</h2>

          {users.length === 0 ? (
            <Empty title="No Users Found" description="No users registered yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-foreground/70 text-sm">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.type === 'admin'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                        }`}>
                          {user.type === 'admin' ? 'Admin' : 'Citizen'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground/70 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
