'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
      setError(err.message || 'Failed to toggle availability');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
          Delivery Agents
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Monitor availability, location coordinates and workloads</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Agents Load Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white border border-foreground/10 p-6 rounded-2xl text-center text-foreground/40">
          No delivery agents registered in the system yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          {/* List panel */}
          <div className="md:col-span-2 bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Agent Directory</h2>
            <div className="divide-y divide-foreground/5">
              {agents.map((agent) => (
                <div key={agent.id} className="py-4 flex justify-between items-start gap-4 text-foreground/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{agent.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          agent.available
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {agent.available ? 'Available' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/50">{agent.email}</p>
                    <p className="text-xs text-foreground/60">
                      Location: <span className="font-mono text-accent font-semibold">{agent.currentLatitude.toFixed(4)}, {agent.currentLongitude.toFixed(4)}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span className="bg-background text-foreground/75 px-2.5 py-1 rounded-lg border border-foreground/10 font-bold">
                      {agent.activeOrderCount} Active Load
                    </span>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setEditingAgent(agent);
                          setNewLat(agent.currentLatitude.toString());
                          setNewLng(agent.currentLongitude.toString());
                        }}
                        className="py-1.5 px-3 bg-background hover:bg-foreground/5 border border-foreground/10 text-foreground rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Edit GPS
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleToggleAvailability(agent)}
                        className={`py-1.5 px-3 rounded-lg font-bold transition-all border cursor-pointer ${
                          agent.available
                            ? 'bg-rose-50 hover:bg-rose-600 border-rose-200 text-rose-600 hover:text-white'
                            : 'bg-emerald-50 hover:bg-emerald-600 border-emerald-200 text-emerald-600 hover:text-white'
                        }`}
                      >
                        {agent.available ? 'Go Offline' : 'Go Online'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Edit GPS Side panel */}
          {editingAgent && (
            <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4 h-fit">
              <h2 className="text-lg font-display font-bold text-foreground">Update GPS Coordinate</h2>
              <p className="text-xs text-foreground/60">Modifying GPS coordinates for agent <span className="font-bold text-accent">{editingAgent.name}</span></p>
              
              <form onSubmit={handleUpdateAgentProfile} className="space-y-4">
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-foreground font-mono"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEditingAgent(null)}
                    className="flex-1 py-2 bg-background hover:bg-foreground/5 border border-foreground/10 text-foreground rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-2 bg-[#E8622C] hover:opacity-90 text-[#FAF7F2] rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {updating ? 'Saving...' : 'Save Location'}
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
