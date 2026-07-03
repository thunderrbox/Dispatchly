'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

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
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] p-4 text-[#1C1C1A] selection:bg-[#E8622C]/20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-[#1C1C1A]/10 p-8 rounded-2xl shadow-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#1C1C1A]">
            Welcome Back
          </h1>
          <p className="text-[#1C1C1A]/60 text-xs font-semibold">Sign in to manage your shipments and deliveries</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[#1C1C1A]/60 text-[10px] font-bold uppercase tracking-wider" htmlFor="password">
                Password
              </label>
            </div>
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

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E8622C] hover:bg-[#E8622C]/90 text-[#FAF7F2] rounded-lg text-sm font-semibold tracking-wide shadow-sm active:scale-[0.98] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-[#1C1C1A]/50">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#E8622C] hover:text-[#E8622C]/90 font-bold underline underline-offset-4">
              Register here
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
