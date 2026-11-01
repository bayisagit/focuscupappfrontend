'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Calendar, MapPin, Clock, Filter, ChevronRight, Shield } from 'lucide-react';

export default function FixturesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, bRes] = await Promise.all([
          api.matches.list(),
          api.competitions.getBatches(),
        ]);
        setMatches(mRes.results || mRes || []);
        setBatches(bRes.results || bRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredMatches = matches.filter((m) => {
    if (selectedBatch) {
      if (m.home_team?.batch_code !== selectedBatch && m.away_team?.batch_code !== selectedBatch) {
        return false;
      }
    }
    if (selectedStatus) {
      if (m.status !== selectedStatus) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Page Header */}
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8 text-emerald-400" />
              TOURNAMENT FIXTURES
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Official schedule for AASTU Focus Football Cup single round-robin fixtures
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1C2541] px-3 py-1.5 rounded-xl border border-[#2C3960]">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              >
                <option value="" className="bg-[#1C2541]">All Batches</option>
                {batches.filter((b) => b.is_competing).map((b) => (
                  <option key={b.batch_code} value={b.batch_code} className="bg-[#1C2541]">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#1C2541] px-3 py-1.5 rounded-xl border border-[#2C3960]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none"
              >
                <option value="" className="bg-[#1C2541]">All Statuses</option>
                <option value="SCHEDULED" className="bg-[#1C2541]">Scheduled</option>
                <option value="LIVE" className="bg-[#1C2541]">Live</option>
                <option value="COMPLETED" className="bg-[#1C2541]">Completed</option>
                <option value="POSTPONED" className="bg-[#1C2541]">Postponed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#1C2541]/40 animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const isCompleted = match.status === 'COMPLETED';
            const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';

            return (
              <div
                key={match.id}
                className="card-gloss p-5 sm:p-6 rounded-2xl shadow-xl transition-all hover:border-emerald-500/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C3960]/60 pb-3 mb-4">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <span className="font-bold text-white uppercase text-[11px] bg-slate-800 px-2 py-0.5 rounded">
                      Round {match.round_number}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {match.match_date}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {match.kick_off_time?.slice(0, 5) || '16:00'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        LIVE MATCH
                      </span>
                    ) : isCompleted ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Full Time
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {match.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Matchup */}
                <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 py-2">
                  {/* Home Team */}
                  <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-3 text-left md:text-right">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {match.home_team.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {match.home_team.nickname || match.home_team.batch_code.replace('_', ' ')}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0"
                      style={{ backgroundColor: match.home_team.color_hex || '#10B981' }}
                    >
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Score or VS */}
                  <div className="md:col-span-1 text-center py-2 md:py-0">
                    {isCompleted || isLive ? (
                      <div className="inline-block px-4 py-1.5 rounded-xl bg-[#0B132B] border border-emerald-500/40 text-emerald-400 font-black text-xl">
                        {match.home_score} - {match.away_score}
                      </div>
                    ) : (
                      <div className="inline-block px-3 py-1 rounded-lg bg-[#2C3960] text-slate-300 font-extrabold text-xs">
                        VS
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="md:col-span-3 flex items-center justify-start gap-3 text-left">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0"
                      style={{ backgroundColor: match.away_team.color_hex || '#3B82F6' }}
                    >
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {match.away_team.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {match.away_team.nickname || match.away_team.batch_code.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="mt-4 pt-3 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {match.venue}
                  </span>
                  <Link
                    href={`/matches/${match.id}`}
                    className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Match Center &amp; Timeline <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 card-gloss rounded-2xl">
          <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No fixtures found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your filters or check back once the season schedule is published.
          </p>
        </div>
      )}
    </div>
  );
}
