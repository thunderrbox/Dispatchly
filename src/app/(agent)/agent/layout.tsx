'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
        // Since we don't have direct profile fetch by ID, filter list or let it default.
        // Or update agent availability by calling patching on it.
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
              DF
            </span>
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Daffodil Agent
            </span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6 text-center space-y-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Duty Status</span>
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800/80 rounded-lg p-2">
              <span className={`text-xs font-bold ${available ? 'text-emerald-400' : 'text-rose-400'}`}>
                {available ? 'ONLINE' : 'OFFLINE'}
              </span>
              <button
                onClick={handleToggleOnline}
                className={`py-1 px-3.5 rounded text-[10px] font-semibold transition-all border ${
                  available
                    ? 'bg-rose-600/10 hover:bg-rose-600 border-rose-550/20 text-rose-450 hover:text-white'
                    : 'bg-emerald-600/10 hover:bg-emerald-600 border-emerald-550/20 text-emerald-450 hover:text-white'
                }`}
              >
                {available ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/agent/orders"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              Assigned Tasks
            </Link>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <div className="px-3 py-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Agent Panel</p>
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
