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
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    },
    {
      name: 'Abhijeet Singh',
      email: 'abhijeetsingh7168768@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user2=s96-c',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 text-gray-800"
        >
          {/* Google Modal Header */}
          <div className="p-6 text-center border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-center mb-3">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
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
            <h3 className="text-lg font-bold text-gray-900">Choose an account</h3>
            <p className="text-xs text-gray-500 mt-1">to continue to <span className="font-semibold text-gray-800">Dispatchly</span></p>
          </div>

          {/* Account Chooser List */}
          <div className="p-4 space-y-2">
            {!showCustomInput ? (
              <>
                {defaultAccounts.map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectEmail(acc.email, acc.name)}
                    className="w-full flex items-center gap-3.5 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left border border-transparent hover:border-gray-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {acc.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{acc.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-3.5 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left border border-dashed border-gray-200 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                    +
                  </div>
                  Use another Google Account
                </button>
              </>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 p-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(false)}
                    className="flex-1 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 px-6">
            <span>To continue, Google will share your name and email with Dispatchly.</span>
            <button type="button" onClick={onClose} className="text-gray-600 hover:underline font-medium">
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
