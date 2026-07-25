'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

import GoogleAuthModal from '../../../components/GoogleAuthModal';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSuccess = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    const role = data.user.role;
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'AGENT') {
      router.push('/agent/orders');
    } else {
      router.push('/customer/orders');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      handleLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectEmail = async (email: string, name: string) => {
    setIsGoogleModalOpen(false);
    setGoogleLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      handleLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="relative min-h-screen flex items-center justify-center bg-[#0B0A0F] text-[#FAF7F2] p-4 overflow-hidden font-sans">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.35, 0.55, 0.35],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#E8622C]/40 to-[#FF8C38]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.25, 0.45, 0.25],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-gradient-to-tl from-[#6366F1]/30 to-[#8B5CF6]/20 rounded-full blur-3xl"
        />
        {/* Subtle Interactive Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Glassmorphic Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-[#161520]/80 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] space-y-7"
      >
        {/* Card Header & Brand Badge */}
        <div className="text-center space-y-2.5">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#E8622C]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8622C] animate-pulse" />
            Dispatchly Logistics
          </motion.div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-white/60 text-xs font-medium">Sign in to manage your shipments, tracking & orders</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl text-center font-medium shadow-xs"
          >
            {error}
          </motion.div>
        )}

        {/* Unique Interactive Google Login Button */}
        <motion.button
          whileHover={{ scale: 1.015, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => setIsGoogleModalOpen(true)}
          disabled={googleLoading || loading}
          className="w-full py-3.5 px-5 bg-white/5 border border-white/15 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-3.5 transition-all shadow-md hover:shadow-lg hover:border-white/30 disabled:opacity-50 group"
        >
          <div className="p-1 bg-white rounded-full shadow-xs group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <span className="tracking-wide">
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </span>
        </motion.button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative z-10 bg-[#161520] px-3.5 text-[10px] uppercase font-bold text-white/40 tracking-widest">
            Or Sign In With Account
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="identifier">
              Email Address or Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@company.com or username"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.015, boxShadow: '0 10px 25px -5px rgba(232, 98, 44, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#E8622C] to-[#FF7A00] hover:from-[#E8622C]/95 hover:to-[#FF7A00]/95 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-[#E8622C]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>{loading ? 'Signing in...' : 'Sign In to Account'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-white/50">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#E8622C] hover:text-[#FF7A00] font-bold underline underline-offset-4 transition-colors">
              Create account here
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Google Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectEmail={handleGoogleSelectEmail}
      />
    </div>
  );
}
