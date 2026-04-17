'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { Building2, LogOut, User2 } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-5 py-2">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-foreground">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">CivicHub</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm md:text-base">
          <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Home
          </Link>
          {user && (
            <>
              <Link href="/report" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
                Report Issue
              </Link>
              <Link 
                href={user.type === 'admin' ? '/admin' : '/dashboard'} 
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                {user.type === 'admin' ? 'Admin Panel' : 'My Dashboard'}
              </Link>
              {user.type === 'admin' && (
                <Link
                  href="/admin/remarks"
                  className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                >
                  Remarks
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-sm font-medium text-foreground/80">
                <User2 className="h-4 w-4 text-primary" />
                <span>{user.name}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleLogout}
                className="transition-all duration-300 text-foreground hover:bg-destructive hover:text-white border-destructive/30 hover:border-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button size="sm" asChild className="transition-all duration-300">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
