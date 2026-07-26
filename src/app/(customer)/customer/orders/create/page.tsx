'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import UPIPaymentModal from '@/components/UPIPaymentModal';

interface Area {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
  areas: Area[];
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [pickupAreaName, setPickupAreaName] = useState('');
  const [dropAreaName, setDropAreaName] = useState('');
  const [actualWeight, setActualWeight] = useState('1');
  const [lengthCm, setLengthCm] = useState('10');
  const [widthCm, setWidthCm] = useState('10');
  const [heightCm, setHeightCm] = useState('10');
  const [orderType, setOrderType] = useState<'B2B' | 'B2C'>('B2C');
  const [paymentType, setPaymentType] = useState<'PREPAID' | 'COD'>('PREPAID');

  // Pricing preview state
  const [preview, setPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState('');

  // Payment Gateway Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'PAYTM' | 'GPAY'>('GPAY');
  const [paymentTimer, setPaymentTimer] = useState(300);
  const [paymentSimulating, setPaymentSimulating] = useState(false);

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/zones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load regions');
      setZones(data);

      if (data.length > 0) {
        const flatAreas = data.flatMap((z: any) => z.areas);
        if (flatAreas.length > 0) {
          setPickupAreaName(flatAreas[0].name);
          setDropAreaName(flatAreas[0].name);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Timer Tick for checkout modal
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showPaymentModal && paymentTimer > 0) {
      interval = setInterval(() => {
        setPaymentTimer((prev) => prev - 1);
      }, 1000);
    } else if (paymentTimer === 0) {
      setShowPaymentModal(false);
      setError('Payment window expired. Please try again.');
    }
    return () => clearInterval(interval);
  }, [showPaymentModal, paymentTimer]);

