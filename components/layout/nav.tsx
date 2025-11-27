'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Dumbbell, BarChart3, Settings } from 'lucide-react';

const routes = [
  {
    href: '/workout',
    label: 'Workout',
    icon: Dumbbell,
  },
  {
    href: '/history',
    label: 'History',
    icon: BarChart3,
  },
  {
    href: '/manage',
    label: 'Manage',
    icon: Settings,
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="container mx-auto">
        <div className="flex justify-around md:justify-center md:gap-8 md:py-4">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-3 px-6 text-sm transition-colors md:flex-row md:gap-2',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
