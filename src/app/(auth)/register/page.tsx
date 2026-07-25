'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
    <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4 text-[#1C1C1A] selection:bg-[#E8622C]/20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-[#1C1C1A]/10 p-8 rounded-2xl shadow-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#1C1C1A]">
            Create Account
          </h1>
          <p className="text-[#1C1C1A]/60 text-xs font-semibold">Join Dispatchly Delivery to track and manage shipments</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsGoogleModalOpen(true)}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 bg-white hover:bg-[#FAF7F2] border border-[#1C1C1A]/15 text-[#1C1C1A] rounded-lg text-sm font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
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
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1C1C1A]/10 w-full" />
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#1C1C1A]/40 tracking-wider">Or</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-[#FAF7F2]/50 border border-[#1C1C1A]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#E8622C] transition-colors placeholder-[#1C1C1A]/30 font-sans"
            />
          </div>

          <div>
            <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe_99"
              className="w-full bg-[#FAF7F2]/50 border border-[#1C1C1A]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#E8622C] transition-colors placeholder-[#1C1C1A]/30 font-sans"
            />
          </div>

          <div>
            <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#FAF7F2]/50 border border-[#1C1C1A]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#E8622C] transition-colors placeholder-[#1C1C1A]/30 font-sans"
            />
          </div>

          <div>
            <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF7F2]/50 border border-[#1C1C1A]/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#E8622C] transition-colors placeholder-[#1C1C1A]/30 font-sans"
            />
          </div>

          <div>
            <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('CUSTOMER')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  role === 'CUSTOMER'
                    ? 'bg-[#E8622C] border-[#E8622C] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2]/50 border-[#1C1C1A]/10 text-[#1C1C1A]/60 hover:border-[#1C1C1A]/30'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('AGENT')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  role === 'AGENT'
                    ? 'bg-[#E8622C] border-[#E8622C] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2]/50 border-[#1C1C1A]/10 text-[#1C1C1A]/60 hover:border-[#1C1C1A]/30'
                }`}
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-[#E8622C] border-[#E8622C] text-[#FAF7F2]'
                    : 'bg-[#FAF7F2]/50 border-[#1C1C1A]/10 text-[#1C1C1A]/60 hover:border-[#1C1C1A]/30'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {role === 'ADMIN' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2"
            >
              <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Admin Security Verification Required
              </div>
              <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider mb-1" htmlFor="adminSecret">
                Admin Passcode / Security Secret Key
              </label>
              <input
                id="adminSecret"
                type="password"
                required={role === 'ADMIN'}
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
                placeholder="Enter system admin secret key"
                className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#E8622C]"
              />
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E8622C] hover:bg-[#E8622C]/90 text-[#FAF7F2] rounded-lg text-sm font-semibold tracking-wide shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </motion.button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#1C1C1A]/50">
            Already have an account?{' '}
            <Link href="/login" className="text-[#E8622C] hover:text-[#E8622C]/90 font-bold underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </motion.div>

      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectEmail={handleGoogleSelectEmail}
      />
    </div>
  );
}
