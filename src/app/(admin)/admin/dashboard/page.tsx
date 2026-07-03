'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupZone: { name: string };
  dropZone: { name: string };
  billableWeight: number;
  finalAmount: number;
  status: string;
  createdAt: string;
  customer: { name: string; email: string };
  assignedAgent?: { user: { name: string } };
}

interface Agent {
  id: string;
  name: string;
  available: boolean;
  activeOrderCount: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assigningAgentId, setAssigningAgentId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      // Fetch dashboard metrics
      const dashboardRes = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardRes.json();
      if (!dashboardRes.ok) throw new Error(dashboardData.error || 'Failed to load dashboard metrics');
      setMetrics(dashboardData);

      // Fetch delivery agents
      const agentsRes = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const agentsData = await agentsRes.json();
      if (!agentsRes.ok) throw new Error(agentsData.error || 'Failed to load agents');
      setAgents(agentsData);
      if (agentsData.length > 0) {
        const firstAvailable = agentsData.find((a: any) => a.available);
        setAssigningAgentId(firstAvailable ? firstAvailable.id : agentsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !assigningAgentId) return;
    setSubmittingAssign(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${selectedOrder.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId: assigningAgentId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Manual assignment failed');

      setSuccess(`Courier successfully assigned manually to order.`);
      setSelectedOrder(null);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Manual assignment failed');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    setSubmittingAssign(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/auto-assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Auto assignment failed');

      setSuccess(`Auto-assigned closest courier: ${data.assignedAgent.name} (Distance: ${data.assignedAgent.distanceKm.toFixed(2)} km)`);
      setSelectedOrder(null);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message || 'Auto assignment failed');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'PICKED_UP':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'IN_TRANSIT':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'RESCHEDULED':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'NEW_AGENT_ASSIGNED':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  const { statusCounts, unassignedCount, agentsSummary, recentOrders, zoneBreakdown } = metrics;
  const totalOrders = Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time metrics, shipment queues, and courier logs</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm p-4 rounded-xl font-medium">
          {success}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Bookings</span>
          <p className="text-3xl font-bold text-slate-100">{totalOrders}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-rose-450 uppercase font-semibold">Unassigned Shipments</span>
          <p className="text-3xl font-bold text-rose-400">{unassignedCount}</p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-emerald-450 uppercase font-semibold">Online Couriers</span>
          <p className="text-3xl font-bold text-emerald-400">
            {agentsSummary.available} <span className="text-sm font-normal text-slate-550">/ {agentsSummary.total}</span>
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-violet-450 uppercase font-semibold">Completed Shipments</span>
          <p className="text-3xl font-bold text-violet-400">{statusCounts.DELIVERED}</p>
        </div>
      </div>

      {/* Main dashboard content layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">Recent Order Queue</h2>
            {recentOrders.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 italic">No shipments registered in the system.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Courier</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {recentOrders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-slate-850/10 text-slate-300">
                        <td className="py-3 px-3 font-mono text-violet-400 select-all max-w-[80px] truncate">
                          {order.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-200">{order.pickupZone.name}</span> → <span className="font-semibold text-slate-200">{order.dropZone.name}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {order.assignedAgent ? (
                            <span className="font-medium text-slate-300">{order.assignedAgent.user.name}</span>
                          ) : (
                            <span className="text-slate-600 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-violet-450">${order.finalAmount.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="py-1 px-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded font-semibold transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Action sidebar & Info panels */}
        <div className="space-y-6">
          {/* Active order details & assignment control */}
          {selectedOrder && (
            <div className="bg-slate-900/60 border border-slate-850 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-md font-bold text-slate-100">Courier Assignment</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-slate-500 hover:text-slate-300 font-bold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 text-xs space-y-2 text-slate-300">
                <p className="font-mono text-violet-400 truncate">ID: {selectedOrder.id}</p>
                <p>Route: <span className="font-bold text-slate-200">{selectedOrder.pickupZone.name}</span> → <span className="font-bold text-slate-200">{selectedOrder.dropZone.name}</span></p>
                <p>Address: <span className="text-slate-400">{selectedOrder.pickupAddress}</span></p>
                <p>Status: <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
              </div>

              {selectedOrder.status === 'CREATED' ? (
                <div className="space-y-4 pt-2">
                  {/* Auto assign */}
                  <button
                    onClick={() => handleAutoAssign(selectedOrder.id)}
                    disabled={submittingAssign || agents.filter((a) => a.available).length === 0}
                    className="w-full py-2.5 bg-violet-650 hover:bg-violet-600 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {submittingAssign ? 'Assigning...' : '⚡ Auto-Assign Nearest Courier'}
                  </button>

                  <div className="border-t border-slate-800 my-4 text-center relative">
                    <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-semibold absolute top-[-9px] left-1/2 translate-x-[-50%]">
                      Or Manual Select
                    </span>
                  </div>

                  {/* Manual assign form */}
                  <form onSubmit={handleManualAssign} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                        Select Online Courier
                      </label>
                      <select
                        value={assigningAgentId}
                        onChange={(e) => setAssigningAgentId(e.target.value)}
                        className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-medium"
                      >
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id} className="bg-slate-900">
                            {agent.name} ({agent.activeOrderCount} busy, {agent.available ? 'online' : 'offline'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingAssign || agents.length === 0}
                      className="w-full py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
                    >
                      Assign Selected Courier
                    </button>
                  </form>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-2 text-center">
                  Only orders in &quot;CREATED&quot; state can have couriers assigned or matched.
                </p>
              )}
            </div>
          )}

          {/* Regional statistics breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="text-md font-bold text-slate-100">Orders by Origin Zone</h3>
            {zoneBreakdown.length === 0 ? (
              <p className="text-slate-500 text-xs italic">No regional statistics recorded.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {zoneBreakdown.map((zone: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/50 border border-slate-850 p-2.5 rounded-lg">
                    <span className="font-semibold text-slate-350">{zone.zoneName}</span>
                    <span className="font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/15">
                      {zone.count} {zone.count === 1 ? 'order' : 'orders'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
