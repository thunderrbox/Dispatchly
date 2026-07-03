'use client';

import React, { useState, useEffect } from 'react';

interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  currentLatitude: number;
  currentLongitude: number;
  available: boolean;
  activeOrderCount: number;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch agents');
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleUpdateAgentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setUpdating(true);
    setError('');

    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Latitude and Longitude must be valid numbers');
      setUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/${editingAgent.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentLatitude: lat,
          currentLongitude: lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update agent');

      setEditingAgent(null);
      fetchAgents();
    } catch (err: any) {
      setError(err.message || 'Failed to update agent location');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAvailability = async (agent: Agent) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/${agent.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          available: !agent.available,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to toggle availability');
      }

      fetchAgents();
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Delivery Agents
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitor availability, location coordinates and workloads</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Agents Load Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center text-slate-500">
          No delivery agents registered in the system yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* List panel */}
          <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Agent Directory</h2>
            <div className="divide-y divide-slate-800/50">
              {agents.map((agent) => (
                <div key={agent.id} className="py-4 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{agent.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          agent.available
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'
                            : 'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                        }`}
                      >
                        {agent.available ? 'Available' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{agent.email}</p>
                    <p className="text-xs text-slate-400">
                      Location: <span className="font-mono text-violet-300">{agent.currentLatitude.toFixed(4)}, {agent.currentLongitude.toFixed(4)}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span className="bg-slate-950/60 text-slate-350 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
                      {agent.activeOrderCount} Active Load
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAgent(agent);
                          setNewLat(agent.currentLatitude.toString());
                          setNewLng(agent.currentLongitude.toString());
                        }}
                        className="py-1 px-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-md font-semibold transition-all"
                      >
                        Edit GPS
                      </button>
                      <button
                        onClick={() => handleToggleAvailability(agent)}
                        className={`py-1 px-2.5 rounded-md font-semibold transition-all border ${
                          agent.available
                            ? 'bg-rose-600/10 hover:bg-rose-600 border-rose-550/20 text-rose-400 hover:text-white'
                            : 'bg-emerald-600/10 hover:bg-emerald-600 border-emerald-550/20 text-emerald-400 hover:text-white'
                        }`}
                      >
                        {agent.available ? 'Go Offline' : 'Go Online'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Edit GPS Side panel */}
          {editingAgent && (
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-850 p-6 rounded-2xl space-y-4 h-fit">
              <h2 className="text-lg font-bold text-slate-100">Update GPS Coordinate</h2>
              <p className="text-xs text-slate-400">Modifying GPS coordinates for agent <span className="font-bold text-violet-400">{editingAgent.name}</span></p>
              
              <form onSubmit={handleUpdateAgentProfile} className="space-y-4">
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 text-white font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
                  >
                    {updating ? 'Saving...' : 'Save Location'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
