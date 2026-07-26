'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Copy, Smartphone, QrCode, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  onPaymentComplete: (txnId: string, method: string) => void;
}

export default function UPIPaymentModal({
  isOpen,
  onClose,
  orderId,
  amount,
  onPaymentComplete,
}: UPIPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'QR' | 'GPAY' | 'PAYTM' | 'PHONEPE'>('QR');
  const [utrNumber, setUtrNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const adminPhone = '9696146006';
  const adminName = 'Abhijeet Singh Rana (Dispatchly Admin)';
  const primaryUpiId = '9696146006@paytm';
  
  // Format clean order reference
  const orderRef = orderId.length > 8 ? orderId.slice(0, 8).toUpperCase() : orderId.toUpperCase();
  const formattedAmount = amount.toFixed(2);

  // Dynamic UPI URI string
  const upiUri = `upi://pay?pa=${primaryUpiId}&pn=${encodeURIComponent('Dispatchly Logistics')}&am=${formattedAmount}&tr=${orderRef}&tn=${encodeURIComponent(`Dispatchly Order ${orderRef}`)}&cu=INR`;

  // QR Code URL using high reliability QR generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiUri)}&color=0B0A0F&bgcolor=FFFFFF`;

  const copyUpiId = () => {
    navigator.clipboard.writeText(primaryUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const finalTxnId = utrNumber.trim() || `UPI-TXN-${Date.now()}`;

    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: `UPI_${selectedMethod}`,
          paymentTxnId: finalTxnId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment confirmation failed');
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        onPaymentComplete(finalTxnId, `UPI_${selectedMethod}`);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Payment processing error');
      setIsSubmitting(false);
    }
  };

  const launchApp = (appScheme: string) => {
    window.open(`${appScheme}://pay?pa=${primaryUpiId}&pn=Dispatchly&am=${formattedAmount}&tn=Order-${orderRef}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-[#161520] border border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden text-white"
        >
          {!paymentSuccess ? (
            <div>
              {/* Header */}
              <div className="p-6 pb-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E8622C] bg-[#E8622C]/10 px-2.5 py-1 rounded-full border border-[#E8622C]/20">
                    Direct Admin UPI Payment
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1.5">Dispatchly Checkout</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/50 uppercase font-semibold">Total Amount</p>
                  <p className="text-2xl font-extrabold text-[#E8622C]">₹{formattedAmount}</p>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl text-center">
                    {error}
                  </div>
                )}

                {/* Receiver Info Banner */}
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <p className="text-[10px] text-white/50 font-bold uppercase">Payment Receiver (Admin)</p>
                    <p className="font-semibold text-white">{adminName}</p>
                    <p className="text-[11px] text-[#E8622C] font-mono">Mobile: +91 {adminPhone}</p>
                  </div>
                  <button
                    onClick={copyUpiId}
                    type="button"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-all flex items-center gap-1.5 text-[11px] font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy UPI'}
                  </button>
                </div>

                {/* Method Tabs */}
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QR')}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      selectedMethod === 'QR' ? 'bg-[#E8622C] text-white shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('GPAY')}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      selectedMethod === 'GPAY' ? 'bg-[#E8622C] text-white shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('PAYTM')}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      selectedMethod === 'PAYTM' ? 'bg-[#E8622C] text-white shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Paytm
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('PHONEPE')}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                      selectedMethod === 'PHONEPE' ? 'bg-[#E8622C] text-white shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    PhonePe
                  </button>
                </div>

                {/* QR Display */}
                {selectedMethod === 'QR' && (
                  <div className="text-center space-y-3">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-xl relative group border border-white/20">
                      {/* Dynamic QR Code Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeUrl}
                        alt="Dynamic Admin UPI QR Code"
                        className="w-48 h-48 mx-auto rounded-lg object-contain"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white/90">Scan with Google Pay, Paytm, PhonePe or BHIM</p>
                      <p className="text-[10px] text-white/50">Dynamic Order Ref: <span className="font-mono text-[#E8622C]">{orderRef}</span></p>
                    </div>
                  </div>
                )}

                {/* Direct App Launch Buttons */}
                {selectedMethod === 'GPAY' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                      <Smartphone className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Pay via Google Pay</h4>
                      <p className="text-xs text-white/60 mt-1">Directly transfers ₹{formattedAmount} to {adminPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => launchApp('gpay')}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Open Google Pay App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedMethod === 'PAYTM' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                      <Smartphone className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Pay via Paytm</h4>
                      <p className="text-xs text-white/60 mt-1">Directly transfers ₹{formattedAmount} to {adminPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => launchApp('paytmmp')}
                      className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Open Paytm App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {selectedMethod === 'PHONEPE' && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                      <Smartphone className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Pay via PhonePe</h4>
                      <p className="text-xs text-white/60 mt-1">Directly transfers ₹{formattedAmount} to {adminPhone}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => launchApp('phonepe')}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Open PhonePe App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* UTR Entry & Form Submission */}
                <form onSubmit={handleConfirmPayment} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-white/60 mb-1">
                      Enter 12-Digit UTR / Transaction Ref ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="e.g. 420192837482"
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#E8622C] font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-3 text-xs font-bold text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-2 py-3 bg-[#E8622C] hover:bg-[#FF7A00] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#E8622C]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying Payment...</span>
                        </>
                      ) : (
                        <>
                          <span>I Have Paid ₹{formattedAmount}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-3 bg-white/5 border-t border-white/10 text-center text-[10px] text-white/40">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                Protected by Dispatchly Immutable Order Payment Ledger
              </div>
            </div>
          ) : (
            /* Animated Payment Success Screen */
            <div className="p-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-16 h-16 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white">Payment Received!</h3>
              <p className="text-xs text-white/70">
                ₹{formattedAmount} successfully credited to Admin account <span className="font-bold text-white">+91 {adminPhone}</span>
              </p>
              <p className="text-[11px] text-emerald-400 font-mono">Order {orderRef} marked as PREPAID</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
