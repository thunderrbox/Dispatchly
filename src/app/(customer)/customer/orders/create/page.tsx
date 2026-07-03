'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  const fetchZones = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/zones', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load regions');
      setZones(data);

      // Default the area names if areas exist
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

        // Resolve pickup and drop zone IDs from selected areas
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
    }, 400); // Debounce API calls

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const weight = parseFloat(actualWeight);
    const length = parseFloat(lengthCm);
    const width = parseFloat(widthCm);
    const height = parseFloat(heightCm);

    if (isNaN(weight) || weight <= 0) {
      setError('Weight must be greater than zero');
      setSubmitting(false);
      return;
    }
    if (isNaN(length) || length <= 0 || isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
      setError('Parcel dimensions must be greater than zero');
      setSubmitting(false);
      return;
    }

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Ship New Parcel
        </h1>
        <p className="text-slate-400 text-sm mt-1">Book a new delivery request and calculate rates in real-time</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-xl font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mx-auto"></div>
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-sm">
          No delivery zones are configured in the system. Please check with an administrator.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-8">
          {/* Main Form Fields */}
          <div className="md:col-span-2 space-y-6">
            {/* Route Addresses */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">1. Origin & Destination</h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Pickup Area
                  </label>
                  <select
                    value={pickupAreaName}
                    onChange={(e) => setPickupAreaName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
                  >
                    {zones.flatMap((z) => z.areas).map((area) => (
                      <option key={area.id} value={area.name} className="bg-slate-900">
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Drop Area
                  </label>
                  <select
                    value={dropAreaName}
                    onChange={(e) => setDropAreaName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
                  >
                    {zones.flatMap((z) => z.areas).map((area) => (
                      <option key={area.id} value={area.name} className="bg-slate-900">
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Full Pickup Address
                </label>
                <input
                  type="text"
                  required
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Street, Building name, Apartment number..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Full Drop Address
                </label>
                <input
                  type="text"
                  required
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  placeholder="Street, Building name, Apartment number..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-600 text-white"
                />
              </div>
            </div>

            {/* Parcel Details */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">2. Package Specifications</h2>
              
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={actualWeight}
                    onChange={(e) => setActualWeight(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    required
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Order Category
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as any)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
                  >
                    <option value="B2C" className="bg-slate-900">B2C (Retail Delivery)</option>
                    <option value="B2B" className="bg-slate-900">B2B (Enterprise/Bulk)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
                  >
                    <option value="PREPAID" className="bg-slate-900">Prepaid</option>
                    <option value="COD" className="bg-slate-900">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Preview Summary panel */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl space-y-6 sticky top-8">
              <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-2">Live Invoice</h2>
              
              {previewError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs p-3 rounded-lg text-center font-medium">
                  {previewError}
                </div>
              )}

              {preview ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-y-2.5">
                    <span className="text-slate-400">Volumetric Weight</span>
                    <span className="text-right text-slate-200 font-semibold">{preview.volumetricWeight.toFixed(2)} kg</span>
                    
                    <span className="text-slate-400">Billable Weight</span>
                    <span className="text-right text-slate-200 font-semibold">{preview.billableWeight.toFixed(2)} kg</span>
                    
                    <span className="text-slate-400">Zone Type</span>
                    <span className="text-right text-violet-400 font-semibold">{preview.zoneType}</span>

                    <span className="text-slate-400">Base Cost</span>
                    <span className="text-right text-slate-250">₹{preview.baseAmount.toFixed(2)}</span>

                    <span className="text-slate-400">COD Surcharge</span>
                    <span className="text-right text-slate-250">₹{preview.codSurcharge.toFixed(2)}</span>

                    <div className="col-span-2 border-t border-slate-800 my-1"></div>

                    <span className="text-base font-bold text-slate-200">Total Surcharge</span>
                    <span className="text-right text-base font-bold text-violet-400">₹{preview.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  Fill in dimensions and locations to calculate your live pricing summary.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !preview}
                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? 'Booking shipment...' : 'Confirm & Book Shipment'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
