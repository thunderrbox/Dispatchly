'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ShieldCheck, ArrowRight, Sparkles, KeyRound, AtSign } from 'lucide-react';

import GoogleAuthModal from '../../../components/GoogleAuthModal';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'AGENT' | 'ADMIN'>('CUSTOMER');
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSuccess = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (data.user.role === 'AGENT') {
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          role,
          ...(role === 'ADMIN' ? { adminSecretKey } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      handleRegisterSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectEmail = async (selectedEmail: string, selectedName: string) => {
    setIsGoogleModalOpen(false);
    setGoogleLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          name: selectedName,
          role,
          ...(role === 'ADMIN' ? { adminSecretKey } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      handleRegisterSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="relative min-h-screen flex items-center justify-center bg-[#0B0A0F] text-[#FAF7F2] p-4 py-8 overflow-hidden font-sans">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.55, 0.3],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[32rem] h-[32rem] bg-gradient-to-br from-[#E8622C]/40 to-[#FF8C38]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-40 -left-40 w-[34rem] h-[34rem] bg-gradient-to-tr from-[#6366F1]/30 to-[#8B5CF6]/20 rounded-full blur-3xl"
        />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Main Glassmorphic Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-[#161520]/80 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] space-y-6"
      >
        {/* Card Header & Brand Badge */}
        <div className="text-center space-y-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#E8622C]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E8622C] animate-pulse" />
            Dispatchly Platform Access
          </motion.div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-white">
            Create Account
          </h1>
          <p className="text-white/60 text-xs font-medium">Join Dispatchly to track, dispatch, and manage logistics</p>
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

        {/* Google Register Button */}
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
            {googleLoading ? 'Connecting to Google...' : 'Sign up with Google'}
          </span>
        </motion.button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative z-10 bg-[#161520] px-4 py-1 rounded-full border border-white/10 text-[10px] uppercase font-bold text-white/50 tracking-widest text-center whitespace-nowrap">
            Or Fill Registration Details
          </span>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1.5" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe_99"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1.5" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/30 transition-all placeholder-white/30 font-sans"
              />
            </div>
          </div>

          {/* Interactive Role Selector */}
          <div>
            <label className="block text-white/70 text-[10px] font-bold uppercase tracking-wider mb-2">
              Select Account Role
            </label>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'CUSTOMER'
                    ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('AGENT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'AGENT'
                    ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  role === 'ADMIN'
                    ? 'bg-[#E8622C] text-white shadow-md shadow-[#E8622C]/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Admin Security Passcode Section */}
          {role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2.5"
            >
              <div className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Admin Security Passcode Verification
              </div>
              <p className="text-[11px] text-amber-200/70 leading-relaxed">
                Creating an Admin account requires system authorization key verification.
              </p>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input
                  id="adminSecret"
                  type="password"
                  required={role === 'ADMIN'}
                  value={adminSecretKey}
                  onChange={(e) => setAdminSecretKey(e.target.value)}
                  placeholder="Enter system admin passcode"
                  className="w-full bg-black/40 border border-amber-500/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#E8622C]"
                />
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.015, boxShadow: '0 10px 25px -5px rgba(232, 98, 44, 0.4)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-[#E8622C] to-[#FF7A00] hover:from-[#E8622C]/95 hover:to-[#FF7A00]/95 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-[#E8622C]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Sign Up'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </motion.button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-1">
          <p className="text-xs text-white/50">
            Already have an account?{' '}
            <Link href="/login" className="text-[#E8622C] hover:text-[#FF7A00] font-bold underline underline-offset-4 transition-colors">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectEmail={handleGoogleSelectEmail}
      />
    </div>
  );
}
