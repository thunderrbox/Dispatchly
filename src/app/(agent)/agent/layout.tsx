'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DispatchlyLogo } from '../../page';

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [available, setAvailable] = useState(true);

  const fetchAgentStatus = async (agentProfileId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const agents = await res.json();
        const currentAgent = agents.find((a: any) => a.id === agentProfileId);
        if (currentAgent) {
          setAvailable(currentAgent.available);
        }
      }
    } catch {
      // Fail silently
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'AGENT') {
        router.push('/login');
        return;
      }
      setUserName(user.name);
      setAgentId(user.agentProfileId || '');
      setAuthorized(true);

      if (user.agentProfileId) {
        fetchAgentStatus(user.agentProfileId);
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const handleToggleOnline = async () => {
    if (!agentId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/${agentId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          available: !available,
        }),
      });

      if (res.ok) {
        setAvailable(!available);
      }
    } catch {
      // Fail silently
    }
  };

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
          <span className="text-xs font-semibold text-[#1C1C1A]/50">Loading Agent Console...</span>
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
              Dispatchly Agent
            </span>
          </div>

          <div className="bg-white/60 border border-foreground/10 rounded-xl p-4 mb-6 text-center space-y-2">
            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Duty Status</span>
            <div className="flex justify-between items-center bg-background border border-foreground/10 rounded-lg p-2">
              <span className={`text-xs font-bold ${available ? 'text-emerald-600' : 'text-rose-600'}`}>
                {available ? 'ONLINE' : 'OFFLINE'}
              </span>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleToggleOnline}
                className={`py-1 px-3 rounded text-[10px] font-bold transition-all border ${
                  available
                    ? 'bg-rose-50 hover:bg-rose-600 border-rose-200 text-rose-600 hover:text-white'
                    : 'bg-emerald-500/10 hover:bg-emerald-600 border-emerald-200 text-emerald-600 hover:text-white'
                }`}
              >
                {available ? 'Stop' : 'Start'}
              </motion.button>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/agent/orders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg text-foreground/80 hover:bg-foreground/5 hover:text-foreground transition-all"
            >
              Assigned Tasks
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-foreground/10 flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">Agent Panel</p>
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
