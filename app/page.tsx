'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { StatsDisplay } from '@/components/stats-display';
import { CategoriesGrid } from '@/components/categories-grid';
import { useAuth } from '@/lib/auth-context';
import { MapPin, FileText, BarChart3, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-transparent pt-20 pb-12 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-7xl px-4">
          {user && (
            <div className="mb-6 p-4 bg-secondary/10 border border-secondary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-500">
              <p className="text-sm md:text-base text-foreground">
                Welcome back, <span className="font-semibold">{user.name}</span>! {user.type === 'admin' ? 'You are logged in as an Admin' : 'Ready to report issues?'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 text-balance">
                Report Civic Issues <span className="text-primary">Easily</span>
              </h1>
              <p className="text-lg text-foreground/70 mb-8 text-balance">
                Help improve your city by reporting infrastructure problems. Your feedback matters and helps create safer, cleaner communities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {user ? (
                  <>
                    {user.type === 'user' && (
                      <>
                        <Button asChild size="lg" className="text-base">
                          <Link href="/report">Report Issue</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-base">
                          <Link href="/dashboard">View My Reports</Link>
                        </Button>
                      </>
                    )}
                    {user.type === 'admin' && (
                      <>
                        <Button asChild size="lg" className="text-base">
                          <Link href="/admin">Go to Admin Panel</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-base">
                          <Link href="/">View Statistics</Link>
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Button asChild size="lg" className="text-base">
                      <Link href="/login">Get Started</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="text-base">
                      <Link href="/login">Sign In</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="hidden md:block relative h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
              <div className="relative h-full flex items-center justify-center">
                <div className="relative inline-flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary/10 text-primary shadow-lg shadow-primary/10">
                  <MapPin className="h-14 w-14" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">City Stats</h2>
            <p className="text-foreground/70">See how many issues have been reported and resolved in our community</p>
          </div>
          <StatsDisplay />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Report by Category</h2>
            <p className="text-foreground/70">Select a category to report a specific type of civic issue</p>
          </div>
          <CategoriesGrid />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-primary dark:bg-slate-900">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Report</h3>
              <p className="text-foreground/70">
                Fill out a simple form with details about the issue, add a photo, and describe the location.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-primary dark:bg-slate-900">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Track</h3>
              <p className="text-foreground/70">
                Monitor your complaint status in real-time as city officials work on resolving it.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-primary dark:bg-slate-900">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Resolve</h3>
              <p className="text-foreground/70">
                Stay updated until the issue is resolved and marked as complete.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-primary/10">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            Start reporting civic issues today and help us build a better, safer community together.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/report">Report an Issue Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-foreground/60">
          <p>&copy; 2024 CivicHub. Helping cities improve, one report at a time.</p>
        </div>
      </footer>
    </div>
  );
}
