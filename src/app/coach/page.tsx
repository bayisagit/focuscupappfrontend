'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Shirt,
  Sparkles,
  AlertCircle,
  ChevronRight,
  UserCheck,
  Check,
  X,
  FileImage,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import LineupPosterGenerator, { SquadPlayerItem } from '@/components/LineupPosterGenerator';
import BatchPhotoLightbox from '@/components/BatchPhotoLightbox';
import { useToast } from '@/components/ToastProvider';
import { apiCache } from '@/lib/cache';

export default function CoachPortalPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'lineups' | 'poster'>('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  // Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [appFilter, setAppFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [appSearch, setAppSearch] = useState('');
  const [reviewModal, setReviewModal] = useState<{ open: boolean; app: any | null; action: 'APPROVE' | 'REJECT'; jersey: string; reason: string }>({
    open: false,
    app: null,
    action: 'APPROVE',
    jersey: '',
    reason: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Lineup State
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchSquadData, setMatchSquadData] = useState<any>(null);
  const [squadLoading, setSquadLoading] = useState(false);
  const [savingSquad, setSavingSquad] = useState(false);
  const [squadSuccessMsg, setSquadSuccessMsg] = useState<string | null>(null);
  const [squadErrorMsg, setSquadErrorMsg] = useState<string | null>(null);

  // Active editable squad selection for the chosen match
  // Map of member_id -> { is_starter: boolean, is_goalkeeper: boolean, jersey_number: number }
  const [selectedSquadMap, setSelectedSquadMap] = useState<Record<number, { is_starter: boolean; is_goalkeeper: boolean; jersey_number: number }>>({});

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.coach.getDashboard();
      setDashboardData(data);

      // Load applications and matches
      const [apps, matchList] = await Promise.all([
        api.coach.getPlayers(),
        api.coach.getMatches(),
      ]);
      setApplications(apps || []);
      setMatches(matchList || []);

      if (matchList && matchList.length > 0 && !selectedMatchId) {
        setSelectedMatchId(matchList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load coach dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_coach || user.role === 'COACH')) {
      loadDashboard();
    }
  }, [user]);

  // Load squad when selected match changes
  useEffect(() => {
    if (selectedMatchId) {
      setSquadLoading(true);
      setSquadSuccessMsg(null);
      setSquadErrorMsg(null);
      api.coach.getMatchSquad(selectedMatchId)
        .then((res) => {
          setMatchSquadData(res);
          // Initialize selected squad map from current_squad
          const map: Record<number, { is_starter: boolean; is_goalkeeper: boolean; jersey_number: number }> = {};
          if (res?.current_squad && Array.isArray(res.current_squad)) {
            res.current_squad.forEach((s: any) => {
              map[s.player_id] = {
                is_starter: s.is_starter,
                is_goalkeeper: s.is_goalkeeper,
                jersey_number: s.jersey_number,
              };
            });
          }
          setSelectedSquadMap(map);
        })
        .catch((err) => {
          console.error('Failed to load match squad', err);
        })
        .finally(() => setSquadLoading(false));
    }
  }, [selectedMatchId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="card-gloss max-w-md w-full p-8 rounded-3xl border border-[#2C3960] text-center space-y-4">
          <Shield className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Batch Coach Portal</h2>
          <p className="text-xs text-slate-300">
            Please log in with your dedicated batch coach credentials to access the coaching workspace.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            Sign In with Coach Account
          </Link>
        </div>
      </div>
    );
  }

  if (!user.is_coach && user.role !== 'COACH') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="card-gloss max-w-md w-full p-8 rounded-3xl border border-[#2C3960] text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-black text-white">Coach Access Restricted</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            You are currently signed in as a fellowship member (<span className="text-emerald-400 font-bold">{user.username}</span>).
            Batch Coaches have dedicated credentials provided by the Tournament Manager.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className="py-2.5 px-4 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all"
            >
              Sign In with Coach Credentials
            </Link>
            <Link
              href="/"
              className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Application Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal.app) return;
    const appId = reviewModal.app.id;
    const action = reviewModal.action;
    setSubmittingReview(true);
    try {
      const payload: any = {
        status: action,
        reason: reviewModal.reason,
      };
      if (action === 'APPROVE' && reviewModal.jersey) {
        payload.jersey_number = parseInt(reviewModal.jersey, 10);
      }
      const res = await api.coach.reviewPlayer(appId, payload);

      // 1. Immediately remove from local state and close modal
      setApplications((prev) => (Array.isArray(prev) ? prev.filter((a) => a.id !== appId) : []));
      setReviewModal({ open: false, app: null, action: 'APPROVE', jersey: '', reason: '' });

      // 2. Clear relevant cache
      apiCache.invalidatePlayerRegistrations();

      // 3. Show smooth toast
      showToast(res.message || `Player application ${action.toLowerCase()}d successfully!`, 'success');

      // 4. Refresh applications and stats in background
      const [updatedApps, data] = await Promise.all([
        api.coach.getPlayers(),
        api.coach.getDashboard(),
      ]);
      if (updatedApps) setApplications(updatedApps);
      if (data) setDashboardData(data);
    } catch (err: any) {
      showToast(err.data?.error || err.message || 'Failed to update application.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Toggle player in squad
  const handleToggleStarter = (player: any) => {
    setSelectedSquadMap((prev) => {
      const next = { ...prev };
      const current = next[player.id];
      const defaultJersey = player.jersey_number || 99;

      if (!current) {
        // Add as starter
        next[player.id] = {
          is_starter: true,
          is_goalkeeper: false,
          jersey_number: defaultJersey,
        };
      } else if (current.is_starter && !current.is_goalkeeper) {
        // Move to substitute bench
        next[player.id] = {
          is_starter: false,
          is_goalkeeper: false,
          jersey_number: current.jersey_number,
        };
      } else if (!current.is_starter) {
        // Remove from squad entirely
        delete next[player.id];
      } else if (current.is_goalkeeper) {
        // Goalkeeper toggled -> move to substitute
        next[player.id] = {
          is_starter: false,
          is_goalkeeper: false,
          jersey_number: current.jersey_number,
        };
      }
      return next;
    });
  };

  const handleToggleGK = (player: any) => {
    setSelectedSquadMap((prev) => {
      const next = { ...prev };
      const current = next[player.id];
      const defaultJersey = player.jersey_number || 1;

      // Clear goalkeeper flag from anyone else
      Object.keys(next).forEach((k) => {
        if (next[Number(k)]) {
          next[Number(k)].is_goalkeeper = false;
        }
      });

      if (!current || !current.is_starter || !current.is_goalkeeper) {
        next[player.id] = {
          is_starter: true,
          is_goalkeeper: true,
          jersey_number: current?.jersey_number || defaultJersey,
        };
      }
      return next;
    });
  };

  const handleSaveSquad = async () => {
    if (!selectedMatchId) return;
    setSavingSquad(true);
    setSquadSuccessMsg(null);
    setSquadErrorMsg(null);

    const squadPayload = Object.entries(selectedSquadMap).map(([pid, info]) => ({
      player_id: Number(pid),
      is_starter: info.is_starter,
      is_goalkeeper: info.is_goalkeeper,
      jersey_number: info.jersey_number,
    }));

    try {
      const res = await api.coach.saveMatchSquad(selectedMatchId, squadPayload);
      setSquadSuccessMsg(res.message || 'Official match lineup saved successfully! The tournament manager can now see it.');
      // Refresh match squad data
      const updated = await api.coach.getMatchSquad(selectedMatchId);
      setMatchSquadData(updated);
    } catch (err: any) {
      setSquadErrorMsg(err.data?.error || err.message || 'Failed to save squad line-up.');
    } finally {
      setSavingSquad(false);
    }
  };

  const team = dashboardData?.team;
  const coachProfile = dashboardData?.coach_profile;
  const stats = dashboardData?.stats;
  const nextMatch = dashboardData?.next_match;

  const filteredApps = applications.filter((app) => {
    if (appFilter !== 'ALL' && app.status !== appFilter) return false;
    if (appSearch) {
      const q = appSearch.toLowerCase();
      const name = (app.full_name || '').toLowerCase();
      const pos = (app.preferred_position || '').toLowerCase();
      const dept = (app.department || '').toLowerCase();
      return name.includes(q) || pos.includes(q) || dept.includes(q);
    }
    return true;
  });

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const eligiblePlayers = matchSquadData?.eligible_players || [];

  const starterCount = Object.values(selectedSquadMap).filter((s) => s.is_starter).length;
  const subCount = Object.values(selectedSquadMap).filter((s) => !s.is_starter).length;
  const hasGK = Object.values(selectedSquadMap).some((s) => s.is_goalkeeper);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Top Coach Banner */}
      <div className="card-gloss p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden mb-8 bg-gradient-to-r from-[#161D36] via-[#1C2541] to-[#0D1326]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/40 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xl shadow-emerald-500/15">
              {team?.photo_url ? (
                <img src={team.photo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Shield className="w-10 h-10 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm">
                  <Shield className="w-3 h-3" /> Official Batch Coach
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {team?.nickname || 'Focus Cup Contender'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {team?.name || 'My Batch Team'}
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-xl italic">
                &ldquo;{team?.motto || 'United in Christ, Strong in Fellowship'}&rdquo;
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Batch Profile &amp; Sketch Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coach Identity Chip */}
          <div className="flex items-center gap-3.5 bg-[#0B132B]/80 backdrop-blur-md p-3 px-4 rounded-2xl border border-[#2C3960] self-start md:self-auto shadow-md">
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center overflow-hidden shrink-0">
              {coachProfile?.avatar_url ? (
                <img src={coachProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div>
              <p className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{coachProfile?.full_name || user.username}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Player-Coach
                </span>
              </p>
              <p className="text-[11px] text-slate-400">
                {coachProfile?.department ? `${coachProfile.department} • ` : ''}
                Login: <span className="font-mono text-emerald-400">@{coachProfile?.username}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C3960]/80 pb-3 mb-8 overflow-x-auto scrollbar-thin">
        {[
          { key: 'overview', label: 'Batch Overview', icon: Trophy },
          { key: 'applications', label: `Roster Applications (${stats?.pending_applications ? `${stats.pending_applications} pending` : `${stats?.approved_players || 0} approved`})`, icon: Users },
          { key: 'lineups', label: 'Match Lineup & Starting XI', icon: Shirt },
          { key: 'poster', label: 'Lineup Poster Studio', icon: FileImage },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-[#161D36] text-slate-300 hover:text-white border border-[#2C3960] hover:border-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-gloss p-5 rounded-2xl border border-[#2C3960] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Approved Squad Players</p>
                <p className="text-2xl font-black text-white mt-1">{stats?.approved_players || 0}</p>
                <span className="text-[10px] text-emerald-400 font-semibold mt-1 inline-block">
                  Eligible for starting XI &amp; bench
                </span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="card-gloss p-5 rounded-2xl border border-[#2C3960] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Pending Applications</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{stats?.pending_applications || 0}</p>
                <span className="text-[10px] text-slate-400 mt-1 inline-block">
                  Requires your review
                </span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="card-gloss p-5 rounded-2xl border border-[#2C3960] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Scheduled Fixtures</p>
                <p className="text-2xl font-black text-teal-400 mt-1">{stats?.total_fixtures || 0}</p>
                <span className="text-[10px] text-teal-400 font-semibold mt-1 inline-block">
                  Tournament group stage
                </span>
              </div>
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Next Match Spotlight */}
          {nextMatch ? (
            <div className="card-gloss p-6 sm:p-7 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#1C2541]/90 to-[#0F172A]/90 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#2C3960]/60">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Next Fixture Spotlight
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    Round {nextMatch.round_number} &bull; {nextMatch.match_date} at {nextMatch.kick_off_time}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedMatchId(nextMatch.id);
                    setActiveTab('lineups');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  Manage Line-Up &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 flex items-center justify-around bg-[#0B132B]/60 p-5 rounded-2xl border border-[#2C3960]/80">
                  <div className="text-center">
                    <p className="text-sm font-black text-white">{team?.name}</p>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase mt-1 block">Your Batch</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-sm">
                    VS
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white">{nextMatch.opponent.name}</p>
                    <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Opponent</span>
                  </div>
                </div>

                <div className="md:col-span-4 card-gloss p-4 rounded-2xl border border-[#2C3960] space-y-2">
                  <p className="text-xs font-bold text-slate-300">Official Line-up Status</p>
                  <div className="flex items-center gap-2">
                    {nextMatch.lineup_status.is_submitted ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Line-up Submitted ({nextMatch.lineup_status.starters_count}/11 starters)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Line-up Not Yet Submitted
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The tournament manager sees your saved official lineup directly in the match day studio.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-gloss p-8 rounded-3xl border border-[#2C3960] text-center space-y-2">
              <Trophy className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Upcoming Fixtures Scheduled</h3>
              <p className="text-xs text-slate-400">Fixtures generated by the tournament director will automatically appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROSTER APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="card-gloss p-6 rounded-3xl border border-[#2C3960]">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-[#2C3960]/60">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      appFilter === f
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-[#161D36] text-slate-300 hover:text-white border border-[#2C3960]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player, position, dept..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* List of Applications */}
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="card-gloss p-4 sm:p-5 rounded-2xl border border-[#2C3960] hover:border-slate-500 transition-all flex flex-col justify-between gap-3 bg-[#0B132B]/50"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0">
                        {app.avatar_url ? (
                          <img src={app.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-emerald-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black text-white truncate">{app.full_name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : app.status === 'PENDING'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {app.department} &bull; {app.academic_year}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Shirt className="w-3.5 h-3.5" /> #{app.jersey_number}
                          </span>
                          <span className="text-slate-300">
                            {app.preferred_position}
                          </span>
                        </div>
                        {app.football_notes && (
                          <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-2">
                            &ldquo;{app.football_notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-[#2C3960]/60 flex items-center justify-end gap-2">
                      {app.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => setReviewModal({
                              open: true,
                              app,
                              action: 'APPROVE',
                              jersey: String(app.jersey_number || ''),
                              reason: '',
                            })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve Roster
                          </button>
                          <button
                            onClick={() => setReviewModal({
                              open: true,
                              app,
                              action: 'REJECT',
                              jersey: '',
                              reason: '',
                            })}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all border border-rose-500/30"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                      {app.status === 'APPROVED' && (
                        <button
                          onClick={() => setReviewModal({
                            open: true,
                            app,
                            action: 'APPROVE',
                            jersey: String(app.jersey_number || ''),
                            reason: '',
                          })}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          Change Jersey #{app.jersey_number}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-white">No applications found</p>
                <p className="text-xs">No registered batch members match the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MATCH LINEUP SELECTION */}
      {activeTab === 'lineups' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Fixture Selector */}
          <div className="card-gloss p-5 sm:p-6 rounded-3xl border border-[#2C3960]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-emerald-400" />
                  Select Match Fixture to Set Line-Up
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Choose starting XI, designated goalkeeper, and bench substitutes for your batch.
                </p>
              </div>

              <select
                value={selectedMatchId || ''}
                onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                className="bg-[#161D36] border border-[#2C3960] rounded-xl px-4 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer min-w-[260px]"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Round {m.round_number}: vs {m.opponent.name} ({m.match_date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMatch && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Eligible Batch Players (including coach himself) */}
              <div className="lg:col-span-6 card-gloss p-6 rounded-3xl border border-[#2C3960] space-y-4">
                <div className="flex items-center justify-between border-b border-[#2C3960]/60 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white">Eligible Batch Players</h4>
                    <p className="text-[11px] text-slate-400">Click to toggle Starter &rarr; Bench &rarr; Remove</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    {eligiblePlayers.length} Players Available
                  </span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                  {eligiblePlayers.map((player: any) => {
                    const statusInSquad = selectedSquadMap[player.id];
                    const isStarter = statusInSquad?.is_starter;
                    const isGK = statusInSquad?.is_goalkeeper;
                    const isSub = statusInSquad && !statusInSquad.is_starter;

                    return (
                      <div
                        key={player.id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isGK
                            ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                            : isStarter
                            ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm'
                            : isSub
                            ? 'bg-blue-500/15 border-blue-500/30'
                            : 'bg-[#161D36]/80 border-[#2C3960] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-[#2C3960] flex items-center justify-center overflow-hidden shrink-0">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate flex items-center gap-1.5">
                              <span>{player.full_name}</span>
                              {player.is_coach_player && (
                                <span className="text-[9px] px-1 rounded bg-amber-500 text-slate-950 font-black">
                                  COACH
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              #{player.jersey_number || '99'} &bull; {player.position}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleGK(player)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              isGK
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                            title="Set as starting Goalkeeper"
                          >
                            GK
                          </button>
                          <button
                            onClick={() => handleToggleStarter(player)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isStarter
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : isSub
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isGK ? 'Starter (GK)' : isStarter ? 'Starter (XI)' : isSub ? 'Bench (Sub)' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Confirmed Starting XI Board */}
              <div className="lg:col-span-6 card-gloss p-6 rounded-3xl border border-[#2C3960] space-y-5 bg-gradient-to-b from-[#1C2541]/90 to-[#0F172A]/90">
                <div className="flex items-center justify-between border-b border-[#2C3960]/60 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Official Match Line-Up Board
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Confirmed for Round {selectedMatch.round_number} vs {selectedMatch.opponent.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                      starterCount === 11 && hasGK
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {starterCount}/11 Starters {hasGK ? '• GK Set' : '• No GK'}
                    </span>
                  </div>
                </div>

                {/* Starters Section */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Starting XI ({starterCount} Players)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedSquadMap)
                      .filter(([_, info]) => info.is_starter)
                      .map(([pid, info]) => {
                        const player = eligiblePlayers.find((p: any) => p.id === Number(pid));
                        return (
                          <div
                            key={pid}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              info.is_goalkeeper
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                                : 'bg-[#161D36] border-[#2C3960] text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-black flex items-center justify-center shrink-0">
                                {info.jersey_number}
                              </span>
                              <span className="truncate font-semibold text-[11px]">
                                {player?.full_name || `Player #${pid}`}
                              </span>
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80">
                              {info.is_goalkeeper ? 'GK' : 'XI'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Substitutes Section */}
                <div className="space-y-2 pt-2 border-t border-[#2C3960]/60">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Substitutes Bench ({subCount} Players)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedSquadMap)
                      .filter(([_, info]) => !info.is_starter)
                      .map(([pid, info]) => {
                        const player = eligiblePlayers.find((p: any) => p.id === Number(pid));
                        return (
                          <div
                            key={pid}
                            className="p-2.5 rounded-xl border bg-[#161D36]/80 border-[#2C3960] text-slate-300 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0 text-slate-400">
                                {info.jersey_number}
                              </span>
                              <span className="truncate font-medium text-[11px]">
                                {player?.full_name || `Player #${pid}`}
                              </span>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-400">SUB</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {squadSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{squadSuccessMsg}</span>
                  </div>
                )}

                {squadErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{squadErrorMsg}</span>
                  </div>
                )}

                {/* Save and Generate Poster Buttons */}
                <div className="pt-3 border-t border-[#2C3960]/80 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSaveSquad}
                    disabled={savingSquad}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {savingSquad ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving Official Line-Up...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Save Official Starting Line-Up
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveTab('poster')}
                    className="w-full sm:w-auto py-3 px-5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileImage className="w-4 h-4 text-purple-400" />
                    Generate Match Poster &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LINEUP POSTER STUDIO */}
      {activeTab === 'poster' && selectedMatch && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-3xl bg-[#161D36] border border-[#2C3960] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileImage className="w-5 h-5 text-emerald-400" />
                Lineup Poster Studio &bull; {team?.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate, preview, and download broadcast-quality Starting XI posters (1080x1440 HD PNG) for {team?.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">Fixture:</span>
              <select
                value={selectedMatchId || ''}
                onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                className="bg-[#0B132B] border border-[#2C3960] rounded-xl px-4 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Round {m.round_number}: vs {m.opponent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Embedded LineupPosterGenerator with full vertical visibility */}
          <LineupPosterGenerator
            match={{
              id: selectedMatch.id,
              round_number: selectedMatch.round_number,
              match_date: selectedMatch.match_date,
              kick_off_time: selectedMatch.kick_off_time,
              venue: selectedMatch.venue,
              home_team: {
                id: selectedMatch.is_home ? team.id : selectedMatch.opponent.id,
                name: selectedMatch.is_home ? team.name : selectedMatch.opponent.name,
                batch_code: selectedMatch.is_home ? team.batch_code : selectedMatch.opponent.batch_code,
                color_hex: selectedMatch.is_home ? team.color_hex : selectedMatch.opponent.color_hex,
                photo_url: selectedMatch.is_home ? team.photo_url : selectedMatch.opponent.photo_url,
              },
              away_team: {
                id: selectedMatch.is_home ? selectedMatch.opponent.id : team.id,
                name: selectedMatch.is_home ? selectedMatch.opponent.name : team.name,
                batch_code: selectedMatch.is_home ? selectedMatch.opponent.batch_code : team.batch_code,
                color_hex: selectedMatch.is_home ? selectedMatch.opponent.color_hex : team.color_hex,
                photo_url: selectedMatch.is_home ? selectedMatch.opponent.photo_url : team.photo_url,
              },
            }}
            homeSquad={
              selectedMatch.is_home
                ? Object.entries(selectedSquadMap).map(([pid, s]) => {
                    const p = eligiblePlayers.find((pl: any) => pl.id === Number(pid));
                    return {
                      id: pid,
                      player_id: pid,
                      player_name: p?.full_name || 'Player',
                      jersey_number: s.jersey_number,
                      is_starter: s.is_starter,
                      is_goalkeeper: s.is_goalkeeper,
                      avatar_url: p?.avatar_url,
                    };
                  })
                : []
            }
            awaySquad={
              !selectedMatch.is_home
                ? Object.entries(selectedSquadMap).map(([pid, s]) => {
                    const p = eligiblePlayers.find((pl: any) => pl.id === Number(pid));
                    return {
                      id: pid,
                      player_id: pid,
                      player_name: p?.full_name || 'Player',
                      jersey_number: s.jersey_number,
                      is_starter: s.is_starter,
                      is_goalkeeper: s.is_goalkeeper,
                      avatar_url: p?.avatar_url,
                    };
                  })
                : []
            }
            isOpen={true}
            embedded={true}
            onClose={() => setActiveTab('overview')}
          />
        </div>
      )}

      {/* Application Review Modal */}
      {reviewModal.open && reviewModal.app && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-gloss max-w-md w-full p-6 sm:p-7 rounded-3xl border border-[#2C3960] relative space-y-4">
            <button
              onClick={() => setReviewModal({ open: false, app: null, action: 'APPROVE', jersey: '', reason: '' })}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-white flex items-center gap-2">
              {reviewModal.action === 'APPROVE' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Approve Player for {team?.name}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  Reject Application
                </>
              )}
            </h3>

            <p className="text-xs text-slate-300">
              Player: <span className="font-bold text-white">{reviewModal.app.full_name}</span> ({reviewModal.app.department})
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-1">
              {reviewModal.action === 'APPROVE' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Squad Jersey Number (1-99)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={reviewModal.jersey}
                    onChange={(e) => setReviewModal({ ...reviewModal, jersey: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Must be unique in {team?.name}.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={3}
                    value={reviewModal.reason}
                    onChange={(e) => setReviewModal({ ...reviewModal, reason: e.target.value })}
                    placeholder="Provide constructive feedback for the member..."
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, app: null, action: 'APPROVE', jersey: '', reason: '' })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                    reviewModal.action === 'APPROVE'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-rose-500 text-white hover:bg-rose-600'
                  }`}
                >
                  {submittingReview ? 'Processing...' : reviewModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Profile & Photo Lightbox */}
      {team && (
        <BatchPhotoLightbox
          isOpen={isPhotoLightboxOpen}
          onClose={() => setIsPhotoLightboxOpen(false)}
          batch={team}
          onBatchUpdated={(updated) => {
            setDashboardData((prev: any) => ({
              ...prev,
              team: { ...prev?.team, ...updated },
            }));
          }}
        />
      )}
    </div>
  );
}
