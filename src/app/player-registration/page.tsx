'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trophy, GraduationCap, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function PlayerRegistrationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [preferredPosition, setPreferredPosition] = useState(user?.profile?.primary_position || 'Midfielder');
  const [jerseyNumber, setJerseyNumber] = useState(user?.profile?.preferred_jersey_number || 10);
  const [footballNotes, setFootballNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10">
        <h2 className="text-lg font-bold text-white mb-2">Sign In Required</h2>
        <p className="text-xs text-slate-400 mb-6">You must be logged in to apply for the tournament roster.</p>
        <Link href="/login" className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
          Sign In
        </Link>
      </div>
    );
  }

  if (!user.profile?.is_football_eligible) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10 space-y-4">
        <GraduationCap className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Competition Eligibility Notice</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Based on your academic profile ({user.profile?.batch || 'Community Member'}), you are registered as a community fellowship member.
          1st-year students and members outside the 4 eligible batch years do not participate in official competition matches.
        </p>
        <p className="text-xs text-emerald-400 font-semibold italic">
          &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
        </p>
        <div className="pt-2">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs">
            Back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.members.applyPlayer({
        preferred_position: preferredPosition,
        jersey_number: Number(jerseyNumber),
        football_notes: footballNotes,
      });
      setSuccess(res.message);
      await refreshUser();
      setTimeout(() => {
        router.push(`/batches/${user.profile?.competing_batch}`);
      }, 1500);
    } catch (err: any) {
      setError(err.data?.error || 'Failed to submit registration application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-6">
        <Link href={`/members/${user.username}`} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>
      </div>

      <div className="card-gloss p-8 rounded-3xl border border-[#2C3960] shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Register for {user.profile?.batch} Football Squad
          </h1>
          <p className="text-xs text-slate-400">
            Submit your application to represent your academic batch in the Focus Football Cup
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Position</label>
            <select
              value={preferredPosition}
              onChange={(e) => setPreferredPosition(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              required
            >
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Centre Back">Centre Back</option>
              <option value="Full Back">Full Back</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Attacking Midfielder">Attacking Midfielder</option>
              <option value="Winger">Winger</option>
              <option value="Forward">Forward</option>
              <option value="Striker">Striker</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Squad Jersey Number</label>
            <input
              type="number"
              min="1"
              max="99"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(Number(e.target.value))}
              placeholder="e.g. 10"
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Football Experience or Notes</label>
            <textarea
              rows={3}
              value={footballNotes}
              onChange={(e) => setFootballNotes(e.target.value)}
              placeholder="Any past tournament experience or preferred roles..."
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] mt-4"
          >
            {loading ? 'Submitting Application...' : 'Submit Player Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
