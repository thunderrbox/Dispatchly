'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface TrackingEvent {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  isOverride: boolean;
  timestamp: string;
  changedByUser: { name: string; role: string };
}

interface Order {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupZone: { name: string };
  dropZone: { name: string };
  actualWeight: number;
  volumetricWeight: number;
  billableWeight: number;
  orderType: string;
  paymentType: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  assignedAgent?: { user: { name: string; email: string } };
  trackingEvents: TrackingEvent[];
  transactionId?: string | null;
}

export default function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSuccess, setRescheduleSuccess] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch order detail');
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate) return;
    setRescheduling(true);
    setRescheduleError('');
    setRescheduleSuccess('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rescheduleDate }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reschedule failed');

      setRescheduleSuccess('Order rescheduled successfully!');
      fetchOrderDetail();
    } catch (err: any) {
      setRescheduleError(err.message || 'Failed to reschedule order');
    } finally {
      setRescheduling(false);
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
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-xl font-medium">
          {error || 'Order details not found'}
        </div>
        <Link href="/customer/orders" className="text-violet-400 hover:underline text-sm font-semibold">
          Back to Shipments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header with back button */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/customer/orders" className="text-xs text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider block mb-2">
            ← Back to Shipments
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Shipment <span className="font-mono text-sm text-violet-400 select-all">{order.id}</span>
          </h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Detail Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Package Details & Route */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Delivery Details</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 text-xs uppercase font-semibold">Pickup From</span>
                  <p className="font-semibold text-slate-200">{order.pickupZone.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{order.pickupAddress}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-semibold">Deliver To</span>
                  <p className="font-semibold text-slate-200">{order.dropZone.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{order.dropAddress}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-y-1">
                  <span className="text-slate-500 text-xs uppercase font-semibold col-span-2">Package Weight & Size</span>
                  <span className="text-slate-450 text-xs">Actual:</span>
                  <span className="text-right text-slate-350 text-xs font-semibold">{order.actualWeight.toFixed(2)} kg</span>
                  <span className="text-slate-450 text-xs">Volumetric:</span>
                  <span className="text-right text-slate-350 text-xs font-semibold">{order.volumetricWeight.toFixed(2)} kg</span>
                  <span className="text-slate-450 text-xs">Billable:</span>
                  <span className="text-right text-slate-200 text-xs font-bold">{order.billableWeight.toFixed(2)} kg</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase font-semibold">Payment Details</span>
                  <p className="text-slate-200 font-semibold">{order.paymentType} • ₹{order.finalAmount.toFixed(2)}</p>
                  {order.transactionId && (
                    <p className="text-[10px] text-emerald-600 font-mono mt-1 font-semibold bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded w-fit">
                      Txn Ref: {order.transactionId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Agent Details */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Courier Details</h2>
            {order.assignedAgent ? (
              <div className="flex items-center gap-4 text-sm">
                <div className="h-10 w-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400">
                  {order.assignedAgent.user.name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-200">{order.assignedAgent.user.name}</p>
                  <p className="text-xs text-slate-500">{order.assignedAgent.user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Waiting to assign courier agent...</p>
            )}
          </div>

          {/* Reschedule Option for FAILED deliveries */}
          {order.status === 'FAILED' && (
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold border-b border-slate-800 pb-2 text-rose-450">Reschedule Failed Delivery</h2>
              {rescheduleError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg">
                  {rescheduleError}
                </div>
              )}
              {rescheduleSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg">
                  {rescheduleSuccess}
                </div>
              )}
              <form onSubmit={handleReschedule} className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={rescheduling || !rescheduleDate}
                  className="py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  {rescheduling ? 'Rescheduling...' : 'Request Reschedule'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Tracking Timeline Panel */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold border-b border-slate-800 pb-2">Tracking History</h2>
          
          <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6 text-sm">
            {order.trackingEvents.map((event) => (
              <div key={event.id} className="relative">
                {/* Bullet dot */}
                <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-violet-600 border-2 border-slate-950 ring-4 ring-violet-500/10"></span>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-200">{event.newStatus}</span>
                    {event.isOverride && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                        OVERRIDE
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    {new Date(event.timestamp).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    Updated by {event.changedByUser.name} ({event.changedByUser.role.toLowerCase()})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
