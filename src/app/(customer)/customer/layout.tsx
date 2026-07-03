'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white tracking-wider">
              DP
            </span>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Dispatchly Hub
            </span>
          </div>
          <nav className="space-y-1">
            <Link
              href="/customer/orders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              My Orders
            </Link>
            <Link
              href="/customer/orders/create"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Ship New Parcel
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Customer Portal</p>
            <p className="text-sm font-semibold truncate text-slate-200">{userName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
