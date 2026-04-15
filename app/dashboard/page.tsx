'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { DashboardView } from '@/components/dashboard-view';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-background">
        <Header />
        
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">My Complaints</h1>
                <p className="text-lg text-foreground/70">
                  View and track all your submitted complaints
                </p>
              </div>
              <Button asChild>
                <Link href="/report">New Report</Link>
              </Button>
            </div>
            
            <DashboardView />
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
