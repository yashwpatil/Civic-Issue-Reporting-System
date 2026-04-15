'use client';

import { Header } from '@/components/header';
import { ReportForm } from '@/components/report-form';
import { ProtectedRoute } from '@/components/protected-route';

export default function ReportPage() {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-background">
        <Header />
        
        <section className="py-12 md:py-16">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Report an Issue</h1>
              <p className="text-lg text-foreground/70">
                Help us improve the city by reporting civic issues you&apos;ve encountered.
              </p>
            </div>
            
            <ReportForm />
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}
