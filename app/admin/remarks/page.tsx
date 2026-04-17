'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { AdminRemarksView } from '@/components/admin-remarks-view';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';

export default function AdminRemarksPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Header />

        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                  Remarks
                </h1>
                <p className="text-lg text-foreground/70">
                  Review wrongly assigned complaints and send them to the correct department.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/admin">Admin Panel</Link>
                </Button>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>

            <AdminRemarksView />
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
