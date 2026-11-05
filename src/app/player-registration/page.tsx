'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trophy, GraduationCap, AlertCircle, CheckCircle, ArrowLeft, Shirt, Sparkles, Hash } from 'lucide-react';
import Spinner from '@/components/Spinner';

export default function PlayerRegistrationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [preferredPosition, setPreferredPosition] = useState(user?.profile?.primary_position || 'Midfielder');
  const [jerseyNumber, setJerseyNumber] = useState<number | string>(user?.profile?.preferred_jersey_number || 10);
  const [footballNotes, setFootballNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Batch jersey availability state
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [takenDetails, setTakenDetails] = useState<any[]>([]);
  const [batchName, setBatchName] = useState<string>('');
  const [fetchingJerseys, setFetchingJerseys] = useState(false);

  // Fetch taken jerseys for member's competing batch
  useEffect(() => {
    const batchCode = user?.profile?.competing_batch;
    if (batchCode) {
      setFetchingJerseys(true);
      api.members.getBatchJerseys(batchCode)
        .then((data) => {
          if (data?.taken_numbers) {
            setTakenNumbers(data.taken_numbers);
          }
          if (data?.taken_details) {
            setTakenDetails(data.taken_details);
          }
          if (data?.batch_name) {
            setBatchName(data.batch_name);
          }
        })
        .catch((err) => {
          console.warn('Could not load batch jersey numbers:', err);
        })
        .finally(() => {
          setFetchingJerseys(false);
        });
    }
  }, [user?.profile?.competing_batch]);

  const numVal = Number(jerseyNumber);
  const isNumberValid = !isNaN(numVal) && numVal >= 1 && numVal <= 99;

  // Check if chosen jersey is already taken in this batch
  const takenInfo = useMemo(() => {
    if (!isNumberValid) return null;
    return takenDetails.find((d: any) => d.jersey_number === numVal && !d.is_current_user) || null;
  }, [numVal, takenDetails, isNumberValid]);

  const isTaken = Boolean(takenInfo || (isNumberValid && takenNumbers.includes(numVal)));

  // Find next available jersey number recommendation
  const nextAvailableJersey = useMemo(() => {
    for (let i = 1; i <= 99; i++) {
      if (!takenNumbers.includes(i)) {
        return i;
      }
    }
    return 10;
  }, [takenNumbers]);

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
    if (isTaken) {
      setError(`Jersey number #${numVal} is already taken in ${batchName || 'your batch'}. Please choose another number.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.members.applyPlayer({
        preferred_position: preferredPosition,
        jersey_number: numVal,
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

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-emerald-400" />
                Squad Jersey Number (1 - 99)
              </label>
              {isTaken && (
                <button
                  type="button"
                  onClick={() => setJerseyNumber(nextAvailableJersey)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Suggest free: #{nextAvailableJersey}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="99"
                value={jerseyNumber}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  setJerseyNumber(val);
                  if (error) setError(null);
                }}
                placeholder="e.g. 10"
                className={`w-full bg-[#161D36] border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors ${
                  isTaken
                    ? 'border-rose-500 focus:border-rose-400'
                    : isNumberValid
                    ? 'border-emerald-500/50 focus:border-emerald-400'
                    : 'border-[#2C3960]'
                }`}
                required
              />
              <div className="absolute right-3 top-2.5 pointer-events-none">
                {isTaken ? (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                    TAKEN
                  </span>
                ) : isNumberValid ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    AVAILABLE
                  </span>
                ) : null}
              </div>
            </div>

            {/* In-batch Uniqueness Feedback */}
            {isTaken && (
              <div className="mt-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-rose-200">
                    This jersey number (#{numVal}) is already taken in {batchName || 'your batch'}.
                  </p>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    {takenInfo ? (
                      <>
                        Reserved by <span className="font-semibold text-white">{takenInfo.member_name}</span> ({takenInfo.status === 'APPROVED' ? 'Approved Squad Player' : 'Pending Review'}).
                      </>
                    ) : (
                      'Another player in your batch is already registered with this number.'
                    )}
                    {' '}Please choose another number for your squad jersey.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setJerseyNumber(nextAvailableJersey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      Pick next free jersey: #{nextAvailableJersey}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isTaken && isNumberValid && (
              <p className="mt-1.5 text-[11px] text-emerald-400/90 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                Jersey #{numVal} is available for {batchName || 'your batch'}!
              </p>
            )}

            {/* List of currently taken numbers for transparency */}
            {takenNumbers.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#2C3960]/50">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Numbers already taken in {batchName || 'your batch'} squad:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {takenDetails.map((t: any) => (
                    <span
                      key={t.jersey_number}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        t.jersey_number === numVal
                          ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                          : 'bg-slate-800/70 border-slate-700 text-slate-300'
                      }`}
                      title={`${t.member_name} (${t.status}) - ${t.position}`}
                    >
                      #{t.jersey_number}
                      <span className="text-[9px] font-normal text-slate-400">
                        {t.member_name?.split(' ')[0]}
                      </span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  * Note: Different batches can use the same jersey number, but each batch squad must have unique numbers.
                </p>
              </div>
            )}
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
            disabled={loading || isTaken || !isNumberValid}
            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg transition-all mt-4 flex items-center justify-center gap-2 ${
              isTaken
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20 hover:scale-[1.01] cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <Spinner size="xs" color="slate" />
                <span>Submitting Application...</span>
              </>
            ) : isTaken ? (
              `Jersey #${numVal} Is Taken — Choose Another Number`
            ) : (
              'Submit Player Application'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
