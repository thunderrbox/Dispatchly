'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
  transactionId?: string;
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
      const dashboardRes = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dashboardData = await dashboardRes.json();
      if (!dashboardRes.ok) throw new Error(dashboardData.error || 'Failed to load dashboard metrics');
      setMetrics(dashboardData);

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
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20';
      case 'PICKED_UP':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'IN_TRANSIT':
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20';
      case 'OUT_FOR_DELIVERY':
        return 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
      case 'RESCHEDULED':
        return 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20';
      case 'NEW_AGENT_ASSIGNED':
        return 'bg-violet-500/10 text-violet-600 border border-violet-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Skeleton Header */}
        <div className="h-10 bg-foreground/10 rounded-lg w-1/4"></div>
        
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background border border-foreground/10 p-5 rounded-2xl h-24 space-y-3">
              <div className="h-3 bg-foreground/10 rounded w-1/2"></div>
              <div className="h-8 bg-foreground/10 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Body */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-background border border-foreground/10 p-6 rounded-2xl h-80"></div>
          <div className="bg-background border border-foreground/10 p-6 rounded-2xl h-80"></div>
        </div>
      </div>
    );
  }

  const { statusCounts, unassignedCount, agentsSummary, recentOrders, zoneBreakdown } = metrics;
  const totalOrders = Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Real-time metrics, shipment queues, and courier logs</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-4 rounded-xl font-medium">
          {success}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-foreground/10 p-5 rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] text-foreground/50 uppercase font-bold tracking-wider">Total Bookings</span>
          <p className="text-3xl font-display font-bold text-foreground">{totalOrders}</p>
        </div>
        <div className="bg-white border border-foreground/10 p-5 rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Unassigned Shipments</span>
          <p className="text-3xl font-display font-bold text-accent">{unassignedCount}</p>
        </div>
        <div className="bg-white border border-foreground/10 p-5 rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Online Couriers</span>
          <p className="text-3xl font-display font-bold text-foreground">
            {agentsSummary.available} <span className="text-sm font-normal text-foreground/40">/ {agentsSummary.total}</span>
          </p>
        </div>
        <div className="bg-white border border-foreground/10 p-5 rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] text-[#E8622C] uppercase font-bold tracking-wider font-sans">Completed Shipments</span>
          <p className="text-3xl font-display font-bold text-[#E8622C]">{statusCounts.DELIVERED}</p>
        </div>
      </div>

      {/* Main dashboard content layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-lg font-display font-bold text-foreground border-b border-foreground/10 pb-2">Recent Order Queue</h2>
            {recentOrders.length === 0 ? (
              <p className="text-foreground/40 text-sm py-4 italic">No shipments registered in the system.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-foreground/10 text-foreground/50 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Route</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Courier</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-foreground/5">
                    {recentOrders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-foreground/[0.02] text-foreground/80">
                        <td className="py-3.5 px-3 font-mono text-accent select-all max-w-[80px] truncate">
                          {order.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-foreground">{order.pickupZone.name}</span> → <span className="font-bold text-foreground">{order.dropZone.name}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          {order.assignedAgent ? (
                            <span className="font-semibold text-foreground">{order.assignedAgent.user.name}</span>
                          ) : (
                            <span className="text-foreground/30 italic">Unassigned</span>
                          )}
                        </td>
                         <td className="py-3.5 px-3 text-right">
                           <div className="flex flex-col items-end font-sans">
                             <span className="font-bold text-accent">₹{order.finalAmount.toFixed(2)}</span>
                             {order.transactionId && (
                               <span className="text-[9px] text-foreground/40 font-mono font-bold mt-0.5">{order.transactionId}</span>
                             )}
                           </div>
                         </td>
                        <td className="py-3.5 px-3 text-right">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedOrder(order)}
                            className="py-1 px-2.5 bg-background hover:bg-foreground/5 border border-foreground/10 text-foreground rounded font-bold transition-all cursor-pointer"
                          >
                            Manage
                          </motion.button>
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
          <AnimatePresence mode="wait">
            {/* Active order details & assignment control */}
            {selectedOrder && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-md font-display font-bold text-foreground">Courier Assignment</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs text-foreground/40 hover:text-foreground font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="bg-background border border-foreground/10 rounded-xl p-3 text-xs space-y-2 text-foreground/80">
                  <p className="font-mono text-accent truncate">ID: {selectedOrder.id}</p>
                  <p>Route: <span className="font-bold text-foreground">{selectedOrder.pickupZone.name}</span> → <span className="font-bold text-foreground">{selectedOrder.dropZone.name}</span></p>
                  <p>Address: <span className="text-foreground/60">{selectedOrder.pickupAddress}</span></p>
                  <p>Status: <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
                </div>

                {selectedOrder.status === 'CREATED' ? (
                  <div className="space-y-4 pt-2">
                    {/* Auto assign */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAutoAssign(selectedOrder.id)}
                      disabled={submittingAssign || agents.filter((a) => a.available).length === 0}
                      className="w-full py-2.5 bg-accent hover:opacity-90 text-background rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      {submittingAssign ? 'Assigning...' : '⚡ Auto-Assign Nearest Courier'}
                    </motion.button>

                    <div className="border-t border-foreground/10 my-4 text-center relative">
                      <span className="bg-white px-3 text-[10px] text-foreground/40 uppercase font-bold tracking-wider absolute top-[-9px] left-1/2 translate-x-[-50%]">
                        Or Manual Select
                      </span>
                    </div>

                    {/* Manual assign form */}
                    <form onSubmit={handleManualAssign} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-foreground/40 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                          Select Online Courier
                        </label>
                        <select
                          value={assigningAgentId}
                          onChange={(e) => setAssigningAgentId(e.target.value)}
                          className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground font-semibold"
                        >
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id} className="bg-background">
                              {agent.name} ({agent.activeOrderCount} busy, {agent.available ? 'online' : 'offline'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={submittingAssign || agents.length === 0}
                        className="w-full py-2.5 bg-background hover:bg-foreground/5 text-foreground border border-foreground/10 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Assign Selected Courier
                      </motion.button>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/40 italic py-2 text-center">
                    Only orders in &quot;CREATED&quot; state can have couriers assigned.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Regional statistics breakdown */}
          <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-md font-display font-bold text-foreground">Orders by Origin Zone</h3>
            {zoneBreakdown.length === 0 ? (
              <p className="text-foreground/40 text-xs italic">No regional statistics recorded.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {zoneBreakdown.map((zone: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-background border border-foreground/10 p-2.5 rounded-lg">
                    <span className="font-bold text-foreground/80">{zone.zoneName}</span>
                    <span className="font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
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
