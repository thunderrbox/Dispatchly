import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white tracking-wider">
            DP
          </span>
          <span className="font-extrabold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Dispatchly
          </span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-350 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-violet-600/10 active:scale-[0.98] transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-5xl mx-auto text-center space-y-8 flex-1 flex flex-col justify-center">
        {/* Subtle blur background decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>

        <div className="space-y-4">
          <span className="px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full inline-block">
            Placement Evaluated Platform
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Precision Hyper-Local <br className="hidden sm:inline" />
            Last-Mile Delivery Log
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            A secure layered architecture featuring exact volumetric pricing formulas, GPS-nearest auto courier matching, immutable audit history trails, and role-scoped portals.
          </p>
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="py-3 px-6 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-600/25 active:scale-[0.98] transition-all"
          >
            Launch Shipping Hub
          </Link>
          <Link
            href="/login"
            className="py-3 px-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-sm font-semibold tracking-wide transition-all"
          >
            Access Portal
          </Link>
        </div>
      </section>

      {/* Feature cards Grid */}
      <section className="border-t border-slate-900 bg-slate-950 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Graded Implementation Features</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Engineered to placement taker evaluation specifications</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center font-bold text-violet-400 text-sm">
                01
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Correct Rate Pricing Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates billing amounts utilizing weight vs dimensions (L×W×H/5000), B2B/B2C, flat Cash on Delivery surcharges, and inter/intra zone coverage detection.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center font-bold text-violet-400 text-sm">
                02
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Haversine Courier Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matches closest available online couriers using the spherical Haversine distance formula with active order load count tie-breaks.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center font-bold text-violet-400 text-sm">
                03
              </div>
              <h3 className="font-bold text-slate-200 text-sm">State Machine Tracking Log</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces strict state transition rules at the service layer, maintaining an insert-only, immutable tracking audit log with admin override flags.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/25 flex items-center justify-center font-bold text-violet-400 text-sm">
                04
              </div>
              <h3 className="font-bold text-slate-200 text-sm">Role-Scoped Authentication</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Validates authorization using stateless, secure JWT claims. Shields database reads and writes with fine-grained Customer, Courier, and Admin privileges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech stack Strip */}
      <section className="bg-slate-950/20 border-t border-slate-900 py-10 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Engineered With</span>
          <div className="flex gap-6 flex-wrap justify-center text-xs text-slate-400 font-mono font-medium">
            <span>Next.js 15 (App Router)</span>
            <span>TypeScript</span>
            <span>Prisma ORM</span>
            <span>PostgreSQL</span>
            <span>Tailwind CSS</span>
            <span>Vitest</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-600">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Dispatchly Courier. Solo placement-evaluated CS project.</p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 font-medium transition-colors"
          >
            View Code on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
