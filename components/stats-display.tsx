'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Clock3, Settings, CheckCircle2 } from 'lucide-react';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  byCategory: Record<string, number>;
}

export function StatsDisplay() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats-supabase');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statItems = [
    {
      label: 'Total Complaints',
      value: stats.total,
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: <Clock3 className="h-5 w-5" />,
      color: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: <Settings className="h-5 w-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
