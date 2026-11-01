'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Home, Calendar, Trophy, Users, User, Shield } from 'lucide-react';

function MobileNavContent() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Fixtures', href: '/fixtures', icon: Calendar },
    { label: 'Table', href: '/standings', icon: Trophy },
    { label: 'Members', href: '/members', icon: Users },
    {
      label: mounted && user ? 'Profile' : 'Login',
      href: mounted && user ? `/members/${user.username}` : '/login',
      icon: mounted && user ? User : Shield,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-[#0B132B]/95 backdrop-blur-lg border-t border-[#2C3960] px-2 py-1.5 shadow-2xl pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                active
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'scale-110 text-emerald-400' : ''}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function MobileNav() {
  return (
    <Suspense fallback={null}>
      <MobileNavContent />
    </Suspense>
  );
}
