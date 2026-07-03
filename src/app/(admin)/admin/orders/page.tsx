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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data);
      setFilteredOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter));
    }
  }, [statusFilter, orders]);

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
            Global Shipment Queue
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Monitor, filter, and track order lifecycles</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Filter panel & list */}
      <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-foreground/10 pb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Order Registers</h2>
          
          {/* Filter dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/50 font-bold uppercase tracking-wider">Filter status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-foreground/10 rounded-lg px-4 py-2 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
            >
              <option value="ALL">All Shipments</option>
              <option value="CREATED">Created</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="NEW_AGENT_ASSIGNED">Re-assigned</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-foreground/45 text-sm py-4 italic text-center">No orders match this status filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-foreground/50 font-bold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                  <th className="py-3 px-4 text-center">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/5 text-foreground/80">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-foreground/[0.02]">
                    <td className="py-3.5 px-4 font-mono text-xs text-accent select-all max-w-[100px] truncate">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{order.customer.name}</span>
                        <span className="text-[10px] text-foreground/40 font-medium">{order.customer.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{order.pickupZone.name} → {order.dropZone.name}</span>
                        <span className="text-[10px] text-foreground/50 truncate max-w-[200px]">{order.pickupAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.assignedAgent ? (
                        <span className="font-semibold text-foreground">{order.assignedAgent.user.name}</span>
                      ) : (
                        <span className="text-foreground/35 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-accent">₹{order.finalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center text-xs text-foreground/40">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
