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
    <nav aria-label="Main navigation" className="fixed bottom-4 left-4 right-4 z-[60] rounded-xl border bg-background shadow-lg md:bottom-auto md:left-0 md:right-0 md:top-0 md:rounded-none md:border-b md:border-l-0 md:border-r-0 md:border-t-0 md:shadow-none">
      <div className="container mx-auto">
        <div className="flex justify-around md:justify-center md:gap-8 md:py-4">
          {routes.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-4 px-6 text-sm transition-colors md:flex-row md:gap-2 md:py-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
