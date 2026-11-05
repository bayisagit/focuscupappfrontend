'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Award,
  Camera,
  Edit,
  ShieldCheck,
  Search,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';
import BatchPhotoLightbox, { BatchTeamData } from '@/components/BatchPhotoLightbox';
import { useAuth } from '@/lib/auth-context';
import { apiCache } from '@/lib/cache';

import { Suspense } from 'react';

function BatchDetailContent() {
  const { batchCode } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const cached = batchCode ? apiCache.get<any>(`/api/v1/competitions/batches/${batchCode}/`) : null;
  const [data, setData] = useState<any>(() => cached || null);
  const [loading, setLoading] = useState<boolean>(() => !cached);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  const initialView = searchParams.get('view') === 'registered' ? 'registered' : 'roster';
  const [activeTab, setActiveTab] = useState<'roster' | 'registered'>(initialView);
  const [memberSearch, setMemberSearch] = useState('');

  const handleBatchUpdated = (updated: BatchTeamData) => {
    setData((prev: any) => ({
      ...prev,
      team: {
        ...prev.team,
        ...updated,
      },
    }));
  };

  useEffect(() => {
    if (batchCode) {
      api.competitions.getBatchDetail(batchCode as string)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [batchCode]);

  // Fallback: if data has no registered_members list populated, load batch members from members API
  useEffect(() => {
    if (batchCode && (!data?.registered_members || data.registered_members.length === 0)) {
      api.members.list({ batch: batchCode as string, page_size: '100' })
        .then((res: any) => {
          const members = Array.isArray(res) ? res : (res?.results || []);
          if (members.length > 0) {
            setData((prev: any) => {
              if (!prev) return prev;
              const rosterMap = new Map((prev.roster || []).map((r: any) => [r.member_id, r]));
              const mapped = members.map((m: any) => {
                const reg: any = rosterMap.get(m.id);
                return {
                  id: m.id,
                  username: m.username,
                  full_name: m.full_name,
                  first_name: m.first_name,
                  second_name: m.second_name,
                  department: m.department,
                  college: m.college,
                  academic_year: m.academic_year,
                  fellowship_team: m.fellowship_team,
                  gender: m.gender,
                  primary_position: m.primary_position,
                  secondary_position: m.secondary_position,
                  preferred_jersey_number: m.preferred_jersey_number,
                  avatar_url: m.avatar_url || m.profile_picture,
                  profile_picture: m.avatar_url || m.profile_picture,
                  profile_picture_url: m.profile_picture_url,
                  personal_chant: m.personal_chant,
                  is_coach: m.is_coach,
                  coached_batch_name: m.coached_batch_name,
                  is_on_roster: Boolean(reg),
                  roster_jersey_number: reg ? reg.jersey_number : null,
                  roster_position: reg ? reg.position : null,
                };
              });
              return {
                ...prev,
                registered_members: mapped,
              };
            });
          }
        })
        .catch(() => {});
    }
  }, [batchCode, data?.registered_members]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading batch details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10">
        <h2 className="text-lg font-bold text-white mb-2">Batch Not Found</h2>
        <Link href="/batches" className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
          View All Batches
        </Link>
      </div>
    );
  }

  const { team, total_members, roster = [], standing, fixtures = [], results = [], registered_members = [] } = data;

  const registeredMembersList: any[] = registered_members.length > 0 ? registered_members : [];

  const filteredRoster = (roster || []).filter((p: any) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.position?.toLowerCase().includes(q) ||
      p.jersey_number?.toString().includes(q) ||
      p.personal_chant?.toLowerCase().includes(q)
    );
  });

  const filteredRegistered = registeredMembersList.filter((m: any) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q) ||
      m.fellowship_team?.toLowerCase().includes(q) ||
      m.primary_position?.toLowerCase().includes(q) ||
      m.roster_jersey_number?.toString().includes(q) ||
      m.preferred_jersey_number?.toString().includes(q) ||
      m.personal_chant?.toLowerCase().includes(q)
    );
  });

  const scrollToSection = () => {
    const el = document.getElementById('batch-list-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Batch Hero Card */}
      <div
        className="card-gloss rounded-3xl p-6 sm:p-8 shadow-2xl border-t-4 mb-8"
        style={{ borderTopColor: team.color_hex }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setIsPhotoLightboxOpen(true)}
              className="relative group/photo shrink-0 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transform hover:scale-105 active:scale-95 transition-all shadow-xl"
              title="Click to view full batch photo / sketch"
            >
              <TeamCrest team={team} size="xl" className="rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-2xl text-white">
                <Camera className="w-6 h-6 mb-1 drop-shadow" />
                <span className="text-[10px] font-bold">View Photo</span>
              </div>
            </button>
            <div>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-slate-950 inline-block mb-1"
                style={{ backgroundColor: team.color_hex }}
              >
                {team.batch_code.replace('_', ' ')}
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {team.name}
              </h1>
              <p className="text-xs font-semibold text-amber-400">
                &ldquo;{team.nickname || team.motto}&rdquo;
              </p>

              {team.coach_name && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Coach: {team.coach_name}</span>
                </div>
              )}

              {Boolean(
                user?.is_manager ||
                (user?.is_coach && (
                  user?.coached_batch === team.batch_code ||
                  user?.coached_batch_id === team.id ||
                  (user?.coached_team && (user.coached_team.batch_code === team.batch_code || user.coached_team.id === team.id))
                ))
              ) && (
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Batch Photo &amp; Info</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center w-full md:w-auto">
            {/* 1. Registered Members (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('registered');
                scrollToSection();
              }}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative group flex flex-col items-center justify-center ${
                activeTab === 'registered'
                  ? 'bg-blue-600/20 border-blue-400 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 scale-[1.03]'
                  : 'bg-[#161D36] border-[#2C3960] hover:border-blue-400/60 hover:bg-[#1a2342] hover:scale-[1.02]'
              }`}
              title="Click to view all registered batch members"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Users className={`w-3.5 h-3.5 ${activeTab === 'registered' ? 'text-blue-400' : 'text-slate-400'}`} />
                <p className={`text-xl font-black ${activeTab === 'registered' ? 'text-blue-300' : 'text-white'}`}>
                  {total_members ?? registeredMembersList.length ?? 0}
                </p>
              </div>
              <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${activeTab === 'registered' ? 'text-blue-300 font-black' : 'text-slate-400'}`}>
                Registered
              </p>
              <span className={`text-[9px] mt-1 font-semibold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === 'registered'
                  ? 'bg-blue-500 text-slate-950 font-black'
                  : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20'
              }`}>
                {activeTab === 'registered' ? 'Viewing List' : 'View Members'}
              </span>
            </button>

            {/* 2. Roster Squad (Clickable) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('roster');
                scrollToSection();
              }}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative group flex flex-col items-center justify-center ${
                activeTab === 'roster'
                  ? 'bg-emerald-600/20 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20 scale-[1.03]'
                  : 'bg-[#161D36] border-[#2C3960] hover:border-emerald-400/60 hover:bg-[#1a2342] hover:scale-[1.02]'
              }`}
              title="Click to view official tournament squad roster"
            >
              <div className="flex items-center justify-center gap-1.5">
                <Shield className={`w-3.5 h-3.5 ${activeTab === 'roster' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <p className="text-xl font-black text-emerald-400">
                  {roster.length}
                </p>
              </div>
              <p className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${activeTab === 'roster' ? 'text-emerald-300 font-black' : 'text-slate-400'}`}>
                Roster Squad
              </p>
              <span className={`text-[9px] mt-1 font-semibold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === 'roster'
                  ? 'bg-emerald-400 text-slate-950 font-black'
                  : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
              }`}>
                {activeTab === 'roster' ? 'Viewing Squad' : 'View Squad'}
              </span>
            </button>

            {/* 3. League Pos */}
            <div className="p-3 rounded-2xl bg-[#161D36] border border-[#2C3960] flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-xl font-black text-amber-400">
                  {standing ? `#${standing.position}` : '—'}
                </p>
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">League Pos</p>
              <span className="text-[9px] text-slate-500 font-semibold mt-1">
                {standing ? `${standing.points} pts` : 'No matches'}
              </span>
            </div>
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-slate-300 leading-relaxed mt-6 pt-5 border-t border-[#2C3960]/60">
            {team.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Official Squad Roster or Registered Members (8 cols) */}
        <div id="batch-list-section" className="lg:col-span-8 space-y-6 scroll-mt-24">
          {/* Subheader with View Switcher Tabs & Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#2C3960]/60">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#121A33] border border-[#2C3960] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Roster Squad ({roster.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('registered')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'registered'
                    ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Registered ({registeredMembersList.length || total_members || 0})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === 'roster' ? "Search squad players..." : "Search registered..."}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121A33] border border-[#2C3960] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
          </div>

          {/* Tab 1: Official Football Roster Squad */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    OFFICIAL FOOTBALL ROSTER ({filteredRoster.length} {filteredRoster.length === 1 ? 'PLAYER' : 'PLAYERS'})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Approved tournament players representing {team.name}
                  </p>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Season Approved
                </span>
              </div>

              {filteredRoster.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRoster.map((p: any) => (
                    <div
                      key={p.id}
                      className="card-gloss p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/40 transition-all group"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-800/40 border-2 border-emerald-400/40 flex items-center justify-center overflow-hidden">
                          {p.profile_picture || p.avatar_url || p.profile_picture_url ? (
                            <img
                              src={p.profile_picture || p.avatar_url || p.profile_picture_url}
                              alt={p.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-emerald-300" />
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                          #{p.jersey_number}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/members/${p.username}`}
                            className="text-xs font-bold text-white hover:text-emerald-400 truncate block transition-colors"
                          >
                            {p.full_name}
                          </Link>
                          {p.is_coach && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-600 text-white shrink-0">
                              Coach
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-emerald-400 font-semibold">{p.position}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.department}</p>
                        {p.personal_chant && (
                          <p className="text-[10px] text-amber-300/80 italic truncate mt-0.5">
                            &ldquo;{p.personal_chant}&rdquo;
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/members/${p.username}`}
                        className="shrink-0 p-2 rounded-xl bg-slate-800/60 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition-all"
                        title={`View ${p.full_name}'s profile`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-gloss p-8 rounded-2xl text-center text-slate-400 text-xs">
                  {memberSearch.trim()
                    ? `No squad players match "${memberSearch}".`
                    : 'No approved tournament players for this batch yet.'}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Registered Fellowship Members */}
          {activeTab === 'registered' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    REGISTERED BATCH MEMBERS ({filteredRegistered.length} {filteredRegistered.length === 1 ? 'MEMBER' : 'MEMBERS'})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All fellowship members in {team.name}
                  </p>
                </div>
                <span className="text-[11px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-full">
                  Batch Fellowship
                </span>
              </div>

              {filteredRegistered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRegistered.map((m: any) => (
                    <div
                      key={m.id}
                      className="card-gloss p-4 rounded-2xl flex items-center gap-4 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-[#182346] border-2 border-slate-700/60 flex items-center justify-center overflow-hidden">
                          {m.profile_picture || m.avatar_url || m.profile_picture_url ? (
                            <img
                              src={m.profile_picture || m.avatar_url || m.profile_picture_url}
                              alt={m.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        {m.is_on_roster && (
                          <span
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow"
                            title="Official Tournament Squad Player"
                          >
                            #{m.roster_jersey_number || m.preferred_jersey_number || '✓'}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={`/members/${m.username}`}
                            className="text-xs font-bold text-white hover:text-blue-400 truncate block transition-colors"
                          >
                            {m.full_name}
                          </Link>
                          {m.is_coach && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-600 text-white shrink-0">
                              Coach
                            </span>
                          )}
                          {m.is_on_roster ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                              Squad
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                              Member
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-300 truncate mt-0.5">
                          {m.department || 'AASTU'} &bull; <span className="text-slate-400">{m.academic_year || 'Fellowship'}</span>
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                          {m.fellowship_team && m.fellowship_team !== 'No Team' && (
                            <span className="px-1.5 py-0.5 rounded bg-[#161D36] border border-[#2C3960] text-amber-300/90 font-medium text-[9px]">
                              {m.fellowship_team}
                            </span>
                          )}
                          {(m.roster_position || m.primary_position) && (
                            <span className="text-emerald-400 font-medium text-[9px]">
                              {m.roster_position || m.primary_position}
                            </span>
                          )}
                        </div>

                        {m.personal_chant && (
                          <p className="text-[10px] text-amber-300/80 italic truncate mt-1">
                            &ldquo;{m.personal_chant}&rdquo;
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/members/${m.username}`}
                        className="shrink-0 p-2 rounded-xl bg-slate-800/60 hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 border border-transparent hover:border-blue-500/30 transition-all"
                        title={`View ${m.full_name}'s profile`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-gloss p-8 rounded-2xl text-center text-slate-400 text-xs">
                  {memberSearch.trim()
                    ? `No registered members match "${memberSearch}".`
                    : 'No registered fellowship members for this batch yet.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Batch Fixtures & Results (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Standing Summary Card */}
          {standing && (
            <div className="card-gloss p-5 rounded-2xl space-y-2 border-emerald-500/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> League Table Position
              </h3>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Rank:</span>
                <span className="text-base font-black text-white">#{standing.position}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Points:</span>
                <span className="font-bold text-emerald-400">{standing.points} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Record:</span>
                <span className="text-slate-300">
                  {standing.won}W - {standing.drawn}D - {standing.lost}L
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Goals (GF/GA):</span>
                <span className="text-slate-300">{standing.goals_for} / {standing.goals_against} (GD: {standing.goal_difference})</span>
              </div>
            </div>
          )}

          {/* Matches & Results */}
          <div className="card-gloss p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Batch Matches
            </h3>

            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Recent Results</p>
                {results.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block p-3 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/40 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white mb-1">
                      <span>{m.home_team.name}</span>
                      <span className="text-emerald-400 font-black">{m.home_score} - {m.away_score}</span>
                      <span>{m.away_team.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">{m.match_date}</p>
                  </Link>
                ))}
              </div>
            )}

            {fixtures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#2C3960]/60">
                <p className="text-[11px] font-bold text-amber-400 uppercase">Upcoming Fixtures</p>
                {fixtures.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block p-3 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500/40 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white mb-1">
                      <span className="truncate">{m.home_team.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-amber-400">VS</span>
                      <span className="truncate">{m.away_team.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">{m.match_date} &bull; {m.kick_off_time}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Batch Photo Lightbox */}
      <BatchPhotoLightbox
        isOpen={isPhotoLightboxOpen}
        onClose={() => setIsPhotoLightboxOpen(false)}
        batch={team}
        onBatchUpdated={handleBatchUpdated}
      />
    </div>
  );
}

export default function BatchDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-slate-400">Loading batch details...</div>}>
      <BatchDetailContent />
    </Suspense>
  );
}
