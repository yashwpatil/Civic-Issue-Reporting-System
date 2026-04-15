'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { AdminView } from '@/components/admin-view';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Header />
        
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
                <p className="text-lg text-foreground/70">
                  Manage and track all civic complaints in the system
                </p>
              </div>
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
            
            <AdminView />
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
