'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { apiCache } from '@/lib/cache';
import {
  Trophy,
  Flame,
  Star,
  Award,
  Users,
  Shield,
  Heart,
  Sparkles,
  Check,
  ChevronDown,
  Filter,
} from 'lucide-react';
import Spinner from '@/components/Spinner';

export default function StatisticsPage() {
  const cachedScorers = apiCache.get<any>('/api/v1/statistics/top-scorers/?limit=20');
  const cachedAssists = apiCache.get<any>('/api/v1/statistics/top-assists/?limit=20');
  const cachedFollowed = apiCache.get<any>('/api/v1/statistics/most-followed/?limit=20');
  const cachedAwards = apiCache.get<any>('/api/v1/statistics/awards/');
  const hasCache = Boolean(cachedScorers || cachedAssists);

  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'followed' | 'awards'>('scorers');
  const [scorers, setScorers] = useState<any[]>(() => cachedScorers || []);
  const [assists, setAssists] = useState<any[]>(() => cachedAssists || []);
  const [followed, setMostFollowed] = useState<any[]>(() => cachedFollowed || []);
  const [awards, setAwards] = useState<any[]>(() => cachedAwards || []);
  const [loading, setLoading] = useState<boolean>(() => !hasCache);

  // Most Followed Tab controls
  const [followedViewAll, setFollowedViewAll] = useState<boolean>(false);
  const [followedBatch, setFollowedBatch] = useState<string>('');
  const [loadingFollowed, setLoadingFollowed] = useState<boolean>(false);

  const handleFollowedFilter = async (viewAll: boolean, batchCode: string) => {
    setLoadingFollowed(true);
    try {
      const limit = viewAll ? 'all' : 20;
      const res = await api.statistics.getMostFollowed(limit, batchCode || undefined);
      setMostFollowed(res || []);
    } catch (err) {
      console.error('Failed to load followed members:', err);
    } finally {
      setLoadingFollowed(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [sRes, aRes, fRes, awRes] = await Promise.all([
          api.statistics.getTopScorers(20),
          api.statistics.getTopAssists(20),
          api.statistics.getMostFollowed(20),
          api.statistics.getAwards(),
        ]);
        setScorers(sRes || []);
        setAssists(aRes || []);
        setMostFollowed(fRes || []);
        setAwards(awRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          STATISTICS &amp; TOURNAMENT AWARDS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Authoritative leaderboards calculated exclusively from official published tournament matches
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#2C3960]">
        {[
          { id: 'scorers', label: 'Golden Boot (Top Scorers)', icon: Flame },
          { id: 'assists', label: 'Playmakers (Assists)', icon: Star },
          { id: 'followed', label: 'Most Followed Members', icon: Users },
          { id: 'awards', label: 'Official Tournament Awards', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                active
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. TOP SCORERS */}
      {activeTab === 'scorers' && (
        <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Academic Batch</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Position</th>
                <th className="py-3.5 px-4 text-center text-emerald-400 font-black text-sm">Goals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {scorers.length > 0 ? (
                scorers.map((s) => (
                  <tr key={s.player_id} className="hover:bg-[#232F54]/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-black">
                      {s.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 inline-flex items-center justify-center font-black text-xs">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-300">{s.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/members/${s.username}`}
                        className="font-bold text-white hover:text-emerald-400 flex items-center gap-2.5"
                      >
                        {(s.profile_picture || s.avatar_url || s.profile_picture_url) ? (
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-400/40 shrink-0">
                            <img src={s.profile_picture || s.avatar_url || s.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <span>{s.full_name}</span>
                        {s.jersey_number && (
                          <span className="text-[10px] text-amber-400">#{s.jersey_number}</span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{s.batch}</td>
                    <td className="py-3.5 px-4 text-slate-400">{s.department}</td>
                    <td className="py-3.5 px-4 text-center text-slate-300">{s.position}</td>
                    <td className="py-3.5 px-4 text-center font-black text-emerald-400 text-base">
                      {s.goals}
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Spinner size="md" color="emerald" label="Loading Golden Boot scorers..." centered />
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No goal records found in published matches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TOP ASSISTS */}
      {activeTab === 'assists' && (
        <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Academic Batch</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Position</th>
                <th className="py-3.5 px-4 text-center text-blue-400 font-black text-sm">Assists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {assists.length > 0 ? (
                assists.map((a) => (
                  <tr key={a.player_id} className="hover:bg-[#232F54]/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-black">
                      <span className="text-slate-300">{a.rank}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/members/${a.username}`}
                        className="font-bold text-white hover:text-blue-400 flex items-center gap-2.5"
                      >
                        {(a.profile_picture || a.avatar_url || a.profile_picture_url) ? (
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-blue-400/40 shrink-0">
                            <img src={a.profile_picture || a.avatar_url || a.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <span>{a.full_name}</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-semibold">{a.batch}</td>
                    <td className="py-3.5 px-4 text-slate-400">{a.department}</td>
                    <td className="py-3.5 px-4 text-center text-slate-300">{a.position}</td>
                    <td className="py-3.5 px-4 text-center font-black text-blue-400 text-base">
                      {a.assists}
                    </td>
                  </tr>
                ))
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Spinner size="md" color="blue" label="Loading Playmaker assists..." centered />
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No assist records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. MOST FOLLOWED */}
      {activeTab === 'followed' && (
        <div className="space-y-6">
          {/* Header Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Heart className="w-5 h-5 fill-rose-400" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{followedViewAll ? `All Followed Members (${followed.length})` : `Top ${followed.length} Most Followed`}</span>
                  {followedViewAll && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Full Directory
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {followedViewAll
                    ? 'Displaying all registered fellowship members ranked by follower count'
                    : 'Showing the top 20 community leaders by follower count'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Batch Filter */}
              <div className="flex items-center gap-1.5 bg-[#0B132B] border border-[#2C3960] rounded-xl px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={followedBatch}
                  onChange={(e) => {
                    const newBatch = e.target.value;
                    setFollowedBatch(newBatch);
                    handleFollowedFilter(followedViewAll, newBatch);
                  }}
                  className="bg-transparent text-xs text-white focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="" className="bg-[#0B132B]">All Batches</option>
                  <option value="2ND_YEAR" className="bg-[#0B132B]">2nd Year Batch</option>
                  <option value="3RD_YEAR" className="bg-[#0B132B]">3rd Year Batch</option>
                  <option value="4TH_YEAR" className="bg-[#0B132B]">4th Year Batch</option>
                  <option value="5TH_YEAR" className="bg-[#0B132B]">5th Year Batch</option>
                </select>
              </div>

              {/* View All / Top 20 Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextViewAll = !followedViewAll;
                  setFollowedViewAll(nextViewAll);
                  handleFollowedFilter(nextViewAll, followedBatch);
                }}
                disabled={loadingFollowed}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                  followedViewAll
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {loadingFollowed ? (
                  <>
                    <Spinner size="xs" color="slate" />
                    <span>Loading...</span>
                  </>
                ) : followedViewAll ? (
                  <>
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Switch to Top 20</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    <span>View All Followed</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {loading && followed.length === 0 ? (
            <div className="card-gloss p-12 rounded-2xl text-center">
              <Spinner size="md" color="emerald" label="Loading most followed fellowship players..." centered />
            </div>
          ) : followed.length === 0 ? (
            <div className="card-gloss p-12 rounded-2xl text-center text-slate-400 text-xs">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p>No members found for this batch filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {followed.map((m, idx) => {
                  const rank = m.rank || idx + 1;
                  const isTop3 = rank <= 3;
                  const rankBadgeClass =
                    rank === 1
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-950 font-black'
                      : rank === 3
                      ? 'bg-amber-600 text-white font-black'
                      : 'bg-slate-800 text-slate-300 font-bold';

                  return (
                    <div
                      key={m.id}
                      className="card-gloss p-5 rounded-2xl text-center group hover:border-emerald-500/40 relative transition-all"
                    >
                      {/* Rank Badge */}
                      <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full shadow-sm ${rankBadgeClass}`}>
                        #{rank}
                      </span>

                      <div className="w-16 h-16 rounded-full bg-emerald-800/40 border-2 border-emerald-400/40 mx-auto mb-3 flex items-center justify-center font-bold text-white overflow-hidden shadow-md">
                        {(m.profile_picture || m.avatar_url || m.profile_picture_url) ? (
                          <img
                            src={m.profile_picture || m.avatar_url || m.profile_picture_url}
                            alt={m.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{m.full_name ? m.full_name[0] : 'U'}</span>
                        )}
                      </div>

                      <Link
                        href={`/members/${m.username}`}
                        className="text-sm font-bold text-white hover:text-emerald-400 block truncate transition-colors"
                      >
                        {m.full_name}
                      </Link>
                      <p className="text-[10px] text-emerald-400 font-semibold">{m.batch} &bull; {m.fellowship_team}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.department}</p>

                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-200">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        {m.followers_count} Followers
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Load/View All Button when not showing all */}
              {!followedViewAll && followed.length >= 20 && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFollowedViewAll(true);
                      handleFollowedFilter(true, followedBatch);
                    }}
                    disabled={loadingFollowed}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    {loadingFollowed ? (
                      <>
                        <Spinner size="xs" color="slate" />
                        <span>Loading All Members...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>View All Followed Members</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Status footer when all are loaded */}
              {followedViewAll && (
                <div className="mt-8 p-4 rounded-2xl bg-[#161D36]/80 border border-[#2C3960] text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Showing all {followed.length} fellowship members ranked by community followers
                  </span>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-4 cursor-pointer"
                  >
                    Back to top ↑
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 4. AWARDS */}
      {activeTab === 'awards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {awards.length > 0 ? (
            awards.map((award) => (
              <div
                key={award.id}
                className="card-gloss p-6 rounded-2xl border-l-4 border-amber-500 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300">
                    {award.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{award.awarded_date}</span>
                </div>

                <h3 className="text-lg font-black text-white">{award.title}</h3>

                {award.recipient_member && (
                  <div className="flex items-center gap-2.5">
                    {(award.recipient_member.profile_picture || award.recipient_member.avatar_url || award.recipient_member.profile_picture_url) && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/50 shrink-0">
                        <img src={award.recipient_member.profile_picture || award.recipient_member.avatar_url || award.recipient_member.profile_picture_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-xs font-bold text-emerald-400">
                      Recipient: {award.recipient_member.full_name} ({award.recipient_member.batch})
                    </p>
                  </div>
                )}

                {award.recipient_team && (
                  <p className="text-xs font-bold text-emerald-400">
                    Recipient Batch: {award.recipient_team.name}
                  </p>
                )}

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  &ldquo;{award.citation}&rdquo;
                </p>

                <p className="text-[10px] text-slate-500 pt-2 border-t border-[#2C3960]/60">
                  {award.season_name}
                </p>
              </div>
            ))
          ) : loading ? (
            <div className="card-gloss p-12 rounded-2xl text-center text-slate-400 col-span-2">
              <Spinner size="md" color="amber" label="Loading tournament awards..." centered />
            </div>
          ) : (
            <div className="card-gloss p-12 rounded-2xl text-center text-slate-400 col-span-2">
              <Award className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
              <p className="text-xs">Official tournament awards will be presented at the conclusion of the season.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
