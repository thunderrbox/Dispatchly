'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DispatchlyLogo } from '../../page';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'CUSTOMER') {
        router.push('/login');
        return;
      }
      setUserName(user.name);
      setAuthorized(true);
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center text-[#1C1C1A]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E8622C]"></div>
          <span className="text-xs font-semibold text-[#1C1C1A]/50">Loading Hub...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7F2] text-[#1C1C1A] font-sans selection:bg-[#E8622C]/20">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-foreground/10 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="text-accent">
              <DispatchlyLogo className="h-8 w-8" />
            </div>
            <span className="font-display font-extrabold text-lg text-foreground">
              Dispatchly Hub
            </span>
          </div>
          <nav className="space-y-1">
            <Link
              href="/customer/orders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              My Orders
            </Link>
            <Link
              href="/customer/orders/create"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              Ship New Parcel
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-foreground/10 flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Customer Portal</p>
            <p className="text-sm font-bold truncate text-foreground">{userName}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs font-bold text-accent hover:bg-accent/10 rounded-lg transition-colors"
          >
            Sign Out
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