  // Update live preview when relevant fields change
  useEffect(() => {
    if (loading || zones.length === 0) return;

    const weight = parseFloat(actualWeight);
    const length = parseFloat(lengthCm);
    const width = parseFloat(widthCm);
    const height = parseFloat(heightCm);

    if (
      isNaN(weight) ||
      weight <= 0 ||
      isNaN(length) ||
      length <= 0 ||
      isNaN(width) ||
      width <= 0 ||
      isNaN(height) ||
      height <= 0 ||
      !pickupAreaName ||
      !dropAreaName
    ) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewError('');
      try {
        const token = localStorage.getItem('token');
        const allAreas = zones.flatMap((z) => z.areas.map((a) => ({ ...a, zoneId: z.id })));
        const pickupAreaObj = allAreas.find((a) => a.name === pickupAreaName);
        const dropAreaObj = allAreas.find((a) => a.name === dropAreaName);

        if (!pickupAreaObj || !dropAreaObj) {
          throw new Error('Please select valid zones');
        }

        const res = await fetch('/api/rate-cards/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            actualWeight: weight,
            lengthCm: length,
            widthCm: width,
            heightCm: height,
            orderType,
            pickupZoneId: pickupAreaObj.zoneId,
            dropZoneId: dropAreaObj.zoneId,
            paymentType,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Calculation preview failed');
        setPreview(data);
      } catch (err: any) {
        setPreviewError(err.message || 'Preview rate unavailable');
        setPreview(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    actualWeight,
    lengthCm,
    widthCm,
    heightCm,
    orderType,
    paymentType,
    pickupAreaName,
    dropAreaName,
    zones,
    loading,
  ]);

  const handleCompleteOrder = async (transactionId?: string) => {
    setError('');
    setSubmitting(true);
    setShowPaymentModal(false);

    const weight = parseFloat(actualWeight);
    const length = parseFloat(lengthCm);
    const width = parseFloat(widthCm);
    const height = parseFloat(heightCm);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickupAddress,
          dropAddress,
          pickupAreaName,
          dropAreaName,
          actualWeight: weight,
          lengthCm: length,
          widthCm: width,
          heightCm: height,
          orderType,
          paymentType,
          transactionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to book order');

      router.push('/customer/orders');
    } catch (err: any) {
      setError(err.message || 'Booking failed');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const weight = parseFloat(actualWeight);
    const length = parseFloat(lengthCm);
    const width = parseFloat(widthCm);
    const height = parseFloat(heightCm);

    if (isNaN(weight) || weight <= 0) {
      setError('Weight must be greater than zero');
      return;
    }
    if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      setError('Parcel dimensions must be greater than zero');
      return;
    }

    if (paymentType === 'PREPAID') {
      setPaymentTimer(300);
      setPaymentSimulating(false);
      setShowPaymentModal(true);
    } else {
      await handleCompleteOrder();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
          Ship New Parcel
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Book a new delivery request and calculate rates in real-time</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto"></div>
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white border border-foreground/10 p-6 rounded-2xl text-center text-foreground/40 text-sm">
          No delivery zones are configured in the system. Please check with an administrator.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Route Addresses */}
            <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-lg font-display font-bold text-foreground border-b border-foreground/10 pb-2">1. Origin & Destination</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                    Pickup Area
                  </label>
                  <select
                    value={pickupAreaName}
                    onChange={(e) => setPickupAreaName(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
                  >
                    {zones.flatMap((z) => z.areas).map((area) => (
                      <option key={area.id} value={area.name} className="bg-background">
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                    Drop Area
                  </label>
                  <select
                    value={dropAreaName}
                    onChange={(e) => setDropAreaName(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
                  >
                    {zones.flatMap((z) => z.areas).map((area) => (
                      <option key={area.id} value={area.name} className="bg-background">
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                  Full Pickup Address
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Street, Building name, Apartment number..."
                  className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-foreground font-semibold placeholder-foreground/30"
                />
              </div>

              <div>
                <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                  Full Drop Address
                </label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Recipient house, road, region landmarks..."
                  className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-foreground font-semibold placeholder-foreground/30"
                />
              </div>
            </div>

            {/* Package details */}
            <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-lg font-display font-bold text-foreground border-b border-foreground/10 pb-2">2. Package Specifications</h2>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-foreground/50 text-[10px] font-bold uppercase tracking-wider mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-xs focus:outline-none text-foreground font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                    Order Category
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="B2C" className="bg-background">B2C (Retail Delivery)</option>
                    <option value="B2B" className="bg-background">B2B (Enterprise/Bulk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/50 text-xs font-bold uppercase tracking-wider mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full bg-background border border-foreground/10 rounded-lg px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-accent font-semibold"
                  >
                    <option value="PREPAID" className="bg-background">Prepaid (Paytm/GPay)</option>
                    <option value="COD" className="bg-background">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Preview Summary panel */}
          <div className="space-y-6">
            <div className="bg-white border border-foreground/10 p-6 rounded-2xl shadow-sm space-y-6 sticky top-8">
              <h2 className="text-lg font-display font-bold text-foreground border-b border-foreground/10 pb-2">Live Invoice</h2>
              
              {previewError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg text-center font-medium">
                  {previewError}
                </div>
              )}

              {preview ? (
                <div className="space-y-4 text-sm text-foreground/80">
                  <div className="grid grid-cols-2 gap-y-2.5">
                    <span className="text-foreground/50">Volumetric Weight</span>
                    <span className="text-right text-foreground font-semibold">{preview.volumetricWeight.toFixed(2)} kg</span>
                    
                    <span className="text-foreground/50">Billable Weight</span>
                    <span className="text-right text-foreground font-semibold">{preview.billableWeight.toFixed(2)} kg</span>
                    
                    <span className="text-foreground/50">Zone Type</span>
                    <span className="text-right text-accent font-bold">{preview.zoneType}</span>

                    <span className="text-foreground/50">Base Cost</span>
                    <span className="text-right text-foreground font-bold">₹{preview.baseAmount.toFixed(2)}</span>

                    <span className="text-foreground/50">COD Surcharge</span>
                    <span className="text-right text-foreground font-bold">₹{preview.codSurcharge.toFixed(2)}</span>

                    <div className="col-span-2 border-t border-foreground/5 my-1"></div>

                    <span className="text-base font-bold text-foreground">Total Surcharge</span>
                    <span className="text-right text-base font-black text-accent">₹{preview.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground/30 text-center py-6">
                  Fill in dimensions and locations to calculate your live pricing summary.
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting || !preview}
                className="w-full py-3.5 bg-accent hover:opacity-90 text-background rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {submitting ? 'Booking shipment...' : 'Confirm & Book Shipment'}
              </motion.button>
            </div>
          </div>
        </form>
      )}

      {/* Checkout Transaction Modal */}
      {showPaymentModal && preview && (
        <UPIPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={`ORD-${Date.now().toString().slice(-6)}`}
          amount={preview.finalAmount}
          onPaymentComplete={(txnId, method) => {
            handleCompleteOrder(txnId);
          }}
        />
      )}
    </div>
  );
}
