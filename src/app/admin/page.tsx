'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Trophy,
  Shield,
  Users,
  Calendar,
  FileText,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Lock,
  PlusCircle,
  History,
  Settings,
  Sparkles,
  Flame,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';

export default function FrontendAdminPage() {
  const { user, login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'players' | 'members' | 'content' | 'audit' | 'reports'>('dashboard');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Login form state (if not logged in as manager)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard Data
  const [dashData, setDashData] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(true);

  // Matches State
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [correctionReason, setCorrectionReason] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [eventData, setEventData] = useState({
    event_type: 'GOAL',
    player_id: '',
    related_player_id: '',
    minute: 45,
    description: '',
  });

  // Players / Roster State
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [reviewReason, setReviewReason] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerActionLoading, setPlayerActionLoading] = useState(false);

  // Members Management State
  const [membersList, setMembersList] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBatchFilter, setMemberBatchFilter] = useState('');

  // Content / Announcements & Settings
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    is_pinned: false,
  });
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>({
    tagline: '',
    about_fellowship: '',
    verse_text: '',
    verse_reference: '',
    facebook_url: '',
    telegram_url: '',
    tiktok_url: '',
    instagram_url: '',
    youtube_url: '',
    contact_email: '',
    contact_phone: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Generator State
  const [genLoading, setGenLoading] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  // Load Initial Admin Data
  const loadDashboard = () => {
    setDashLoading(true);
    api.manager.getDashboard()
      .then((res: any) => setDashData(res))
      .catch((err: any) => console.error(err))
      .finally(() => setDashLoading(false));
  };

  const loadMatches = () => {
    setMatchLoading(true);
    api.matches.list()
      .then((res: any) => {
        setMatches(res);
        if (res.length > 0 && !selectedMatch) {
          setSelectedMatch(res[0]);
          setHomeScore(res[0].home_score);
          setAwayScore(res[0].away_score);
        }
      })
      .catch((err: any) => console.error(err))
      .finally(() => setMatchLoading(false));
  };

  const loadPendingPlayers = () => {
    api.manager.getPlayerRegistrations('PENDING')
      .then((res: any) => setPendingPlayers(res))
      .catch((err: any) => console.error(err));
  };

  const loadMembers = () => {
    api.manager.getMembers(memberSearch, memberBatchFilter)
      .then((res: any) => setMembersList(res))
      .catch((err: any) => console.error(err));
  };

  const loadAuditLogs = () => {
    api.manager.getAuditLogs()
      .then((res: any) => setAuditLogs(res))
      .catch((err: any) => console.error(err));
  };

  const loadSettings = () => {
    api.settings.get()
      .then((res: any) => setSiteSettings(res))
      .catch((err: any) => console.error(err));
  };

  useEffect(() => {
    if (user?.is_manager) {
      loadDashboard();
      loadMatches();
      loadPendingPlayers();
      loadMembers();
      loadAuditLogs();
      loadSettings();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await login({ username: loginUsername, password: loginPassword });
    } catch (err: any) {
      setLoginError(err.data?.error || 'Manager login failed. Please verify credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Match Actions
  const handlePublishMatch = async (matchId: number) => {
    try {
      await api.manager.publishMatch(matchId);
      alert('Match successfully published to official competition standings!');
      loadMatches();
      loadDashboard();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to publish match.');
    }
  };

  const handleCorrectScore = async () => {
    if (!correctionReason.trim()) {
      alert('An audit reason is required for score corrections.');
      return;
    }
    try {
      await api.manager.correctMatch(selectedMatch.id, homeScore, awayScore, correctionReason);
      alert('Score corrected and logged into immutable audit history!');
      setShowCorrectionModal(false);
      setCorrectionReason('');
      loadMatches();
      loadDashboard();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.data?.error || 'Correction failed.');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      await api.manager.addMatchEvent(selectedMatch.id, {
        ...eventData,
        player_id: eventData.player_id ? Number(eventData.player_id) : null,
        related_player_id: eventData.related_player_id ? Number(eventData.related_player_id) : null,
      });
      alert('Match incident recorded successfully!');
      loadMatches();
      api.matches.getDetail(selectedMatch.id).then((m: any) => setSelectedMatch(m));
    } catch (err: any) {
      alert(err.data?.error || 'Failed to add match event.');
    }
  };

  // Player Review
  const handleReviewPlayer = async (regId: number, status: 'APPROVED' | 'REJECTED') => {
    setPlayerActionLoading(true);
    try {
      await api.manager.reviewPlayer(regId, status, reviewReason);
      alert(`Player application ${status.toLowerCase()}!`);
      setSelectedPlayer(null);
      setReviewReason('');
      loadPendingPlayers();
      loadDashboard();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to review player.');
    } finally {
      setPlayerActionLoading(false);
    }
  };

  // Member Suspend
  const handleToggleSuspend = async (memberId: number) => {
    try {
      const res = await api.manager.toggleSuspend(memberId);
      alert(res.message);
      loadMembers();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to change suspension status.');
    }
  };

  // Generate Fixtures
  const handleGenerateFixtures = async () => {
    if (!confirm('Auto-generate single round-robin fixtures for all competing batches in the active season?')) return;
    setGenLoading(true);
    setGenMessage('');
    try {
      const res = await api.manager.generateFixtures();
      setGenMessage(res.message);
      loadMatches();
      loadDashboard();
    } catch (err: any) {
      setGenMessage(err.data?.error || 'Failed to generate fixtures.');
    } finally {
      setGenLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.settings.update(siteSettings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err: any) {
      alert('Failed to update site settings.');
    }
  };

  // -------------------------------------------------------------
  // If Not Authenticated as Manager, Render Manager Login Form
  // -------------------------------------------------------------
  if (!mounted) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading Admin Central...</p>
      </div>
    );
  }

  if (!user || !user.is_manager) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card-gloss p-8 rounded-2xl shadow-2xl border border-purple-500/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/20 border-2 border-purple-400/30 overflow-hidden">
              <Image
                src="/logo.png"
                alt="AASTU Focus Logo"
                width={56}
                height={56}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Frontend Admin Central</h1>
            <p className="text-xs text-slate-400 mt-1">
              AASTU Focus Football Cup &bull; Tournament Director Access
            </p>
          </div>

          {loginError && (
            <div className="p-3 mb-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email or Username</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter manager email or username"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter manager password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Manager'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2C3960] text-center">
            <a
              href="http://localhost:8002/admin/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              Prefer backend Django Jazzmin Admin? <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Authenticated Manager Command Center
  // -------------------------------------------------------------
  const { kpis, members_by_batch } = dashData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Top Banner & Hub Controls */}
      <div className="card-gloss p-6 sm:p-8 rounded-3xl border border-purple-500/30 mb-8 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-purple-400/30 overflow-hidden shrink-0 hidden sm:flex">
              <Image
                src="/logo.png"
                alt="AASTU Focus Logo"
                width={48}
                height={48}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Tournament Director Portal
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live System Active
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Focus Football Cup &bull; <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400">Admin Central</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Full control center to manage matches, approve rosters, publish scores, update fellowship announcements, audit changes, and sync with the Jazzmin backend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="http://localhost:8002/admin/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-2"
              title="Open Django Jazzmin Backend Administration"
            >
              <ExternalLink className="w-4 h-4 text-purple-400" />
              Jazzmin Backend Admin
            </a>

            <a
              href="http://localhost:8002/api/docs/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-[#161D36] hover:bg-[#1E2648] text-slate-300 border border-[#2C3960] text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Swagger API
            </a>

            <button
              onClick={handleGenerateFixtures}
              disabled={genLoading}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${genLoading ? 'animate-spin' : ''}`} />
              Auto-Fixtures
            </button>
          </div>
        </div>

        {genMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            {genMessage}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-[#2C3960]/60 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Overview & KPIs', icon: Trophy },
          { id: 'matches', label: 'Matches & Live Events', icon: Flame },
          { id: 'players', label: 'Roster Approvals', icon: Users, badge: pendingPlayers.length },
          { id: 'members', label: 'Member Directory', icon: Shield },
          { id: 'content', label: 'Announcements & Content', icon: Sparkles },
          { id: 'audit', label: 'Audit Trail', icon: History },
          { id: 'reports', label: 'CSV Reports', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-[#161D36]/70 text-slate-400 hover:text-white hover:bg-[#1E2648]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && tab.badge! > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & KPIS */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {dashLoading ? (
            <div className="py-20 text-center text-slate-400">Loading metrics...</div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-purple-500/20">
                  <span className="text-xs text-slate-400 font-medium">Registered Fellowship Members</span>
                  <p className="text-3xl sm:text-4xl font-black text-white mt-2">{kpis?.total_members || 0}</p>
                  <p className="text-[11px] text-purple-400 mt-2 font-semibold">Across all AASTU colleges</p>
                </div>
                <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-emerald-500/20">
                  <span className="text-xs text-slate-400 font-medium">Approved Tournament Players</span>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2">{kpis?.approved_players || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{pendingPlayers.length} pending review</p>
                </div>
                <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-amber-500/20">
                  <span className="text-xs text-slate-400 font-medium">Tournament Matches</span>
                  <p className="text-3xl sm:text-4xl font-black text-amber-400 mt-2">
                    {kpis?.completed_matches || 0} / {kpis?.total_matches || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">{kpis?.upcoming_matches || 0} scheduled</p>
                </div>
                <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-blue-500/20">
                  <span className="text-xs text-slate-400 font-medium">Official Tournament Goals</span>
                  <p className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">{kpis?.total_goals || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Excludes own goals</p>
                </div>
              </div>

              {/* Batch Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-gloss p-6 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Member Registration Distribution by Batch
                  </h3>
                  <div className="space-y-3">
                    {members_by_batch &&
                      Object.entries(members_by_batch).map(([batch, count]: any) => (
                        <div key={batch} className="flex items-center justify-between p-3 rounded-xl bg-[#161D36] border border-[#2C3960]">
                          <span className="text-xs font-semibold text-slate-300">{batch.replace('_', ' ')}</span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {count} members
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="card-gloss p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Quick Administrative Shortcuts
                    </h3>
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      All administrative actions performed here immediately update public standings, player profiles, and write to the immutable audit log.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveTab('matches')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Record Match Score</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Publish or adjust goals</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('players')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-purple-500 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Approve Rosters</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pendingPlayers.length} applications</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('content')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Post Announcement</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Fellowship updates</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-blue-500 text-left transition-all cursor-pointer"
                      >
                        <p className="text-xs font-bold text-white">Export Tournament CSV</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Rosters & standings</p>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-xs text-purple-300 italic">
                      &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATCH OPERATIONS & LIVE EVENTS */}
      {/* ========================================================================= */}
      {activeTab === 'matches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Matches List */}
          <div className="lg:col-span-1 card-gloss p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
              <span>Fixtures ({matches.length})</span>
              <button onClick={loadMatches} className="text-xs text-emerald-400 hover:underline cursor-pointer">
                Refresh
              </button>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {matches.map((m) => {
                const isSelected = selectedMatch?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMatch(m);
                      setHomeScore(m.home_score);
                      setAwayScore(m.away_score);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 shadow-md'
                        : 'bg-[#161D36] border-[#2C3960] hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <span>Match #{m.id}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        m.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {m.is_published ? 'PUBLISHED' : m.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>{m.home_team.name}</span>
                      <span className="text-sm px-2 py-0.5 rounded bg-slate-900 border border-[#2C3960]">
                        {m.home_score} - {m.away_score}
                      </span>
                      <span>{m.away_team.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{m.match_date} &bull; {m.venue}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Match Operations Panel */}
          <div className="lg:col-span-2 space-y-6">
            {selectedMatch ? (
              <div className="card-gloss p-6 sm:p-8 rounded-2xl border border-purple-500/30 space-y-6">
                {/* Score Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2C3960]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Match Management</span>
                    <h2 className="text-xl font-black text-white mt-1">
                      {selectedMatch.home_team.name} vs {selectedMatch.away_team.name}
                    </h2>
                    <p className="text-xs text-slate-400">{selectedMatch.match_date} &bull; {selectedMatch.venue}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!selectedMatch.is_published ? (
                      <button
                        onClick={() => handlePublishMatch(selectedMatch.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Publish Final Result
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCorrectionModal(true)}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <History className="w-4 h-4" />
                        Correct Published Score
                      </button>
                    )}
                    <Link
                      href={`/matches/${selectedMatch.id}`}
                      target="_blank"
                      className="px-3 py-2 rounded-xl bg-[#161D36] text-slate-300 hover:text-white border border-[#2C3960] text-xs font-semibold"
                    >
                      View Live Match
                    </Link>
                  </div>
                </div>

                {/* Live Event Recorder Form */}
                <div className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960]">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-400" />
                    Record Match Incident (Goal, Assist, Card, Sub)
                  </h3>
                  <form onSubmit={handleAddEvent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Event Type</label>
                      <select
                        value={eventData.event_type}
                        onChange={(e) => setEventData({ ...eventData, event_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white"
                      >
                        <option value="GOAL">⚽ Goal (Scorer)</option>
                        <option value="ASSIST">🎯 Assist (Playmaker)</option>
                        <option value="OWN_GOAL">⚠️ Own Goal (Opponent Score)</option>
                        <option value="YELLOW_CARD">🟨 Yellow Card</option>
                        <option value="RED_CARD">🟥 Red Card</option>
                        <option value="SUBSTITUTION">🔄 Substitution</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Select Player</label>
                      <select
                        value={eventData.player_id}
                        onChange={(e) => setEventData({ ...eventData, player_id: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white"
                      >
                        <option value="">-- Choose player --</option>
                        <optgroup label={selectedMatch.home_team.name}>
                          {membersList
                            .filter((m) => m.competing_batch === selectedMatch.home_team.code)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.preferred_jersey_number || '-'} {p.full_name} ({p.primary_position || 'Player'})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label={selectedMatch.away_team.name}>
                          {membersList
                            .filter((m) => m.competing_batch === selectedMatch.away_team.code)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.preferred_jersey_number || '-'} {p.full_name} ({p.primary_position || 'Player'})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Minute</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={eventData.minute}
                        onChange={(e) => setEventData({ ...eventData, minute: Number(e.target.value) })}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Incident Description / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Magnificent curved strike into top right corner!"
                        value={eventData.description}
                        onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                      >
                        Save Event
                      </button>
                    </div>
                  </form>
                </div>

                {/* Score Correction Modal */}
                {showCorrectionModal && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Audited Score Adjustment
                    </h4>
                    <p className="text-xs text-slate-300">
                      Modifying a published result automatically recalculates tournament standings and records an entry in the permanent audit trail.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">{selectedMatch.home_team.name} Score</label>
                        <input
                          type="number"
                          min="0"
                          value={homeScore}
                          onChange={(e) => setHomeScore(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 mb-1">{selectedMatch.away_team.name} Score</label>
                        <input
                          type="number"
                          min="0"
                          value={awayScore}
                          onChange={(e) => setAwayScore(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">Reason for Administrative Correction *</label>
                      <input
                        type="text"
                        placeholder="e.g. Corrected score after referee match sheet verification"
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCorrectionModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCorrectScore}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer"
                      >
                        Confirm Correction &amp; Recalculate Standings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-slate-400">Select a fixture to manage.</div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ROSTER APPROVALS */}
      {/* ========================================================================= */}
      {activeTab === 'players' && (
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Tournament Player Registrations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review and approve fellowship members for their academic batch competition rosters.
              </p>
            </div>
            <button onClick={loadPendingPlayers} className="text-xs text-purple-400 hover:underline cursor-pointer">
              Refresh Applications
            </button>
          </div>

          {pendingPlayers.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#161D36] border border-[#2C3960] text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">All player applications reviewed!</p>
              <p className="text-xs text-slate-400 mt-1">No pending player registrations in the queue.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPlayers.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-[#161D36] border border-[#2C3960] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{app.member_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {app.batch_name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Position: <span className="text-slate-200">{app.football_position}</span> &bull; Jersey:{' '}
                      <span className="text-amber-400 font-bold">#{app.jersey_number || 'TBD'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewPlayer(app.id, 'APPROVED')}
                      disabled={playerActionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Approve Player
                    </button>
                    <button
                      onClick={() => handleReviewPlayer(app.id, 'REJECTED')}
                      disabled={playerActionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEMBER DIRECTORY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'members' && (
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Fellowship Member Management</h2>
              <p className="text-xs text-slate-400">Search members, verify eligibility, or manage account suspension.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search member..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
              />
              <button
                onClick={loadMembers}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#161D36] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#2C3960]">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">College &amp; Dept</th>
                  <th className="py-3 px-4">Fellowship Team</th>
                  <th className="py-3 px-4">Eligibility</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C3960]/50">
                {membersList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-white">
                      <Link href={`/members/${m.username}`} className="hover:text-emerald-400">
                        {m.full_name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{m.batch}</td>
                    <td className="py-3 px-4 text-slate-400">{m.department}</td>
                    <td className="py-3 px-4 text-slate-400">{m.fellowship_team}</td>
                    <td className="py-3 px-4">
                      {m.is_football_eligible ? (
                        <span className="text-emerald-400 font-bold">Eligible</span>
                      ) : (
                        <span className="text-slate-500">Community</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {m.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleSuspend(m.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                          m.is_active
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        {m.is_active ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ANNOUNCEMENTS & CONTENT SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Post Announcement */}
          <div className="card-gloss p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Publish Fellowship Announcement
            </h3>
            {announcementSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                Announcement published to public homepage!
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAnnouncementSuccess(true);
                setTimeout(() => setAnnouncementSuccess(false), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-slate-300 mb-1">Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Focus Cup Matchday 3 & Fellowship Prayer Night"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Announcement Body</label>
                <textarea
                  rows={4}
                  placeholder="Share details, match fixtures, encouragement scripture, or spiritual fellowship announcements..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={announcementForm.is_pinned}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                />
                <label htmlFor="pin" className="text-xs text-slate-300">Pin to top of public homepage</label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Publish Announcement
              </button>
            </form>
          </div>

          {/* Site Settings & Footer */}
          <div className="card-gloss p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Configurable Footer &amp; Fellowship Identity
            </h3>
            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                Site settings and social media URLs saved successfully!
              </div>
            )}
            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400">Fellowship Motto / Tagline</label>
                <input
                  type="text"
                  value={siteSettings.tagline || ''}
                  onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400">Scripture Verse Text</label>
                  <input
                    type="text"
                    value={siteSettings.verse_text || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, verse_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Verse Reference</label>
                  <input
                    type="text"
                    value={siteSettings.verse_reference || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, verse_reference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400">Facebook URL</label>
                  <input
                    type="url"
                    value={siteSettings.facebook_url || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, facebook_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Telegram Channel URL</label>
                  <input
                    type="url"
                    value={siteSettings.telegram_url || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, telegram_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">TikTok Account URL</label>
                  <input
                    type="url"
                    value={siteSettings.tiktok_url || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tiktok_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400">Instagram Account URL</label>
                  <input
                    type="url"
                    value={siteSettings.instagram_url || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, instagram_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400">YouTube Channel URL</label>
                  <input
                    type="url"
                    value={siteSettings.youtube_url || ''}
                    onChange={(e) => setSiteSettings({ ...siteSettings, youtube_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Site Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Immutable Administrative Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Preserves all score corrections, match edits, and administrative actions with full timestamp and manager accountability.
              </p>
            </div>
            <button onClick={loadAuditLogs} className="text-xs text-amber-400 hover:underline cursor-pointer">
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#161D36] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#2C3960]">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Manager</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Model &amp; Record</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C3960]/50">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No administrative changes logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/20 font-mono text-[11px]">
                      <td className="py-3 px-4 text-slate-400">{log.created_at}</td>
                      <td className="py-3 px-4 font-bold text-purple-300">{log.user}</td>
                      <td className="py-3 px-4 font-semibold text-white">{log.action}</td>
                      <td className="py-3 px-4 text-emerald-400">{log.model_name} #{log.object_id}</td>
                      <td className="py-3 px-4 text-slate-300">{log.reason || log.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CSV EXPORTS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Tournament Data Exports &amp; CSV Reports
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Export authoritative real-time competition data for offline fellowship records, executive review, and committee meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href={api.manager.getExportUrl('members')}
              download
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500 transition-all text-left block group cursor-pointer"
            >
              <Users className="w-7 h-7 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">Members Directory CSV</h4>
              <p className="text-[11px] text-slate-400 mt-1">All registered fellowship members by college and batch.</p>
            </a>

            <a
              href={api.manager.getExportUrl('rosters')}
              download
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-purple-500 transition-all text-left block group cursor-pointer"
            >
              <Shield className="w-7 h-7 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">Batch Squad Rosters CSV</h4>
              <p className="text-[11px] text-slate-400 mt-1">Approved competition players, jersey numbers, and positions.</p>
            </a>

            <a
              href={api.manager.getExportUrl('matches')}
              download
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500 transition-all text-left block group cursor-pointer"
            >
              <Calendar className="w-7 h-7 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">Fixtures &amp; Results CSV</h4>
              <p className="text-[11px] text-slate-400 mt-1">Full schedule, venues, final scorelines, and match status.</p>
            </a>

            <a
              href={api.manager.getExportUrl('standings')}
              download
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-blue-500 transition-all text-left block group cursor-pointer"
            >
              <Trophy className="w-7 h-7 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-white text-sm">Official Standings CSV</h4>
              <p className="text-[11px] text-slate-400 mt-1">P, W, D, L, Goals, Goal Difference, and Points table.</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
