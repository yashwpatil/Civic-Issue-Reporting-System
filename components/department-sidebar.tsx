'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BarChart3, ListChecks, Settings, User, Home, BellRing, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { DepartmentCode } from '@/lib/department-data';

const navItems = [
  { label: 'Dashboard', href: '/departments/[department]', icon: Home },
  { label: 'Issues', href: '/departments/[department]/issues', icon: ListChecks },
  { label: 'Reports', href: '/departments/[department]/reports', icon: BarChart3 },
  { label: 'Profile', href: '/departments/[department]/profile', icon: User },
];

interface DepartmentSidebarProps {
  departmentCode: DepartmentCode;
}

export function DepartmentSidebar({ departmentCode }: DepartmentSidebarProps) {
  const pathname = usePathname();
  const departmentRoot = `/departments/${departmentCode}`;

  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-card/80 p-6 shadow-xl backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-foreground/50">Department portal</p>
        <h2 className="text-2xl font-semibold">{departmentCode.charAt(0).toUpperCase() + departmentCode.slice(1)} Team</h2>
        <p className="text-sm text-foreground/70">Manage assigned issues, track progress, and collaborate with the operations team.</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const href = item.href.replace('[department]', departmentCode);
          const isExactRoute = href === `/departments/${departmentCode}`;
          const isActive = isExactRoute
            ? pathname === href
            : pathname === href || pathname?.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.label} href={href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'}`}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start text-foreground/80 hover:bg-white/5 hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>

        <div className="rounded-3xl border border-white/10 bg-card/90 p-4 text-sm text-foreground/70">
          <div className="mb-3 flex items-center gap-3 text-foreground">
            <BellRing className="h-4 w-4" />
            <span className="font-semibold">Alerts</span>
          </div>
          <p className="leading-relaxed">New issue assigned? Keep the team updated and resolve requests faster from this dashboard.</p>
        </div>
      </div>
    </aside>
  );
}
