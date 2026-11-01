'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, User, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ManagerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('focuscup2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login({ username, password });
      if (!user.is_manager) {
        setError('Access denied: Your account does not have tournament management privileges.');
        return;
      }
      router.push('/manager/dashboard');
    } catch (err: any) {
      setError(
        err.data?.detail ||
        err.data?.error ||
        'Authentication failed. Please verify management credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card-gloss max-w-md w-full p-8 rounded-3xl border border-purple-500/40 shadow-2xl relative">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20 border-2 border-purple-400/30 overflow-hidden">
            <Image
              src="/logo.png"
              alt="AASTU Focus Logo"
              width={56}
              height={56}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Manager Administration Portal
          </h1>
          <p className="text-xs text-slate-400">
            Restricted access for AASTU Focus Football Cup directors
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Manager Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Manager username"
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Manager password"
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Verifying...' : 'Access Management Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#2C3960]/60 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Ordinary members cannot register as managers.
        </div>
      </div>
    </div>
  );
}
