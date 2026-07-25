'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmail: (email: string, name: string) => void;
}

export default function GoogleAuthModal({ isOpen, onClose, onSelectEmail }: GoogleAuthModalProps) {
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Abhijeet Singh Rana',
      email: 'abhijeet.s.r.cse@gmail.com',
      avatar: 'A',
    },
    {
      name: 'Abhijeet Singh',
      email: 'abhijeetsingh7168768@gmail.com',
      avatar: 'A',
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    onSelectEmail(customEmail, name);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm bg-[#1E1F22] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10 text-white font-sans"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/10 bg-[#1E1F22]">
            <div className="flex items-center gap-2 mb-4">
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
              <span className="text-xs font-semibold text-white/80">Sign in with Google</span>
            </div>
            <h3 className="text-2xl font-normal text-white tracking-tight">Choose an account</h3>
            <p className="text-xs text-white/60 mt-1">to continue to <span className="text-blue-400 font-medium">dispatchly.vercel.app</span></p>
          </div>

          {/* Account List */}
          <div className="p-4 space-y-1 bg-[#1E1F22]">
            {!showCustomInput ? (
              <>
                {defaultAccounts.map((acc, i) => (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                    whileTap={{ scale: 0.98 }}
                    key={i}
                    type="button"
                    onClick={() => onSelectEmail(acc.email, acc.name)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl text-left border border-transparent transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                      {acc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{acc.name}</p>
                      <p className="text-[11px] text-white/60 truncate">{acc.email}</p>
                    </div>
                  </motion.button>
                ))}

                <div className="border-t border-white/10 my-2" />

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl text-left border border-transparent text-xs font-medium text-white/90 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm text-white flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span>Use another account</span>
                </motion.button>
              </>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 p-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-white/60 mb-1.5">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-400 font-sans"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="flex-1 py-2 text-xs font-semibold text-white/70 border border-white/15 rounded-lg hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-sm"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#18191B] border-t border-white/10 flex justify-between items-center text-[10px] text-white/40">
            <span>Before using this app, review Dispatchly&apos;s Terms & Privacy.</span>
            <button type="button" onClick={onClose} className="text-white/70 hover:text-white font-medium ml-2 flex-shrink-0">
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
