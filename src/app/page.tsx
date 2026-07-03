'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Stylized interactive geometric high-visibility Cheetah mascot logo carrying a parcel
export const DispatchlyLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* High contrast background emblem badge (always brand charcoal) */}
    <rect x="5" y="5" width="90" height="90" rx="22" fill="#1C1C1A" />
    
    {/* Running Speed Trails inside the badge (always brand cream) */}
    <motion.path
      d="M18 36H32"
      stroke="#FAF7F2"
      strokeWidth="4"
      strokeLinecap="round"
      animate={{ x: [0, -3, 0], opacity: [0.5, 0.9, 0.5] }}
      transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
    />
    <motion.path
      d="M12 48H32"
      stroke="#FAF7F2"
      strokeWidth="5"
      strokeLinecap="round"
      animate={{ x: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: "easeInOut" }}
    />
    <motion.path
      d="M15 60H28"
      stroke="#FAF7F2"
      strokeWidth="4"
      strokeLinecap="round"
      animate={{ x: [0, -3, 0], opacity: [0.5, 0.9, 0.5] }}
      transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: "easeInOut" }}
    />

    {/* Cheetah Head Silhouette (always brand cream) */}
    <path
      d="M32 54C32 40 46 32 60 32C72 32 82 40 82 52C82 60 76 66 68 68C62 70 56 68 50 64 L32 54Z"
      fill="#FAF7F2"
    />
    
    {/* Cheetah Ear */}
    <path
      d="M50 32L40 18C38 15 44 12 48 15L56 29"
      stroke="#FAF7F2"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Big high-contrast cheetah eye (always brand charcoal) */}
    <circle cx="64" cy="44" r="3.5" fill="#1C1C1A" />

    {/* High contrast orange delivery package (always brand orange and charcoal outlines) */}
    <motion.g
      animate={{ y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      <rect x="62" y="52" width="24" height="24" rx="5" fill="#E8622C" stroke="#1C1C1A" strokeWidth="2.5" />
      <path d="M62 60H86" stroke="#FAF7F2" strokeWidth="2" />
      <path d="M74 60V76" stroke="#FAF7F2" strokeWidth="2" />
    </motion.g>
  </svg>
);

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dispatchly-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('dispatchly-theme', newTheme);
  };

  const isDark = theme === 'dark';
  
  // Design system theme style injector
  const themeStyle = isDark
    ? {
        '--background': '#121210',
        '--foreground': '#F5F2EB',
        '--accent': '#F0713B',
        '--sidebar-background': '#1D1D1A',
      } as React.CSSProperties
    : {
        '--background': '#FAF7F2',
        '--foreground': '#1C1C1A',
        '--accent': '#E8622C',
        '--sidebar-background': '#F4EFE6',
      } as React.CSSProperties;

  return (
    <div
      style={themeStyle}
      className="min-h-screen bg-background text-foreground font-sans flex flex-col justify-between selection:bg-accent/25 transition-colors duration-300"
    >
      {/* Header */}
      <header className="border-b border-foreground/10 bg-background/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="text-accent">
            <DispatchlyLogo className="h-9 w-9" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">
            Dispatchly
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 text-foreground/80 hover:text-foreground transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              // Sun icon
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              // Moon icon
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </motion.button>

          <Link
            href="/login"
            className="text-xs font-bold text-foreground/75 hover:text-foreground px-3 py-2 transition-colors"
          >
            Sign In
          </Link>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/register"
              className="text-xs font-bold bg-accent text-background px-4 py-2.5 rounded-lg shadow-sm hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Asymmetric Hero Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24 w-full flex-1 grid md:grid-cols-12 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="md:col-span-7 space-y-6 text-left"
        >
          <span className="px-3.5 py-1 text-[10px] font-bold tracking-wider uppercase bg-accent/10 border border-accent/20 text-accent rounded-full inline-block">
            Smart Delivery Orchestration
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-none text-foreground">
            Precision Logistics, <br />
            from Rate to Doorstep.
          </h1>
          <p className="max-w-xl text-sm sm:text-base text-foreground/70 leading-relaxed font-sans font-medium">
            Automate parcel pricing via exact volumetric calculation cards, route courier matching using GPS-nearest Haversine sorting, and log every delivery status update inside an immutable event ledger.
          </p>

          <div className="flex gap-4 flex-wrap pt-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/register"
                className="py-3 px-6 bg-accent hover:opacity-95 text-background rounded-lg text-sm font-bold tracking-wide shadow-sm transition-opacity block text-center"
              >
                Launch Shipping Hub
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/login"
                className="py-3 px-6 bg-transparent hover:bg-foreground/5 border border-foreground/20 text-foreground rounded-lg text-sm font-bold tracking-wide transition-colors block text-center"
              >
                Access Portal
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Image illustration column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="md:col-span-5 flex justify-center"
        >
          <div className="p-4 bg-foreground/5 border border-foreground/10 rounded-2xl shadow-sm backdrop-blur-md w-full max-w-md flex items-center justify-center relative group overflow-hidden">
            {/* Real generated vector image served from public directory */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dispatchly_hero.jpg"
              alt="Dispatchly logistics illustration"
              className="w-full h-auto rounded-xl object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 border border-foreground/10"
            />
            
            {/* Asymmetrical decorative background shapes */}
            <div className="absolute -top-3 -right-3 h-8 w-8 rounded-lg bg-accent/10 border border-accent/20 -z-10"></div>
            <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-xl bg-foreground/5 border border-foreground/10 -z-10"></div>
          </div>
        </motion.div>
      </main>

      {/* Bento Grid Features Section */}
      <section className="bg-foreground/[0.02] border-t border-foreground/10 py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-left max-w-xl space-y-2">
            <h2 className="text-3xl font-display font-extrabold tracking-tight text-foreground">
              Graded Service Modules
            </h2>
            <p className="text-xs text-foreground/50 uppercase tracking-widest font-bold">
              Automated logistics workflows engineered for audit-level precision.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Box 1 (Size 6) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-6 bg-background border border-foreground/10 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold">
                  01
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Volumetric Pricing Engine</h3>
                <p className="text-sm text-foreground/75 leading-relaxed font-sans font-medium">
                  Calculates billing amounts utilizing weight vs dimensions ($L \times W \times H / 5000$). Automatically applies flat COD fees or inter-zone shipping cards with zero silent fallbacks.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-accent tracking-wide uppercase">
                Correct Rate Rules
              </div>
            </motion.div>

            {/* Box 2 (Size 6) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-6 bg-background border border-foreground/10 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold">
                  02
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Haversine Dispatch Matching</h3>
                <p className="text-sm text-foreground/75 leading-relaxed font-sans font-medium">
                  Calculates geodesic spherical distances to match available agents to shipment origins, incorporating order-load tie-breaks to protect agents from dispatch overload.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-accent tracking-wide uppercase">
                Geodesic Sorting
              </div>
            </motion.div>

            {/* Box 3 (Size 8) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-8 bg-background border border-foreground/10 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold">
                  03
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Immutable State Machine Tracking</h3>
                <p className="text-sm text-foreground/75 leading-relaxed font-sans font-medium">
                  Enforces strict sequence transitions inside the service layer. Logs every update in a read-only tracking event timeline, logging admin manual corrections with explicit audit overrides (`isOverride = true`).
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-accent tracking-wide uppercase">
                Chronological Logs
              </div>
            </motion.div>

            {/* Box 4 (Size 4) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="md:col-span-4 bg-background border border-foreground/10 p-8 rounded-2xl shadow-sm flex flex-col justify-between space-y-8"
            >
              <div className="space-y-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-display font-bold">
                  04
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Role Scopes</h3>
                <p className="text-sm text-foreground/75 leading-relaxed font-sans font-medium">
                  Ensures secure separation of privileges for Customers, Courier Agents, and Admins via JWT validation layers.
                </p>
              </div>
              <div className="pt-2 text-xs font-semibold text-accent tracking-wide uppercase">
                RBAC Security
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Tech Stack Strip */}
      <section className="border-t border-foreground/10 py-12 bg-background px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xs text-foreground/40 font-bold uppercase tracking-wider">
            Logistics Technology Stack
          </span>
          <div className="flex gap-x-8 gap-y-3 flex-wrap justify-center text-xs text-foreground/75 font-semibold font-sans">
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
      <footer className="border-t border-foreground/10 py-10 bg-background text-xs text-foreground/50 px-6 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <p className="font-semibold text-foreground/80">
              Designed & Developed by <span className="text-[#E8622C] font-bold">Abhijeet Singh Rana</span>
            </p>
            <p className="text-[10px] text-foreground/40 font-medium">
              Architected for last-mile logistics dispatch and auto-assignment evaluations • Build v1.0.0
            </p>
          </div>
          <div className="flex gap-6 items-center flex-wrap justify-center text-[10px] font-bold uppercase tracking-wider text-foreground/60">
            <span>© 2026 Dispatchly Courier</span>
            <span>•</span>
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              MIT License
            </a>
            <span>•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              View GitHub Codebase
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
