'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, QrCode } from 'lucide-react';
import UPIPaymentModal from '@/components/UPIPaymentModal';

interface Order {
  id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupZone: { name: string };
  dropZone: { name: string };
  billableWeight: number;
  finalAmount: number;
  status: string;
  isPaid?: boolean;
  paymentMethod?: string;
  paymentTxnId?: string;
  createdAt: string;
  assignedAgent?: { user: { name: string } };
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payment Modal state
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

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
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            My Shipments
          </h1>
          <p className="text-slate-400 text-sm mt-1">Track, manage & pay for your delivery requests</p>
        </div>
        <Link
          href="/customer/orders/create"
          className="py-3 px-5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all"
        >
          Ship New Parcel
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Orders list */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-500 text-sm">You haven&apos;t created any delivery requests yet.</p>
            <Link
              href="/customer/orders/create"
              className="inline-block py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold transition-all"
            >
              Book Your First Parcel
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Billable Weight</th>
                  <th className="py-3 px-4 text-right">Final Amount</th>
                  <th className="py-3 px-4 text-center">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-850/20 text-slate-300">
                    <td className="py-3.5 px-4 font-mono text-xs text-violet-400 select-all max-w-[120px] truncate">
                      {order.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-250">{order.pickupZone.name}</span>
                        <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{order.pickupAddress}</span>
                        <span className="text-[10px] text-slate-650 my-0.5">↓ to</span>
                        <span className="font-semibold text-slate-250">{order.dropZone.name}</span>
                        <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{order.dropAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    
                    {/* Payment Status & UPI Pay Button */}
                    <td className="py-3.5 px-4 text-center">
                      {order.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          PAID
                        </span>
                      ) : (
                        <button
                          onClick={() => setSelectedPaymentOrder(order)}
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-[#E8622C]/10 hover:bg-[#E8622C] text-[#E8622C] hover:text-white rounded-lg text-xs font-bold transition-all border border-[#E8622C]/30 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pay UPI / QR</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium">{order.billableWeight.toFixed(2)} kg</td>
                    <td className="py-3.5 px-4 text-right font-bold text-violet-400">₹{order.finalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-550">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!order.isPaid && (
                          <button
                            onClick={() => setSelectedPaymentOrder(order)}
                            className="py-1 px-2.5 bg-[#E8622C] text-white rounded-lg text-xs font-bold hover:bg-[#FF7A00] transition-all shadow-sm"
                          >
                            Pay
                          </button>
                        )}
                        <Link
                          href={`/customer/orders/${order.id}`}
                          className="py-1 px-3 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-violet-500/20"
                        >
                          Track
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPI Payment Modal */}
      {selectedPaymentOrder && (
        <UPIPaymentModal
          isOpen={!!selectedPaymentOrder}
          onClose={() => setSelectedPaymentOrder(null)}
          orderId={selectedPaymentOrder.id}
          amount={selectedPaymentOrder.finalAmount}
          onPaymentComplete={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
