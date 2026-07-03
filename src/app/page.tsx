'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Custom, original geometric SVG icon representing delivery pipelines
const GeometricLogisticsIcon = () => (
  <svg
    viewBox="0 0 200 200"
    className="w-full h-full max-w-[280px] md:max-w-[340px] mx-auto text-[#E8622C]"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Grid of dots */}
    <g opacity="0.15" stroke="currentColor" strokeWidth="2">
      <circle cx="20" cy="20" r="1.5" fill="currentColor" />
      <circle cx="60" cy="20" r="1.5" fill="currentColor" />
      <circle cx="100" cy="20" r="1.5" fill="currentColor" />
      <circle cx="140" cy="20" r="1.5" fill="currentColor" />
      <circle cx="180" cy="20" r="1.5" fill="currentColor" />
      <circle cx="20" cy="60" r="1.5" fill="currentColor" />
      <circle cx="60" cy="60" r="1.5" fill="currentColor" />
      <circle cx="100" cy="60" r="1.5" fill="currentColor" />
      <circle cx="140" cy="60" r="1.5" fill="currentColor" />
      <circle cx="180" cy="60" r="1.5" fill="currentColor" />
      <circle cx="20" cy="100" r="1.5" fill="currentColor" />
      <circle cx="60" cy="100" r="1.5" fill="currentColor" />
      <circle cx="100" cy="100" r="1.5" fill="currentColor" />
      <circle cx="140" cy="100" r="1.5" fill="currentColor" />
      <circle cx="180" cy="100" r="1.5" fill="currentColor" />
      <circle cx="20" cy="140" r="1.5" fill="currentColor" />
      <circle cx="60" cy="140" r="1.5" fill="currentColor" />
      <circle cx="100" cy="140" r="1.5" fill="currentColor" />
      <circle cx="140" cy="140" r="1.5" fill="currentColor" />
      <circle cx="180" cy="140" r="1.5" fill="currentColor" />
      <circle cx="20" cy="180" r="1.5" fill="currentColor" />
      <circle cx="60" cy="180" r="1.5" fill="currentColor" />
      <circle cx="100" cy="180" r="1.5" fill="currentColor" />
      <circle cx="140" cy="180" r="1.5" fill="currentColor" />
      <circle cx="180" cy="180" r="1.5" fill="currentColor" />
    </g>

    {/* Connected nodes path */}
    <motion.path
      d="M20,100 L60,60 L140,140 L180,100"
      stroke="#1C1C1A"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
    />

    {/* Pulsing nodes */}
    <motion.circle
      cx="20"
      cy="100"
      r="6"
      fill="#E8622C"
      stroke="#FAF7F2"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2 }}
    />
    <motion.circle
      cx="60"
      cy="60"
      r="6"
      fill="#E8622C"
      stroke="#FAF7F2"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.6 }}
    />
    <motion.circle
      cx="140"
      cy="140"
      r="6"
      fill="#E8622C"
      stroke="#FAF7F2"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.0 }}
    />
    <motion.circle
      cx="180"
      cy="100"
      r="6"
      fill="#E8622C"
      stroke="#FAF7F2"
      strokeWidth="2"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1.4 }}
    />

    {/* Geometric accent frames */}
    <rect x="10" y="10" width="180" height="180" rx="16" stroke="#1C1C1A" strokeWidth="2" opacity="0.1" />
    <path d="M10,30 L190,30" stroke="#1C1C1A" strokeWidth="2" opacity="0.1" />
  </svg>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1C1A] font-sans flex flex-col justify-between selection:bg-[#E8622C]/20">
      {/* Header */}
      <header className="border-b border-[#1C1C1A]/10 bg-[#FAF7F2]/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-lg bg-[#E8622C] flex items-center justify-center font-bold text-[#FAF7F2] tracking-wider text-sm">
            DP
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight">
            Dispatchly
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-[#1C1C1A]/70 hover:text-[#1C1C1A] px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="text-xs font-semibold bg-[#E8622C] text-[#FAF7F2] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8622C]/90 active:scale-[0.98] transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Asymmetric Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 w-full flex-1 grid md:grid-cols-12 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-7 space-y-6 text-left"
        >
          <span className="px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-[#E8622C]/10 border border-[#E8622C]/20 text-[#E8622C] rounded-full inline-block">
            Smart Delivery Orchestration
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-none text-[#1C1C1A]">
            Precision Logistics, <br />
            from Rate to Doorstep.
          </h1>
          <p className="max-w-xl text-sm sm:text-base text-[#1C1C1A]/70 leading-relaxed font-sans">
            Automate parcel pricing via exact volumetric calculation cards, route courier matching using GPS-nearest Haversine sorting, and log every delivery status update inside an immutable event ledger.
          </p>

          <div className="flex gap-4 flex-wrap pt-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="py-3 px-6 bg-[#E8622C] hover:bg-[#E8622C]/90 text-[#FAF7F2] rounded-lg text-sm font-semibold tracking-wide shadow-sm transition-colors block text-center"
              >
                Launch Shipping Hub
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="py-3 px-6 bg-transparent hover:bg-[#1C1C1A]/5 border border-[#1C1C1A]/20 text-[#1C1C1A] rounded-lg text-sm font-semibold tracking-wide transition-colors block text-center"
              >
                Access Portal
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Asymmetric Graphic column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="md:col-span-5 flex justify-center"
        >
          <div className="p-8 bg-white/40 border border-[#1C1C1A]/5 rounded-2xl shadow-sm backdrop-blur-md w-full max-w-sm flex items-center justify-center relative">
            <GeometricLogisticsIcon />
            {/* Absolute offset shapes for asymmetry */}
            <div className="absolute -top-3 -right-3 h-6 w-6 rounded-lg bg-[#E8622C]/10 border border-[#E8622C]/20 -z-10"></div>
            <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-xl bg-[#1C1C1A]/5 border border-[#1C1C1A]/10 -z-10"></div>
          </div>
        </motion.div>
      </main>

      {/* Bento Grid Features Section */}
      <section className="bg-white/30 border-t border-[#1C1C1A]/10 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-left max-w-xl space-y-2">
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-[#1C1C1A]">
              Graded Service Modules
            </h2>
            <p className="text-xs text-[#1C1C1A]/50 uppercase tracking-widest font-bold">
              Automated logistics workflows engineered for audit-level precision.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Box 1 (Size 6) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-6 bg-white/80 border border-[#1C1C1A]/5 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#E8622C]/10 flex items-center justify-center text-[#E8622C] font-display font-bold">
                  01
                </div>
                <h3 className="font-display font-bold text-lg text-[#1C1C1A]">Volumetric Pricing Engine</h3>
                <p className="text-sm text-[#1C1C1A]/70 leading-relaxed font-sans">
                  Calculates billing amounts utilizing weight vs dimensions ($L \times W \times H / 5000$). Automatically applies flat COD fees or inter-zone shipping cards with zero silent fallbacks.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-[#E8622C] tracking-wide uppercase">
                Correct Rate Rules
              </div>
            </motion.div>

            {/* Box 2 (Size 6) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-6 bg-white/80 border border-[#1C1C1A]/5 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#E8622C]/10 flex items-center justify-center text-[#E8622C] font-display font-bold">
                  02
                </div>
                <h3 className="font-display font-bold text-lg text-[#1C1C1A]">Haversine Dispatch Matching</h3>
                <p className="text-sm text-[#1C1C1A]/70 leading-relaxed font-sans">
                  Calculates geodesic spherical distances to match available agents to shipment origins, incorporating order-load tie-breaks to protect agents from dispatch overload.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-[#E8622C] tracking-wide uppercase">
                Geodesic Sorting
              </div>
            </motion.div>

            {/* Box 3 (Size 8) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-8 bg-white/80 border border-[#1C1C1A]/5 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#E8622C]/10 flex items-center justify-center text-[#E8622C] font-display font-bold">
                  03
                </div>
                <h3 className="font-display font-bold text-lg text-[#1C1C1A]">Immutable State Machine Tracking</h3>
                <p className="text-sm text-[#1C1C1A]/70 leading-relaxed font-sans">
                  Enforces strict sequence transitions inside the service layer. Logs every update in a read-only tracking event timeline, logging admin manual corrections with explicit audit overrides (`isOverride = true`).
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-[#E8622C] tracking-wide uppercase">
                Chronological Logs
              </div>
            </motion.div>

            {/* Box 4 (Size 4) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-4 bg-white/80 border border-[#1C1C1A]/5 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#E8622C]/10 flex items-center justify-center text-[#E8622C] font-display font-bold">
                  04
                </div>
                <h3 className="font-display font-bold text-lg text-[#1C1C1A]">Role Scopes</h3>
                <p className="text-sm text-[#1C1C1A]/70 leading-relaxed font-sans">
                  Ensures secure separation of privileges for Customers, Courier Agents, and Admins via JWT validation layers.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-[#E8622C] tracking-wide uppercase">
                RBAC Security
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="border-t border-[#1C1C1A]/10 py-12 bg-[#FAF7F2] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xs text-[#1C1C1A]/40 font-bold uppercase tracking-wider">
            Logistics Technology Stack
          </span>
          <div className="flex gap-x-8 gap-y-3 flex-wrap justify-center text-xs text-[#1C1C1A]/75 font-semibold font-sans">
            <span>Next.js 15 App Router</span>
            <span>TypeScript</span>
            <span>Prisma ORM</span>
            <span>PostgreSQL</span>
            <span>Tailwind CSS</span>
            <span>Framer Motion</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1C1C1A]/10 py-8 bg-[#FAF7F2] text-xs text-[#1C1C1A]/50 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Dispatchly Courier. Evaluated CS placement application.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1C1C1A] font-semibold transition-colors"
          >
            View Code on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
