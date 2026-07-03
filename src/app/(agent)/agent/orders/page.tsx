'use client';

import React, { useState, useEffect } from 'react';

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
}

// Client-side representation of state machine transitions
const VALID_TRANSITIONS: Record<string, { label: string; nextStatus: string }[]> = {
  CREATED: [{ label: 'Mark Picked Up', nextStatus: 'PICKED_UP' }],
  PICKED_UP: [{ label: 'Mark In Transit', nextStatus: 'IN_TRANSIT' }],
  IN_TRANSIT: [{ label: 'Mark Out for Delivery', nextStatus: 'OUT_FOR_DELIVERY' }],
  OUT_FOR_DELIVERY: [
    { label: 'Mark Delivered', nextStatus: 'DELIVERED' },
    { label: 'Mark Delivery Failed', nextStatus: 'FAILED' },
  ],
  FAILED: [], // Terminal for agent, customer must reschedule
  RESCHEDULED: [], // Terminal for agent, admin must re-assign agent
  NEW_AGENT_ASSIGNED: [{ label: 'Mark Out for Delivery', nextStatus: 'OUT_FOR_DELIVERY' }],
  DELIVERED: [], // Terminal state
};

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setSuccess(`Shipment status updated to "${nextStatus}" successfully!`);
      
      // Refresh details and lists
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update shipment status');
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Assigned Shipments
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage and update courier tasks assigned to you</p>
      </div>

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

      {/* Grid of assigned tasks + task actions */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* List panel */}
          <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Tasks</h2>
            {orders.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 italic">No shipments currently assigned to you.</p>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`py-4 px-3 rounded-xl cursor-pointer transition-all flex justify-between items-center gap-4 ${
                      selectedOrder?.id === order.id
                        ? 'bg-violet-950/20 border border-violet-500/20'
                        : 'hover:bg-slate-850/20 border border-transparent'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-mono text-xs text-violet-400 font-bold select-all truncate">
                        ID: {order.id}
                      </p>
                      <p className="text-xs text-slate-350 truncate">
                        <span className="font-bold">{order.pickupZone.name}</span> → <span className="font-bold">{order.dropZone.name}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Cust: {order.customer.name}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action side panel */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4 h-fit">
            <h2 className="text-xl font-bold text-slate-100">Task Control</h2>
            {selectedOrder ? (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 space-y-2">
                  <p className="font-mono text-xs text-violet-400 truncate">Order ID: {selectedOrder.id}</p>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Pickup Address</span>
                    <p className="text-slate-300 font-semibold">{selectedOrder.pickupAddress}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Drop Address</span>
                    <p className="text-slate-300 font-semibold">{selectedOrder.dropAddress}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Customer</span>
                    <p className="text-slate-300 font-semibold">{selectedOrder.customer.name} ({selectedOrder.customer.email})</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-semibold">Current State</span>
                    <p className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">State Machine Actions</span>
                  {VALID_TRANSITIONS[selectedOrder.status] && VALID_TRANSITIONS[selectedOrder.status].length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {VALID_TRANSITIONS[selectedOrder.status].map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleUpdateStatus(selectedOrder.id, action.nextStatus)}
                          className={`w-full py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] border ${
                            action.nextStatus === 'FAILED'
                              ? 'bg-rose-600/10 hover:bg-rose-650 border-rose-500/20 text-rose-400 hover:text-white'
                              : 'bg-violet-650 hover:bg-violet-600 text-white border-violet-550'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-2">
                      This shipment has reached a terminal or locked state. No further courier operations available.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                Select an assigned shipment to trigger courier workflows.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
