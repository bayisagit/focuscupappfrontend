'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Trophy,
  Shield,
  ShieldCheck,
  BarChart3,
  GraduationCap,
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
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

const isPlayerInBatchTeam = (player: any, team: any) => {
  if (!player || !team) return false;
  const teamBatchCode = String(team.batch_code || team.code || '').trim();
  const teamName = String(team.name || '').toLowerCase().trim();

  if (player.competing_batch && teamBatchCode && player.competing_batch === teamBatchCode) {
    return true;
  }
  if (player.batch_code && teamBatchCode && player.batch_code === teamBatchCode) {
    return true;
  }
  if (player.batch && teamName && (teamName.includes(player.batch.toLowerCase()) || player.batch.toLowerCase().includes(teamName))) {
    return true;
  }
  if (player.academic_year && teamName && teamName.includes(player.academic_year.toLowerCase())) {
    return true;
  }
  const matchTeamDigit = teamBatchCode.match(/\d/)?.[0] || teamName.match(/\d/)?.[0];
  const matchPlayerDigit = (player.competing_batch || player.batch_code || player.batch || player.academic_year || '').match(/\d/)?.[0];
  if (matchTeamDigit && matchPlayerDigit && matchTeamDigit === matchPlayerDigit) {
    return true;
  }
  return false;
};

