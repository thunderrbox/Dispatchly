'use client';

import React, { useState, useEffect } from 'react';

interface Area {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
  areas: Area[];
}

export default function AdminZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newZoneName, setNewZoneName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/zones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch zones');
      setZones(data);
      if (data.length > 0 && !selectedZoneId) {
        setSelectedZoneId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newZoneName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create zone');
      setSuccess(`Zone "${data.name}" created successfully!`);
      setNewZoneName('');
      fetchZones();
    } catch (err: any) {
      setError(err.message || 'Failed to create zone');
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim() || !selectedZoneId) return;
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/zones/${selectedZoneId}/areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newAreaName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add area');
      setSuccess(`Area "${data.name}" added successfully!`);
      setNewAreaName('');
      fetchZones();
    } catch (err: any) {
      setError(err.message || 'Failed to add area');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Zone & Area Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">Configure physical zones and areas for deliveries</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl font-medium">
          {success}
        </div>
      )}

      {/* Action Forms Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Zone */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Create New Zone</h2>
          <form onSubmit={handleCreateZone} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Zone Name
              </label>
              <input
                type="text"
                required
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="e.g. Zone A, Downtown, North Region"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-600 text-white"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            >
              Create Zone
            </button>
          </form>
        </div>

        {/* Add Area to Zone */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold text-slate-100">Add Area to Zone</h2>
          <form onSubmit={handleCreateArea} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Select Zone
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id} className="bg-slate-900 text-white">
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Area Name
              </label>
              <input
                type="text"
                required
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder="e.g. Manhattan, Sector 5, Brooklyn Heights"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-600 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={zones.length === 0}
              className="py-3 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              Add Area
            </button>
          </form>
        </div>
      </div>

      {/* Zone list mapping */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Zone Directory</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
          </div>
        ) : zones.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No zones configured yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-violet-400 truncate">{zone.name}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300">
                    {zone.areas.length} {zone.areas.length === 1 ? 'Area' : 'Areas'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {zone.areas.length === 0 ? (
                    <span className="text-xs text-slate-600 italic">No areas added</span>
                  ) : (
                    zone.areas.map((area) => (
                      <span
                        key={area.id}
                        className="text-xs bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800"
                      >
                        {area.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