export default function FrontendAdminPage() {
  const { user, login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'create-fixture' | 'players' | 'members' | 'content' | 'audit' | 'reports'>('dashboard');

  // Collapsible Sidebar States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [matchOpsOpen, setMatchOpsOpen] = useState(true);
  const [rosterOpsOpen, setRosterOpsOpen] = useState(true);
  const [governanceOpen, setGovernanceOpen] = useState(false);

  // Custom Fixture Creation State
  const [batchTeams, setBatchTeams] = useState<any[]>([]);
  const [customFixture, setCustomFixture] = useState({
    home_team_id: '',
    away_team_id: '',
    stage_or_round_name: 'Grand Final',
    round_number: 4,
    match_date: new Date().toISOString().split('T')[0],
    kick_off_time: '16:00',
    venue: 'AASTU Main Football Field',
    notes: '',
  });
  const [customFixtureLoading, setCustomFixtureLoading] = useState(false);
  const [customFixtureSuccess, setCustomFixtureSuccess] = useState('');
  const [customFixtureError, setCustomFixtureError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Login form state (if not logged in as manager)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
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
    team_id: '',
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
        const list = Array.isArray(res) ? res : res?.results || [];
        setMatches(list);
        if (list.length > 0) {
          setSelectedMatch((prev: any) => {
            if (prev) {
              const found = list.find((m: any) => m.id === prev.id);
              if (found) return found;
            }
            setHomeScore(list[0].home_score);
            setAwayScore(list[0].away_score);
            return list[0];
          });
        }
      })
      .catch((err: any) => {
        console.error(err);
        setMatches([]);
      })
      .finally(() => setMatchLoading(false));
  };

  const loadPendingPlayers = () => {
    api.manager.getPlayerRegistrations('PENDING')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || [];
        setPendingPlayers(list);
      })
      .catch((err: any) => {
        console.error(err);
        setPendingPlayers([]);
      });
  };

  const loadMembers = (overrideBatch?: string, overrideSearch?: string) => {
    const batch = typeof overrideBatch === 'string' ? overrideBatch : memberBatchFilter;
    const search = typeof overrideSearch === 'string' ? overrideSearch : memberSearch;
    api.manager.getMembers(search, batch)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || [];
        setMembersList(list);
      })
      .catch((err: any) => {
        console.error(err);
        setMembersList([]);
      });
  };

  const handleBatchClick = (rawBatch: string) => {
    const clean = String(rawBatch || '').replace('_', ' ').trim();
    setMemberBatchFilter(clean);
    loadMembers(clean, memberSearch);
    setActiveTab('members');
  };

  const loadAuditLogs = () => {
    api.manager.getAuditLogs()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || [];
        setAuditLogs(list);
      })
      .catch((err: any) => {
        console.error(err);
        setAuditLogs([]);
      });
  };

  const loadSettings = () => {
    api.settings.get()
      .then((res: any) => setSiteSettings(res))
      .catch((err: any) => console.error(err));
  };

  const loadBatchTeams = () => {
    api.competitions.getBatches()
      .then((res: any) => {
        const list = res.results || res || [];
        setBatchTeams(list);
        if (list.length >= 2 && !customFixture.home_team_id) {
          setCustomFixture((prev) => ({
            ...prev,
            home_team_id: String(list[0].id),
            away_team_id: String(list[1].id),
          }));
        }
      })
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
      loadBatchTeams();
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

  const handleSelectMatch = (m: any) => {
    setSelectedMatch(m);
    setHomeScore(m.home_score);
    setAwayScore(m.away_score);
    setEventData((prev) => ({
      ...prev,
      team_id: String(m.home_team.id),
      player_id: '',
      related_player_id: '',
    }));
    api.matches.getDetail(m.id).then((detailed: any) => {
      if (detailed) {
        setSelectedMatch(detailed);
        setHomeScore(detailed.home_score);
        setAwayScore(detailed.away_score);
      }
    }).catch((err) => console.error(err));
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const teamIdToUse = eventData.team_id || String(selectedMatch.home_team.id);

    try {
      const res = await api.manager.addMatchEvent(selectedMatch.id, {
        event_type: eventData.event_type,
        team_id: Number(teamIdToUse),
        player_id: eventData.player_id ? Number(eventData.player_id) : null,
        related_player_id: eventData.related_player_id ? Number(eventData.related_player_id) : null,
        minute: Number(eventData.minute) || 1,
        description: eventData.description,
      });
      alert(res.message || 'Match incident recorded successfully!');
      setEventData((prev) => ({
        ...prev,
        player_id: '',
        related_player_id: '',
        description: '',
      }));
      loadMatches();
      loadDashboard();
      api.matches.getDetail(selectedMatch.id).then((detailed: any) => {
        setSelectedMatch(detailed);
        setHomeScore(detailed.home_score);
        setAwayScore(detailed.away_score);
      });
    } catch (err: any) {
      alert(err.data?.error || 'Failed to add match event.');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!selectedMatch) return;
    if (!confirm('Are you sure you want to delete this recorded incident? If it was a goal, the official match score will automatically be rolled back.')) return;
    try {
      const res = await api.manager.deleteMatchEvent(selectedMatch.id, eventId);
      alert(res.message || 'Event deleted successfully.');
      loadMatches();
      loadDashboard();
      api.matches.getDetail(selectedMatch.id).then((detailed: any) => {
        setSelectedMatch(detailed);
        setHomeScore(detailed.home_score);
        setAwayScore(detailed.away_score);
      });
    } catch (err: any) {
      alert(err.data?.error || 'Failed to delete event.');
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

  // Member Suspend & Management
  const handleToggleSuspend = async (memberId: number) => {
    try {
      const res = await api.manager.toggleSuspend(memberId);
      alert(res.message);
      loadMembers(memberBatchFilter, memberSearch);
      loadAuditLogs();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to change suspension status.');
    }
  };

  // Member Permanent Delete
  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete member "${memberName}"? This will permanently remove their user account, player registrations, and profile. This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.manager.deleteMember(memberId);
      alert(res.message || 'Member deleted permanently.');
      loadMembers(memberBatchFilter, memberSearch);
      loadDashboard();
      loadAuditLogs();
    } catch (err: any) {
      alert(err.data?.error || err.message || 'Failed to delete member.');
    }
  };

  // Create Custom Fixture (Finals, Semi-finals, Special Matchdays)
  const handleCreateCustomFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomFixtureLoading(true);
    setCustomFixtureSuccess('');
    setCustomFixtureError('');

    try {
      const res = await api.manager.createFixture({
        home_team_id: customFixture.home_team_id,
        away_team_id: customFixture.away_team_id,
        stage_or_round_name: customFixture.stage_or_round_name,
        round_number: Number(customFixture.round_number) || 1,
        match_date: customFixture.match_date,
        kick_off_time: customFixture.kick_off_time,
        venue: customFixture.venue,
        notes: customFixture.notes,
      });
      setCustomFixtureSuccess(res.message || 'Custom fixture created successfully!');
      loadMatches();
      loadDashboard();
      loadAuditLogs();
      setTimeout(() => {
        setActiveTab('matches');
      }, 1800);
    } catch (err: any) {
      setCustomFixtureError(err.data?.error || 'Failed to create fixture. Please check all fields.');
    } finally {
      setCustomFixtureLoading(false);
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
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter manager password"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-400 transition-colors p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
    <div className="min-h-screen bg-[#070D1E] flex flex-col md:flex-row relative">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Collapsible Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-50 bg-[#0B132B]/95 backdrop-blur-xl border-r border-[#2C3960] flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2C3960]/80 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'hidden md:hidden' : 'flex'}`}>
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-white leading-tight">Focus Cup Admin</p>
              <p className="text-[10px] text-purple-400 font-semibold tracking-wide">Command Center</p>
            </div>
          </div>

          {/* Collapsed Logo view */}
          {sidebarCollapsed && (
            <div className="w-9 h-9 rounded-xl bg-white p-1 hidden md:flex items-center justify-center shrink-0 shadow-md mx-auto">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-full h-full object-contain" />
            </div>
          )}

          {/* Toggle buttons */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Section: Overview */}
          <div>
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#161D36]'
              }`}
              title="Overview & Metrics"
            >
              <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
              {!sidebarCollapsed && <span>Overview &amp; Metrics</span>}
            </button>
          </div>

          {/* Section: Match Operations (Dropdown) */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <button
                onClick={() => setMatchOpsOpen(!matchOpsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> Match Operations
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${matchOpsOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="border-t border-[#2C3960]/60 my-2" />
            )}

            {(matchOpsOpen || sidebarCollapsed) && (
              <div className={`space-y-1 ${!sidebarCollapsed ? 'pl-2 border-l border-[#2C3960]/60 ml-2' : ''}`}>
                <button
                  onClick={() => { setActiveTab('matches'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'matches'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Matches & Live Events"
                >
                  <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!sidebarCollapsed && <span>Live Scores &amp; Events</span>}
                </button>

                <button
                  onClick={() => { setActiveTab('create-fixture'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'create-fixture'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Create Custom Fixture"
                >
                  <PlusCircle className="w-4 h-4 text-purple-400 shrink-0" />
                  {!sidebarCollapsed && <span>Create Custom Fixture</span>}
                </button>

                <Link
                  href="/fixtures"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161D36] transition-all"
                  title="Public Fixtures Page"
                >
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!sidebarCollapsed && <span>Public Fixtures</span>}
                </Link>
              </div>
            )}
          </div>

          {/* Section: Roster & Members (Dropdown) */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <button
                onClick={() => setRosterOpsOpen(!rosterOpsOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Roster &amp; Members
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${rosterOpsOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="border-t border-[#2C3960]/60 my-2" />
            )}

            {(rosterOpsOpen || sidebarCollapsed) && (
              <div className={`space-y-1 ${!sidebarCollapsed ? 'pl-2 border-l border-[#2C3960]/60 ml-2' : ''}`}>
                <button
                  onClick={() => { setActiveTab('players'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'players'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Roster Approvals"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-blue-400 shrink-0" />
                    {!sidebarCollapsed && <span>Roster Approvals</span>}
                  </div>
                  {pendingPlayers.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black">
                      {pendingPlayers.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('members'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'members'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Member Directory"
                >
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!sidebarCollapsed && <span>Member Directory</span>}
                </button>

                <Link
                  href="/batches"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161D36] transition-all"
                  title="Batch Squads"
                >
                  <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                  {!sidebarCollapsed && <span>Batch Squads</span>}
                </Link>
              </div>
            )}
          </div>

          {/* Section: Administration & Reports (Dropdown) */}
          <div className="space-y-1">
            {!sidebarCollapsed ? (
              <button
                onClick={() => setGovernanceOpen(!governanceOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Governance
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${governanceOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <div className="border-t border-[#2C3960]/60 my-2" />
            )}

            {(governanceOpen || sidebarCollapsed) && (
              <div className={`space-y-1 ${!sidebarCollapsed ? 'pl-2 border-l border-[#2C3960]/60 ml-2' : ''}`}>
                <button
                  onClick={() => { setActiveTab('content'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'content'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Announcements & Content"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {!sidebarCollapsed && <span>Announcements</span>}
                </button>

                <button
                  onClick={() => { setActiveTab('audit'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Audit Trail"
                >
                  <History className="w-4 h-4 text-purple-400 shrink-0" />
                  {!sidebarCollapsed && <span>Audit Trail</span>}
                </button>

                <button
                  onClick={() => { setActiveTab('reports'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="CSV Reports"
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!sidebarCollapsed && <span>CSV Exports</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer (Backend Links) */}
        <div className="p-3 border-t border-[#2C3960]/80 space-y-1 text-xs">
          <a
            href="http://localhost:8002/admin/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-300 hover:bg-purple-500/15 transition-all font-semibold"
            title="Django Jazzmin Admin"
          >
            <ExternalLink className="w-4 h-4 shrink-0 text-purple-400" />
            {!sidebarCollapsed && <span>Jazzmin Backend</span>}
          </a>
          <a
            href="http://localhost:8002/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161D36] transition-all font-semibold"
            title="Swagger API Docs"
          >
            <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
            {!sidebarCollapsed && <span>Swagger API</span>}
          </a>
        </div>
      </aside>

      {/* Main Administrative Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#070D1E]/95 backdrop-blur-md border-b border-[#2C3960]/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                  Director Command Center
                </span>
                <span className="hidden sm:inline text-slate-600">&bull;</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live System Active
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight capitalize">
                {activeTab === 'dashboard' && 'Command Center Overview & KPIs'}
                {activeTab === 'matches' && 'Live Match Scores & Incident Logging'}
                {activeTab === 'create-fixture' && 'Create Custom Tournament Fixture'}
                {activeTab === 'players' && 'Tournament Player Roster Approvals'}
                {activeTab === 'members' && 'Fellowship Members Directory'}
                {activeTab === 'content' && 'Announcements & Identity Configuration'}
                {activeTab === 'audit' && 'Immutable Audit Trail & System Logs'}
                {activeTab === 'reports' && 'Official Tournament CSV Data Exports'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('create-fixture')}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Fixture</span>
            </button>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1">

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
                <div
                  onClick={() => {
                    setMemberBatchFilter('');
                    loadMembers('', '');
                    setActiveTab('members');
                  }}
                  className="card-gloss p-5 sm:p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/80 hover:bg-[#1C2541] transition-all cursor-pointer group shadow-lg"
                  title="Click to view Member Directory"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium group-hover:text-purple-300 transition-colors">Registered Fellowship Members</span>
                    <span className="text-[10px] text-purple-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      View &rarr;
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-white mt-2 group-hover:text-purple-300 transition-colors">{kpis?.total_members || 0}</p>
                  <p className="text-[11px] text-purple-400 mt-2 font-semibold">Across all AASTU colleges &bull; Click to open directory</p>
                </div>

                <div
                  onClick={() => setActiveTab('players')}
                  className="card-gloss p-5 sm:p-6 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/80 hover:bg-[#1C2541] transition-all cursor-pointer group shadow-lg"
                  title="Click to view Player Rosters & Review Applications"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium group-hover:text-emerald-300 transition-colors">Approved Tournament Players</span>
                    <span className="text-[10px] text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Review &rarr;
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-2">{kpis?.approved_players || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    <span className="text-amber-400 font-semibold">{pendingPlayers.length} pending review</span> &bull; Click to manage
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('matches')}
                  className="card-gloss p-5 sm:p-6 rounded-2xl border border-amber-500/20 hover:border-amber-500/80 hover:bg-[#1C2541] transition-all cursor-pointer group shadow-lg"
                  title="Click to manage Fixtures & Live Match Events"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium group-hover:text-amber-300 transition-colors">Tournament Matches</span>
                    <span className="text-[10px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Scores &rarr;
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-amber-400 mt-2">
                    {kpis?.completed_matches || 0} / {kpis?.total_matches || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    <span className="text-emerald-400 font-semibold">{kpis?.upcoming_matches || 0} scheduled</span> &bull; Click to record scores
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab('matches')}
                  className="card-gloss p-5 sm:p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/80 hover:bg-[#1C2541] transition-all cursor-pointer group shadow-lg"
                  title="Click to view and manage Goal Events"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium group-hover:text-blue-300 transition-colors">Official Tournament Goals</span>
                    <span className="text-[10px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Events &rarr;
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">{kpis?.total_goals || 0}</p>
                  <p className="text-[11px] text-slate-400 mt-2">Excludes own goals &bull; Click to manage events</p>
                </div>
              </div>

              {/* Batch Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-gloss p-6 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Member Registration Distribution by Batch
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(members_by_batch) ? (
                      members_by_batch.map((b: any, idx: number) => (
                        <div
                          key={b.batch || idx}
                          onClick={() => handleBatchClick(b.batch || '')}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/60 hover:bg-[#1E294B] transition-all cursor-pointer group"
                          title={`Click to view ${String(b.batch || 'Batch').replace('_', ' ')} members in directory`}
                        >
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                            <span>{String(b.batch || 'Batch').replace('_', ' ')}</span>
                            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View Members &rarr;</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40">
                            {b.count} members
                          </span>
                        </div>
                      ))
                    ) : members_by_batch && typeof members_by_batch === 'object' ? (
                      Object.entries(members_by_batch).map(([batch, count]: any) => (
                        <div
                          key={batch}
                          onClick={() => handleBatchClick(batch)}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/60 hover:bg-[#1E294B] transition-all cursor-pointer group"
                          title={`Click to view ${batch.replace('_', ' ')} members in directory`}
                        >
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                            <span>{batch.replace('_', ' ')}</span>
                            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">View Members &rarr;</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40">
                            {typeof count === 'object' && count !== null ? count.count : count} members
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No batch distribution data.</p>
                    )}
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
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500 hover:bg-[#1E294B] text-left transition-all cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white group-hover:text-emerald-300">Record Match Score</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Publish or adjust goals &rarr;</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('players')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-purple-500 hover:bg-[#1E294B] text-left transition-all cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white group-hover:text-purple-300">Approve Rosters</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pendingPlayers.length} applications &rarr;</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('content')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500 hover:bg-[#1E294B] text-left transition-all cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white group-hover:text-amber-300">Post Announcement</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Fellowship updates &rarr;</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="p-3.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-blue-500 hover:bg-[#1E294B] text-left transition-all cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-white group-hover:text-blue-300">Export Tournament CSV</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Rosters &amp; standings &rarr;</p>
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
              <span>Fixtures ({Array.isArray(matches) ? matches.length : 0})</span>
              <button onClick={loadMatches} className="text-xs text-emerald-400 hover:underline cursor-pointer">
                Refresh
              </button>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {Array.isArray(matches) && matches.length > 0 ? (
                matches.map((m) => {
                  const isSelected = selectedMatch?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMatch(m)}
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
                      <p className="text-[10px] text-slate-400 mt-1.5">{m.match_date} &bull; {m.venue}</p>
                    </div>
                  );
                })
              ) : (
                <div className="card-gloss p-8 rounded-xl text-center text-xs text-slate-400">
                  {matchLoading ? 'Loading fixtures...' : 'No matches found.'}
                </div>
              )}
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
                  </div>
                </div>

                {/* Live Event Recorder Form */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#2C3960]/60 pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      Record Match Incident / Event
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Live Score: <strong className="text-white">{selectedMatch.home_team.name} {selectedMatch.home_score} - {selectedMatch.away_score} {selectedMatch.away_team.name}</strong>
                    </span>
                  </div>

                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Event Type */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Incident Type <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={eventData.event_type}
                          onChange={(e) => setEventData({ ...eventData, event_type: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value="GOAL">⚽ Goal Scored</option>
                          <option value="ASSIST">🎯 Goal Assist</option>
                          <option value="OWN_GOAL">⚠️ Own Goal (Conceded)</option>
                          <option value="YELLOW_CARD">🟨 Yellow Card</option>
                          <option value="RED_CARD">🟥 Red Card</option>
                          <option value="SUBSTITUTION">🔄 Substitution</option>
                        </select>
                      </div>

                      {/* Batch Team Selector */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Batch Team <span className="text-rose-400">*</span>
                        </label>
                        <select
                          value={eventData.team_id || String(selectedMatch.home_team.id)}
                          onChange={(e) => {
                            const newTeamId = e.target.value;
                            setEventData({
                              ...eventData,
                              team_id: newTeamId,
                              player_id: '',
                              related_player_id: '',
                            });
                          }}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                        >
                          <option value={selectedMatch.home_team.id}>
                            {selectedMatch.home_team.name} ({selectedMatch.home_team.nickname || 'Home'})
                          </option>
                          <option value={selectedMatch.away_team.id}>
                            {selectedMatch.away_team.name} ({selectedMatch.away_team.nickname || 'Away'})
                          </option>
                        </select>
                      </div>

                      {/* Minute */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Match Minute (&apos;) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={eventData.minute}
                          onChange={(e) => setEventData({ ...eventData, minute: Number(e.target.value) })}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {/* Player & Assister Selectors (Strictly filtered to the selected Batch Team) */}
                      {(() => {
                        const isAway = String(eventData.team_id) === String(selectedMatch.away_team.id);
                        const currentTeam = isAway ? selectedMatch.away_team : selectedMatch.home_team;
                        const currentBatchPlayers = (Array.isArray(membersList) ? membersList : []).filter((p) =>
                          isPlayerInBatchTeam(p, currentTeam)
                        );

                        return (
                          <>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Player ({currentTeam.name}) <span className="text-rose-400">*</span>
                              </label>
                              <select
                                value={eventData.player_id}
                                onChange={(e) => setEventData({ ...eventData, player_id: e.target.value })}
                                required
                                className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="">Select registered {currentTeam.name} player...</option>
                                {currentBatchPlayers.length > 0 ? (
                                  currentBatchPlayers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      #{p.preferred_jersey_number || '-'} {p.full_name} ({p.department ? `${p.department} · ` : ''}{p.primary_position || 'Player'})
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>No registered players found for {currentTeam.name}</option>
                                )}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Assister / Subbed Player ({currentTeam.name} - Optional)
                              </label>
                              <select
                                value={eventData.related_player_id}
                                onChange={(e) => setEventData({ ...eventData, related_player_id: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="">None / N/A</option>
                                {currentBatchPlayers.map((p) => (
                                  <option key={p.id} value={p.id} disabled={String(p.id) === String(eventData.player_id)}>
                                    #{p.preferred_jersey_number || '-'} {p.full_name} {p.department ? `(${p.department})` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        );
                      })()}

                      {/* Description */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Event Note / Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Free-kick into top corner"
                          value={eventData.description}
                          onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Dynamic Impact & Score Explanation Banner */}
                    {(() => {
                      const activeTeamId = Number(eventData.team_id || selectedMatch.home_team.id);
                      const isHome = activeTeamId === selectedMatch.home_team.id;
                      const activeTeamName = isHome ? selectedMatch.home_team.name : selectedMatch.away_team.name;
                      const opponentTeamName = isHome ? selectedMatch.away_team.name : selectedMatch.home_team.name;
                      const projectedHomeScore = eventData.event_type === 'GOAL'
                        ? (isHome ? selectedMatch.home_score + 1 : selectedMatch.home_score)
                        : (eventData.event_type === 'OWN_GOAL' ? (isHome ? selectedMatch.home_score : selectedMatch.home_score + 1) : selectedMatch.home_score);
                      const projectedAwayScore = eventData.event_type === 'GOAL'
                        ? (isHome ? selectedMatch.away_score : selectedMatch.away_score + 1)
                        : (eventData.event_type === 'OWN_GOAL' ? (isHome ? selectedMatch.away_score + 1 : selectedMatch.away_score) : selectedMatch.away_score);

                      return (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">Credited to:</span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                              isHome
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            }`}>
                              {activeTeamName}
                            </span>
                          </div>
                          <div className="font-semibold text-[11px]">
                            {eventData.event_type === 'GOAL' && (
                              <span className="text-emerald-400 flex items-center gap-1.5">
                                <span>⚽</span>
                                <span>Goal automatically credits <strong>+1</strong> to {activeTeamName} &bull; Score becomes: <strong className="text-white">{projectedHomeScore} - {projectedAwayScore}</strong></span>
                              </span>
                            )}
                            {eventData.event_type === 'OWN_GOAL' && (
                              <span className="text-amber-400 flex items-center gap-1.5">
                                <span>⚠️</span>
                                <span>Own goal conceded by {activeTeamName} &bull; credits <strong>+1</strong> goal to {opponentTeamName}! (Score: <strong className="text-white">{projectedHomeScore} - {projectedAwayScore}</strong>)</span>
                              </span>
                            )}
                            {eventData.event_type === 'ASSIST' && (
                              <span className="text-blue-400">🎯 Playmaker assist logged to {activeTeamName}&apos;s player statistics</span>
                            )}
                            {(eventData.event_type === 'YELLOW_CARD' || eventData.event_type === 'RED_CARD') && (
                              <span className="text-amber-300">Disciplinary card logged for {activeTeamName}</span>
                            )}
                            {eventData.event_type === 'SUBSTITUTION' && (
                              <span className="text-slate-300">Tactical substitution recorded for {activeTeamName}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                      >
                        Save Event
                      </button>
                    </div>
                  </form>
                </div>

                {/* Chronological Match Events Table */}
                <div className="p-5 sm:p-6 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3960]/60 pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <History className="w-4 h-4 text-purple-400" />
                      Chronological Match Events ({Array.isArray(selectedMatch.events) ? selectedMatch.events.length : 0})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Score: <strong className="text-white">{selectedMatch.home_team.name} {selectedMatch.home_score} - {selectedMatch.away_score} {selectedMatch.away_team.name}</strong>
                    </span>
                  </div>

                  {!Array.isArray(selectedMatch.events) || selectedMatch.events.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[#0B132B] border border-[#2C3960]/60 text-center text-xs text-slate-400">
                      No events logged for this fixture yet. Use the incident recorder above to register goals, assists, cards, or substitutions.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMatch.events.map((ev: any) => {
                        const isHomeEvent = ev.team === selectedMatch.home_team.id || ev.team_batch === selectedMatch.home_team.code;
                        return (
                          <div
                            key={ev.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#0B132B] border border-[#2C3960] text-xs gap-3 hover:border-slate-500 transition-colors"
                          >
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 text-xs">
                                {ev.minute}&apos;
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ev.event_type === 'GOAL'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : ev.event_type === 'OWN_GOAL'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : ev.event_type === 'YELLOW_CARD'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : ev.event_type === 'RED_CARD'
                                  ? 'bg-rose-600/30 text-rose-400 border border-rose-600/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {ev.event_type_display || ev.event_type}
                              </span>
                              <div className="space-x-1.5">
                                <strong className="text-white">{ev.player_name || 'Team Event'}</strong>
                                {ev.related_player_name && (
                                  <span className="text-slate-400 text-[11px]">(Assist: {ev.related_player_name})</span>
                                )}
                                {ev.description && (
                                  <span className="text-slate-400 italic text-[11px]">&mdash; &ldquo;{ev.description}&rdquo;</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                                isHomeEvent
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                  : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              }`}>
                                {ev.team_name || (isHomeEvent ? selectedMatch.home_team.name : selectedMatch.away_team.name)}
                              </span>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 cursor-pointer transition-colors"
                                title="Delete this event (if goal, match score will be rolled back automatically)"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
      {/* TAB: CREATE CUSTOM TOURNAMENT FIXTURE */}
      {/* ========================================================================= */}
      {activeTab === 'create-fixture' && (
        <div className="max-w-3xl space-y-6">
          <div className="card-gloss p-6 sm:p-8 rounded-3xl border border-purple-500/30 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#2C3960]/60 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Create Custom Tournament Fixture</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Schedule championship finals, semi-finals, round matches, or special exhibition matches.
                </p>
              </div>
            </div>

            {customFixtureSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{customFixtureSuccess}</span>
              </div>
            )}

            {customFixtureError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{customFixtureError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomFixture} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Home Batch Team <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={customFixture.home_team_id}
                    onChange={(e) => setCustomFixture({ ...customFixture, home_team_id: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select Home Batch --</option>
                    {(Array.isArray(batchTeams) ? batchTeams : []).map((team) => (
                      <option key={team.id} value={team.id} disabled={String(team.id) === String(customFixture.away_team_id)}>
                        {team.name} ({team.nickname || team.batch_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Away Batch Team <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={customFixture.away_team_id}
                    onChange={(e) => setCustomFixture({ ...customFixture, away_team_id: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">-- Select Away Batch --</option>
                    {(Array.isArray(batchTeams) ? batchTeams : []).map((team) => (
                      <option key={team.id} value={team.id} disabled={String(team.id) === String(customFixture.home_team_id)}>
                        {team.name} ({team.nickname || team.batch_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tournament Stage / Round Name <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['Grand Final', 'Semi-Final', '3rd Place Match', 'Quarter-Final', 'Group Stage Round', 'Special Exhibition'].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setCustomFixture({ ...customFixture, stage_or_round_name: stage })}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        customFixture.stage_or_round_name === stage
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-[#161D36] text-slate-400 border-[#2C3960] hover:text-white'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customFixture.stage_or_round_name}
                  onChange={(e) => setCustomFixture({ ...customFixture, stage_or_round_name: e.target.value })}
                  placeholder="e.g. Grand Final"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Round Number</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={customFixture.round_number}
                    onChange={(e) => setCustomFixture({ ...customFixture, round_number: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Match Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={customFixture.match_date}
                    onChange={(e) => setCustomFixture({ ...customFixture, match_date: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kick-off Time</label>
                  <input
                    type="time"
                    value={customFixture.kick_off_time}
                    onChange={(e) => setCustomFixture({ ...customFixture, kick_off_time: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Venue Location</label>
                <input
                  type="text"
                  value={customFixture.venue}
                  onChange={(e) => setCustomFixture({ ...customFixture, venue: e.target.value })}
                  placeholder="e.g. AASTU Main Football Field"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Match Notes / Description (Optional)</label>
                <input
                  type="text"
                  value={customFixture.notes}
                  onChange={(e) => setCustomFixture({ ...customFixture, notes: e.target.value })}
                  placeholder="e.g. Championship decider followed by awards ceremony"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={customFixtureLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {customFixtureLoading ? 'Creating Fixture...' : 'Schedule & Create Fixture'}
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>
            </form>
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

          {!Array.isArray(pendingPlayers) || pendingPlayers.length === 0 ? (
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Fellowship Member Management</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {Array.isArray(membersList) ? membersList.length : 0} members
                </span>
              </div>
              <p className="text-xs text-slate-400">Search members, verify eligibility, or filter by academic batch.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Filter Dropdown */}
              <select
                value={memberBatchFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setMemberBatchFilter(val);
                  loadMembers(val, memberSearch);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                title="Filter by Batch"
              >
                <option value="">All Batches</option>
                <option value="2nd Year">2nd Year Batch</option>
                <option value="3rd Year">3rd Year Batch</option>
                <option value="4th Year">4th Year Batch</option>
                <option value="5th Year">5th Year Batch</option>
                <option value="Other">Other / 1st Year</option>
              </select>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadMembers(memberBatchFilter, memberSearch);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Search member..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Search
                </button>
              </form>

              {(memberBatchFilter || memberSearch) && (
                <button
                  onClick={() => {
                    setMemberBatchFilter('');
                    setMemberSearch('');
                    loadMembers('', '');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Clear all filters"
                >
                  Clear Filters &times;
                </button>
              )}
            </div>
          </div>

          {memberBatchFilter && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
              <span className="text-purple-300">
                Filtered by batch: <strong className="text-white">{memberBatchFilter}</strong> ({Array.isArray(membersList) ? membersList.length : 0} members found)
              </span>
              <button
                onClick={() => {
                  setMemberBatchFilter('');
                  loadMembers('', memberSearch);
                }}
                className="text-purple-400 hover:text-purple-200 text-xs font-bold cursor-pointer underline"
              >
                Show all batches &rarr;
              </button>
            </div>
          )}

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
                {!Array.isArray(membersList) || membersList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-300">No fellowship members found</p>
                        <p className="text-[11px] text-slate-500">
                          {memberBatchFilter ? `No members matched filter "${memberBatchFilter}".` : 'No member profiles match the current filter criteria.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  membersList.map((m) => (
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          !m.is_suspended
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {!m.is_suspended ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleSuspend(m.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer border transition-colors ${
                              !m.is_suspended
                                ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30'
                            }`}
                          >
                            {!m.is_suspended ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.full_name)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer border transition-colors bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30"
                            title="Permanently delete user"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                {!Array.isArray(auditLogs) || auditLogs.length === 0 ? (
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
              <GraduationCap className="w-7 h-7 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
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
      </div>
    </div>
  );
}

