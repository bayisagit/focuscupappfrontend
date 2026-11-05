'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import { apiCache } from '@/lib/cache';
import Spinner from '@/components/Spinner';
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
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  ChevronLeft,
  Menu,
  X,
  Eye,
  EyeOff,
  Edit,
  Save,
  Shirt,
  UserCheck,
  MapPin,
  Upload,
  Trash2,
  Pin,
  Image as ImageIconLucide,
  Camera,
} from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import LineupPosterGenerator from '@/components/LineupPosterGenerator';
import MatchBroadcastGraphicGenerator from '@/components/MatchBroadcastGraphicGenerator';

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
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matches' | 'create-fixture' | 'players' | 'members' | 'coaches' | 'content' | 'audit' | 'reports'>('dashboard');

  // Batch Coaches Management State
  const [coachesData, setCoachesData] = useState<any[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [appointModalOpen, setAppointModalOpen] = useState(false);
  const [selectedBatchForCoach, setSelectedBatchForCoach] = useState<any>(null);
  const [appointMemberId, setAppointMemberId] = useState('');
  const [appointUsername, setAppointUsername] = useState('');
  const [appointPassword, setAppointPassword] = useState('');
  const [showAppointPassword, setShowAppointPassword] = useState(false);
  const [appointLoading, setAppointLoading] = useState(false);
  const [appointError, setAppointError] = useState('');
  const [appointSuccess, setAppointSuccess] = useState('');
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [revokeBatchTarget, setRevokeBatchTarget] = useState<any>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [squadDetails, setSquadDetails] = useState<any>(null);

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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'matches', 'create-fixture', 'players', 'members', 'coaches', 'content', 'audit', 'reports'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
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

  // Match operations sub-tabs in Tab 2
  const [matchSubTab, setMatchSubTab] = useState<'events' | 'squads'>('events');

  // Edit Fixture State
  const [showEditFixtureModal, setShowEditFixtureModal] = useState(false);
  const [editFixtureData, setEditFixtureData] = useState({
    id: 0,
    home_team_id: '',
    away_team_id: '',
    stage_or_round_name: '',
    round_number: 1,
    match_date: '',
    kick_off_time: '',
    venue: '',
    status: 'SCHEDULED',
    notes: '',
  });
  const [editFixtureLoading, setEditFixtureLoading] = useState(false);
  const [editFixtureError, setEditFixtureError] = useState('');
  const [editFixtureSuccess, setEditFixtureSuccess] = useState('');

  // Squad & Starting Line-ups Manager State
  const [squadLoading, setSquadLoading] = useState(false);
  const [squadSaving, setSquadSaving] = useState(false);
  const [squadSuccessMsg, setSquadSuccessMsg] = useState('');
  const [squadErrorMsg, setSquadErrorMsg] = useState('');
  const [lineupPosterOpen, setLineupPosterOpen] = useState(false);
  const [broadcastGraphicOpen, setBroadcastGraphicOpen] = useState(false);
  const [homeEligiblePlayers, setHomeEligiblePlayers] = useState<any[]>([]);
  const [awayEligiblePlayers, setAwayEligiblePlayers] = useState<any[]>([]);
  const [homeSquadList, setHomeSquadList] = useState<any[]>([]);
  const [awaySquadList, setAwaySquadList] = useState<any[]>([]);
  const [selectedHomeAddPlayer, setSelectedHomeAddPlayer] = useState('');
  const [selectedAwayAddPlayer, setSelectedAwayAddPlayer] = useState('');

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
    category: 'TOURNAMENT',
    priority: 'NORMAL',
    image_url: '',
    is_pinned: false,
  });
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementImageUploading, setAnnouncementImageUploading] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementActionId, setAnnouncementActionId] = useState<number | null>(null);
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

  // CSV Export State
  const [exportingType, setExportingType] = useState<string | null>(null);

  const handleExport = async (dataType: 'members' | 'rosters' | 'matches' | 'standings') => {
    try {
      setExportingType(dataType);
      await api.manager.downloadExport(dataType);
    } catch (err: any) {
      alert(err.message || 'Export failed. Please ensure you are logged in as a tournament manager.');
    } finally {
      setExportingType(null);
    }
  };

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

  const loadAnnouncements = () => {
    setAnnouncementsLoading(true);
    api.community.getAnnouncements()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res?.results || [];
        setAnnouncementsList(list);
      })
      .catch((err: any) => {
        console.error(err);
        setAnnouncementsList([]);
      })
      .finally(() => setAnnouncementsLoading(false));
  };

  const handleToggleAnnouncementPin = async (item: any) => {
    try {
      setAnnouncementActionId(item.id);
      await api.community.updateAnnouncement(item.id, {
        is_pinned: !item.is_pinned,
      });
      loadAnnouncements();
    } catch (err: any) {
      alert(err?.data?.error || err?.data?.detail || 'Failed to update announcement pin status.');
    } finally {
      setAnnouncementActionId(null);
    }
  };

  const handleToggleAnnouncementSuspend = async (item: any) => {
    const nextActive = item.is_active === false ? true : false;
    const actionText = nextActive ? 'restore visibility for' : 'suspend (hide from public view)';
    if (!confirm(`Are you sure you want to ${actionText} announcement: "${item.title}"?`)) {
      return;
    }
    try {
      setAnnouncementActionId(item.id);
      await api.community.updateAnnouncement(item.id, {
        is_active: nextActive,
      });
      loadAnnouncements();
    } catch (err: any) {
      alert(err?.data?.error || err?.data?.detail || 'Failed to update visibility status.');
    } finally {
      setAnnouncementActionId(null);
    }
  };

  const handleDeleteAnnouncement = async (item: any) => {
    if (!confirm(`Permanently delete announcement: "${item.title}"?\n\nThis cannot be undone.`)) {
      return;
    }
    try {
      setAnnouncementActionId(item.id);
      await api.community.deleteAnnouncement(item.id);
      loadAnnouncements();
    } catch (err: any) {
      alert(err?.data?.error || err?.data?.detail || 'Failed to delete announcement.');
    } finally {
      setAnnouncementActionId(null);
    }
  };

  // Batch Coaches Handlers
  const loadCoaches = async () => {
    setCoachesLoading(true);
    try {
      const res = await api.manager.getCoaches();
      const list = Array.isArray(res) ? res : (res?.batches || res?.results || []);
      setCoachesData(list);
    } catch (err: any) {
      console.error('Failed to load coaches:', err);
      setCoachesData([]);
    } finally {
      setCoachesLoading(false);
    }
  };

  const handleOpenAppointCoach = (batch: any) => {
    setSelectedBatchForCoach(batch);
    const codeClean = (batch.batch_code || '').toLowerCase().replace('_year', '');
    const defaultUsername = `coach_${codeClean}`;
    setAppointUsername(defaultUsername);
    setAppointPassword('');
    setShowAppointPassword(false);
    setAppointError('');
    setAppointSuccess('');
    setAppointMemberId(batch.coach?.member_id ? String(batch.coach.member_id) : '');
    setAppointModalOpen(true);
  };

  const handleAssignCoachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForCoach || !appointMemberId || !appointUsername.trim() || !appointPassword) {
      setAppointError('Please select a member, set a username, and enter a password.');
      return;
    }
    if (appointPassword.length < 6) {
      setAppointError('Password must be at least 6 characters.');
      return;
    }
    setAppointLoading(true);
    setAppointError('');
    setAppointSuccess('');
    try {
      const res = await api.manager.assignCoach({
        batch_code: selectedBatchForCoach.batch_code,
        member_id: Number(appointMemberId),
        username: appointUsername.trim(),
        password: appointPassword,
      });
      setAppointSuccess(res.message || 'Coach appointed successfully!');
      await loadCoaches();
      loadAuditLogs();
      setTimeout(() => {
        setAppointModalOpen(false);
        setAppointSuccess('');
      }, 1500);
    } catch (err: any) {
      setAppointError(err?.data?.error || err?.message || 'Failed to appoint coach.');
    } finally {
      setAppointLoading(false);
    }
  };

  const handleRevokeCoachSubmit = async () => {
    if (!revokeBatchTarget) return;
    setRevokeLoading(true);
    try {
      const res = await api.manager.revokeCoach(revokeBatchTarget.batch_code);
      alert(res.message || 'Coach role revoked successfully.');
      setRevokeModalOpen(false);
      setRevokeBatchTarget(null);
      await loadCoaches();
      loadAuditLogs();
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'Failed to revoke coach role.');
    } finally {
      setRevokeLoading(false);
    }
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
      loadAnnouncements();
      loadCoaches();
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_manager && activeTab === 'coaches') {
      loadCoaches();
    }
  }, [activeTab, user]);

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
    loadMatchSquad(m.id);
  };

  // Fixture Editing Handlers
  const openEditFixture = (m: any) => {
    if (!m) return;
    setEditFixtureError('');
    setEditFixtureSuccess('');

    let stage = '';
    let noteText = m.match_report || '';
    if (noteText.startsWith('[')) {
      const closingIdx = noteText.indexOf(']');
      if (closingIdx !== -1) {
        stage = noteText.substring(1, closingIdx);
        noteText = noteText.substring(closingIdx + 1).trim();
      }
    }

    setEditFixtureData({
      id: m.id,
      home_team_id: String(m.home_team.id),
      away_team_id: String(m.away_team.id),
      stage_or_round_name: stage,
      round_number: m.round_number || 1,
      match_date: m.match_date || new Date().toISOString().split('T')[0],
      kick_off_time: (m.kick_off_time || '16:00').slice(0, 5),
      venue: m.venue || 'AASTU Main Football Field',
      status: m.status || 'SCHEDULED',
      notes: noteText,
    });
    setShowEditFixtureModal(true);
  };

  const handleSaveEditFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFixtureData.id) return;
    if (editFixtureData.home_team_id === editFixtureData.away_team_id) {
      setEditFixtureError('Home team and away team cannot be the same batch.');
      return;
    }
    setEditFixtureLoading(true);
    setEditFixtureError('');
    setEditFixtureSuccess('');

    try {
      const res = await api.manager.updateMatch(editFixtureData.id, {
        home_team_id: Number(editFixtureData.home_team_id),
        away_team_id: Number(editFixtureData.away_team_id),
        round_number: Number(editFixtureData.round_number),
        match_date: editFixtureData.match_date,
        kick_off_time: editFixtureData.kick_off_time,
        venue: editFixtureData.venue,
        status: editFixtureData.status,
        stage_or_round_name: editFixtureData.stage_or_round_name,
        notes: editFixtureData.notes,
      });

      setEditFixtureSuccess(res.message || 'Fixture updated successfully!');
      loadMatches();
      loadDashboard();
      loadAuditLogs();

      api.matches.getDetail(editFixtureData.id).then((detailed: any) => {
        if (detailed) {
          setSelectedMatch(detailed);
          setHomeScore(detailed.home_score);
          setAwayScore(detailed.away_score);
        }
      });

      setTimeout(() => {
        setShowEditFixtureModal(false);
        setEditFixtureSuccess('');
      }, 1200);
    } catch (err: any) {
      setEditFixtureError(err.data?.error || err.message || 'Failed to update fixture.');
    } finally {
      setEditFixtureLoading(false);
    }
  };

  // Squad / Lineup Handlers
  const loadMatchSquad = async (matchId: number) => {
    if (!matchId) return;
    setSquadLoading(true);
    setSquadSuccessMsg('');
    setSquadErrorMsg('');
    try {
      const res = await api.manager.getMatchSquad(matchId);
      setSquadDetails(res);
      setHomeEligiblePlayers(res.home_eligible_players || []);
      setAwayEligiblePlayers(res.away_eligible_players || []);
      setHomeSquadList(res.home_squad || []);
      setAwaySquadList(res.away_squad || []);
    } catch (err: any) {
      console.error(err);
      setSquadErrorMsg('Failed to load squad rosters for this match.');
    } finally {
      setSquadLoading(false);
    }
  };

  const handleAddPlayerToSquad = (side: 'home' | 'away', player: any) => {
    const isHome = side === 'home';
    const currentList = isHome ? homeSquadList : awaySquadList;
    const setList = isHome ? setHomeSquadList : setAwaySquadList;

    if (currentList.some((p: any) => (p.player_id || p.id) === player.id)) {
      return;
    }

    const isStarter = currentList.filter((p: any) => p.is_starter).length < 11;
    const isGoalkeeper = (player.position || '').toLowerCase().includes('keeper');
    const hasGk = currentList.some((p: any) => p.is_goalkeeper);

    const newEntry = {
      id: player.id,
      player_id: player.id,
      player_name: player.full_name,
      player_username: player.username,
      jersey_number: player.jersey_number || 99,
      is_starter: isStarter,
      is_goalkeeper: isGoalkeeper && !hasGk,
      position: player.position || 'Player',
      avatar_url: player.avatar_url,
    };

    setList([...currentList, newEntry]);
  };

  const handleRemovePlayerFromSquad = (side: 'home' | 'away', playerId: number) => {
    const isHome = side === 'home';
    const setList = isHome ? setHomeSquadList : setAwaySquadList;
    setList((prev) => prev.filter((p: any) => (p.player_id || p.id) !== playerId));
  };

  const handleToggleStarter = (side: 'home' | 'away', playerId: number) => {
    const isHome = side === 'home';
    const setList = isHome ? setHomeSquadList : setAwaySquadList;
    setList((prev) =>
      prev.map((p: any) => {
        if ((p.player_id || p.id) === playerId) {
          return { ...p, is_starter: !p.is_starter };
        }
        return p;
      })
    );
  };

  const handleToggleGoalkeeper = (side: 'home' | 'away', playerId: number) => {
    const isHome = side === 'home';
    const setList = isHome ? setHomeSquadList : setAwaySquadList;
    setList((prev) =>
      prev.map((p: any) => {
        const matches = (p.player_id || p.id) === playerId;
        if (matches) {
          const willBeGk = !p.is_goalkeeper;
          return {
            ...p,
            is_goalkeeper: willBeGk,
            is_starter: willBeGk ? true : p.is_starter,
          };
        }
        return { ...p, is_goalkeeper: false };
      })
    );
  };

  const handleUpdateJerseyNumber = (side: 'home' | 'away', playerId: number, jersey: number | string) => {
    const isHome = side === 'home';
    const setList = isHome ? setHomeSquadList : setAwaySquadList;
    setList((prev) =>
      prev.map((p: any) => {
        if ((p.player_id || p.id) === playerId) {
          return { ...p, jersey_number: Number(jersey) || 0 };
        }
        return p;
      })
    );
  };

  const handleAutoPopulateSquad = (side: 'home' | 'away') => {
    const isHome = side === 'home';
    const eligible = isHome ? homeEligiblePlayers : awayEligiblePlayers;
    const currentList = isHome ? homeSquadList : awaySquadList;
    const setList = isHome ? setHomeSquadList : setAwaySquadList;

    const existingIds = new Set(currentList.map((p: any) => p.player_id || p.id));
    const toAdd = eligible.filter((p: any) => !existingIds.has(p.id));

    if (toAdd.length === 0) return;

    let startersCount = currentList.filter((p: any) => p.is_starter).length;
    let hasGk = currentList.some((p: any) => p.is_goalkeeper);

    const newEntries = toAdd.map((player: any) => {
      const isGkCandidate = (player.position || '').toLowerCase().includes('keeper');
      const isGk = isGkCandidate && !hasGk;
      if (isGk) hasGk = true;

      const shouldBeStarter = startersCount < 11;
      if (shouldBeStarter) startersCount++;

      return {
        id: player.id,
        player_id: player.id,
        player_name: player.full_name,
        player_username: player.username,
        jersey_number: player.jersey_number || 99,
        is_starter: isGk || shouldBeStarter,
        is_goalkeeper: isGk,
        position: player.position || 'Player',
        avatar_url: player.avatar_url,
      };
    });

    setList([...currentList, ...newEntries]);
  };

  const handleSaveSquads = async () => {
    if (!selectedMatch) return;
    setSquadSaving(true);
    setSquadSuccessMsg('');
    setSquadErrorMsg('');

    try {
      const payload = {
        home_squad: homeSquadList.map((p: any) => ({
          player_id: p.player_id || p.id,
          jersey_number: Number(p.jersey_number) || 99,
          is_starter: Boolean(p.is_starter),
          is_goalkeeper: Boolean(p.is_goalkeeper),
        })),
        away_squad: awaySquadList.map((p: any) => ({
          player_id: p.player_id || p.id,
          jersey_number: Number(p.jersey_number) || 99,
          is_starter: Boolean(p.is_starter),
          is_goalkeeper: Boolean(p.is_goalkeeper),
        })),
      };

      const res = await api.manager.saveMatchSquad(selectedMatch.id, payload);
      setSquadSuccessMsg(res.message || 'Match squads and line-ups saved successfully!');
      loadAuditLogs();

      await loadMatchSquad(selectedMatch.id);

      api.matches.getDetail(selectedMatch.id).then((detailed: any) => {
        if (detailed) {
          setSelectedMatch(detailed);
        }
      });
    } catch (err: any) {
      setSquadErrorMsg(err.data?.error || err.message || 'Failed to save match squads.');
    } finally {
      setSquadSaving(false);
    }
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
        setBroadcastGraphicOpen(true);
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
        setBroadcastGraphicOpen(true);
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

      // 1. Immediately remove the reviewed player from local state so the UI updates instantly
      setPendingPlayers((prev: any[]) => (Array.isArray(prev) ? prev.filter((p: any) => p.id !== regId) : []));
      setSelectedPlayer(null);
      setReviewReason('');

      // 2. Clear relevant client caches
      apiCache.invalidatePlayerRegistrations();

      // 3. Show non-blocking success toast
      showToast(`Player application ${status.toLowerCase()} successfully!`, 'success');

      // 4. Background re-sync with server
      loadPendingPlayers();
      loadDashboard();
    } catch (err: any) {
      const errMsg = err.data?.error || err.message || 'Failed to review player.';
      showToast(errMsg, 'error');
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
      <Spinner
        fullPage
        size="xl"
        color="purple"
        label="Loading Admin Command Center..."
        sublabel="Focus Football Cup Directorate"
      />
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

          <div className="mt-6 pt-5 border-t border-[#2C3960] flex items-center justify-between text-xs text-slate-400">
            <Link
              href="/"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
            </Link>
            <a
              href="http://localhost:8002/admin/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-purple-400 transition-colors inline-flex items-center gap-1"
            >
              Jazzmin Admin <ExternalLink className="w-3.5 h-3.5" />
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
        className={`fixed md:sticky top-0 h-screen z-40 bg-[#0B132B] border-r border-[#2C3960] flex flex-col overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#2C3960]/80 flex items-center justify-between shrink-0 bg-[#0B132B] z-10 sticky top-0">
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

                <button
                  onClick={() => {
                    setActiveTab('coaches');
                    setMobileSidebarOpen(false);
                    loadCoaches();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'coaches'
                      ? 'bg-purple-600/80 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#161D36]'
                  }`}
                  title="Batch Coaches Administration"
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    {!sidebarCollapsed && <span>Batch Coaches</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900/60 text-purple-200 border border-purple-500/30 font-bold">
                      4 Batches
                    </span>
                  )}
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
                <Link
                  href="/manager/graphics"
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161D36] transition-all cursor-pointer"
                  title="Matchday Graphics & Posters Archive"
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                  {!sidebarCollapsed && <span>Graphics Archive</span>}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer (Backend Links) */}
        <div className="p-3 border-t border-[#2C3960]/80 space-y-1 text-xs shrink-0 bg-[#0B132B]">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-400 hover:bg-emerald-500/15 transition-all font-semibold"
            title="Return to Public Website"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-emerald-400" />
            {!sidebarCollapsed && <span>Public Website</span>}
          </Link>
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
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Return to Public Tournament Site"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Public Site</span>
            </Link>

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
                        <span className="font-semibold text-slate-300">Match #{m.id}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMatch(m);
                              openEditFixture(m);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 transition-colors"
                            title="Edit Fixture Schedule & Details"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            m.is_published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {m.is_published ? 'PUBLISHED' : m.status}
                          </span>
                        </div>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditFixture(selectedMatch)}
                      className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-purple-500/20"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit Fixture
                    </button>
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

                {/* Sub-tab Navigation: Live Events vs Team Squads */}
                <div className="flex items-center gap-2 border-b border-[#2C3960]/60 pb-3">
                  <button
                    type="button"
                    onClick={() => setMatchSubTab('events')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      matchSubTab === 'events'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#161D36]'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Live Events &amp; Incidents
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMatchSubTab('squads');
                      if (selectedMatch) {
                        loadMatchSquad(selectedMatch.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      matchSubTab === 'squads'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-[#161D36]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Team Squads &amp; Line-ups
                  </button>
                </div>

                {matchSubTab === 'events' && (
                  <div className="space-y-6">
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
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBroadcastGraphicOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                        title="Open Premier League Match Broadcast Graphic Studio"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Broadcast Graphic Studio</span>
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Score: <strong className="text-white">{selectedMatch.home_team.name} {selectedMatch.home_score} - {selectedMatch.away_score} {selectedMatch.away_team.name}</strong>
                      </span>
                    </div>
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

                {/* Match Broadcast Graphic Generator Studio Modal */}
                {selectedMatch && (
                  <MatchBroadcastGraphicGenerator
                    match={selectedMatch}
                    eligiblePlayers={membersList}
                    isOpen={broadcastGraphicOpen}
                    onClose={() => setBroadcastGraphicOpen(false)}
                    onPublished={() => {
                      loadAnnouncements();
                      setSquadSuccessMsg('✓ Official Broadcast Graphic published to homepage hero carousel and pinned!');
                    }}
                  />
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB 2: TEAM SQUADS & STARTING LINE-UPS */}
            {/* ========================================================= */}
            {matchSubTab === 'squads' && (
              <div className="space-y-6">
                {/* Top Squad Toolbar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#161D36] to-[#1E2749] border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Match Squads &amp; Starting 11 Selection
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300">
                      Designate 11 starters, select 1 goalkeeper, and assign jersey numbers. Line-ups appear immediately on the public Match Center.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLineupPosterOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all"
                      title="Open Starting Lineup Poster Studio"
                    >
                      <Camera className="w-4 h-4 text-purple-200" />
                      <span>Lineup Poster Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadMatchSquad(selectedMatch.id)}
                      disabled={squadLoading}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Reload Squad Roster"
                    >
                      <RefreshCw className={`w-4 h-4 ${squadLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSquads}
                      disabled={squadSaving || squadLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {squadSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Line-ups...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Official Line-ups</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {squadSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="font-semibold">{squadSuccessMsg}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setLineupPosterOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-200" />
                        Generate Lineup Poster
                      </button>
                      <Link
                        href={`/matches/${selectedMatch.id}`}
                        target="_blank"
                        className="text-xs font-bold text-white hover:text-emerald-300 underline inline-flex items-center gap-1.5 shrink-0"
                      >
                        Open Public Match Center <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {squadErrorMsg && (
                  <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{squadErrorMsg}</span>
                  </div>
                )}

                {squadLoading ? (
                  <div className="card-gloss p-12 rounded-2xl text-center space-y-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
                    <p className="text-xs text-slate-400">Loading squad rosters and eligible players...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ================================================= */}
                    {/* HOME TEAM SQUAD COLUMN */}
                    {/* ================================================= */}
                    <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-indigo-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3960]/60 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Home Batch</span>
                          <h4 className="text-base font-black text-white">{selectedMatch.home_team.name}</h4>
                          {squadDetails?.home_team?.coach_name && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                <ShieldCheck className="w-3 h-3 text-purple-400" />
                                Coach: {squadDetails.home_team.coach_name}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                squadDetails.home_lineup_submitted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {squadDetails.home_lineup_submitted ? '✓ Coach Lineup Submitted' : '⏳ Lineup Pending'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(() => {
                            const starters = homeSquadList.filter((p: any) => p.is_starter).length;
                            const gks = homeSquadList.filter((p: any) => p.is_goalkeeper).length;
                            const subs = homeSquadList.filter((p: any) => !p.is_starter).length;

                            return (
                              <>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  starters === 11
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}>
                                  {starters}/11 Starters
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  gks === 1
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}>
                                  {gks === 1 ? '🧤 1 GK' : gks === 0 ? '⚠️ No GK' : '⚠️ Multi GK'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-[#2C3960]">
                                  {subs} Subs
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Quick Actions & Add Player */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAutoPopulateSquad('home')}
                          className="px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Auto-add all approved players from this batch"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Auto-fill Approved Roster
                        </button>

                        <div className="flex-1 min-w-0">
                          <select
                            value={selectedHomeAddPlayer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedHomeAddPlayer(val);
                              if (val) {
                                const p = homeEligiblePlayers.find((x: any) => String(x.id) === val);
                                if (p) handleAddPlayerToSquad('home', p);
                                setSelectedHomeAddPlayer('');
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">+ Add Player from Batch Roster</option>
                            {homeEligiblePlayers
                              .filter((ep: any) => !homeSquadList.some((sp: any) => (sp.player_id || sp.id) === ep.id))
                              .map((ep: any) => (
                                <option key={ep.id} value={ep.id}>
                                  {ep.full_name} ({ep.position || 'Player'}) #{ep.jersey_number || 'NA'}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Squad Players List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {homeSquadList.length === 0 ? (
                          <div className="p-8 text-center rounded-xl bg-[#0E162E]/60 border border-[#2C3960]/60 space-y-2">
                            <Users className="w-6 h-6 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">No players assigned to this match squad yet.</p>
                            <button
                              type="button"
                              onClick={() => handleAutoPopulateSquad('home')}
                              className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
                            >
                              Auto-fill with all approved batch players &rarr;
                            </button>
                          </div>
                        ) : (
                          homeSquadList.map((p: any) => {
                            const playerId = p.player_id || p.id;
                            return (
                              <div
                                key={playerId}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                  p.is_starter
                                    ? 'bg-[#161D36] border-emerald-500/30'
                                    : 'bg-[#12182D]/80 border-[#2C3960]/60 opacity-85'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 overflow-hidden shrink-0">
                                    {p.avatar_url ? (
                                      <img src={p.avatar_url} alt={p.player_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{(p.player_name || 'PL').slice(0, 2).toUpperCase()}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{p.player_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {p.position || 'Player'} {p.player_username ? `• @${p.player_username}` : ''}
                                    </p>
                                  </div>
                                </div>

                                {/* Lineup Controls */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Jersey Input */}
                                  <div className="flex items-center gap-0.5 bg-[#0B132B] px-1.5 py-0.5 rounded-lg border border-[#2C3960]" title="Match Jersey Number">
                                    <span className="text-[10px] text-slate-400 font-bold">#</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="99"
                                      value={p.jersey_number ?? 99}
                                      onChange={(e) => handleUpdateJerseyNumber('home', playerId, e.target.value)}
                                      className="w-7 bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                                    />
                                  </div>

                                  {/* Starter Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStarter('home', playerId)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      p.is_starter
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title={p.is_starter ? 'Starting 11' : 'Substitute'}
                                  >
                                    {p.is_starter ? 'Starter' : 'Sub'}
                                  </button>

                                  {/* Goalkeeper Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleGoalkeeper('home', playerId)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      p.is_goalkeeper
                                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-black'
                                        : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                                    }`}
                                    title={p.is_goalkeeper ? 'Designated Goalkeeper' : 'Click to make Goalkeeper'}
                                  >
                                    {p.is_goalkeeper ? '🧤 GK' : 'GK'}
                                  </button>

                                  {/* Remove from Squad */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlayerFromSquad('home', playerId)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Remove from squad"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* ================================================= */}
                    {/* AWAY TEAM SQUAD COLUMN */}
                    {/* ================================================= */}
                    <div className="card-gloss p-5 sm:p-6 rounded-2xl border border-teal-500/30 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3960]/60 pb-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Away Batch</span>
                          <h4 className="text-base font-black text-white">{selectedMatch.away_team.name}</h4>
                          {squadDetails?.away_team?.coach_name && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                                <ShieldCheck className="w-3 h-3 text-purple-400" />
                                Coach: {squadDetails.away_team.coach_name}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                squadDetails.away_lineup_submitted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {squadDetails.away_lineup_submitted ? '✓ Coach Lineup Submitted' : '⏳ Lineup Pending'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {(() => {
                            const starters = awaySquadList.filter((p: any) => p.is_starter).length;
                            const gks = awaySquadList.filter((p: any) => p.is_goalkeeper).length;
                            const subs = awaySquadList.filter((p: any) => !p.is_starter).length;

                            return (
                              <>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  starters === 11
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}>
                                  {starters}/11 Starters
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  gks === 1
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}>
                                  {gks === 1 ? '🧤 1 GK' : gks === 0 ? '⚠️ No GK' : '⚠️ Multi GK'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-[#2C3960]">
                                  {subs} Subs
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Quick Actions & Add Player */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAutoPopulateSquad('away')}
                          className="px-3 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Auto-add all approved players from this batch"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Auto-fill Approved Roster
                        </button>

                        <div className="flex-1 min-w-0">
                          <select
                            value={selectedAwayAddPlayer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedAwayAddPlayer(val);
                              if (val) {
                                const p = awayEligiblePlayers.find((x: any) => String(x.id) === val);
                                if (p) handleAddPlayerToSquad('away', p);
                                setSelectedAwayAddPlayer('');
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="">+ Add Player from Batch Roster</option>
                            {awayEligiblePlayers
                              .filter((ep: any) => !awaySquadList.some((sp: any) => (sp.player_id || sp.id) === ep.id))
                              .map((ep: any) => (
                                <option key={ep.id} value={ep.id}>
                                  {ep.full_name} ({ep.position || 'Player'}) #{ep.jersey_number || 'NA'}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Squad Players List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {awaySquadList.length === 0 ? (
                          <div className="p-8 text-center rounded-xl bg-[#0E162E]/60 border border-[#2C3960]/60 space-y-2">
                            <Users className="w-6 h-6 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">No players assigned to this match squad yet.</p>
                            <button
                              type="button"
                              onClick={() => handleAutoPopulateSquad('away')}
                              className="text-xs font-bold text-teal-400 hover:underline cursor-pointer"
                            >
                              Auto-fill with all approved batch players &rarr;
                            </button>
                          </div>
                        ) : (
                          awaySquadList.map((p: any) => {
                            const playerId = p.player_id || p.id;
                            return (
                              <div
                                key={playerId}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                                  p.is_starter
                                    ? 'bg-[#161D36] border-emerald-500/30'
                                    : 'bg-[#12182D]/80 border-[#2C3960]/60 opacity-85'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300 overflow-hidden shrink-0">
                                    {p.avatar_url ? (
                                      <img src={p.avatar_url} alt={p.player_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{(p.player_name || 'PL').slice(0, 2).toUpperCase()}</span>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{p.player_name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">
                                      {p.position || 'Player'} {p.player_username ? `• @${p.player_username}` : ''}
                                    </p>
                                  </div>
                                </div>

                                {/* Lineup Controls */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Jersey Input */}
                                  <div className="flex items-center gap-0.5 bg-[#0B132B] px-1.5 py-0.5 rounded-lg border border-[#2C3960]" title="Match Jersey Number">
                                    <span className="text-[10px] text-slate-400 font-bold">#</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max="99"
                                      value={p.jersey_number ?? 99}
                                      onChange={(e) => handleUpdateJerseyNumber('away', playerId, e.target.value)}
                                      className="w-7 bg-transparent text-center font-bold text-xs text-white focus:outline-none"
                                    />
                                  </div>

                                  {/* Starter Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStarter('away', playerId)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      p.is_starter
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                    title={p.is_starter ? 'Starting 11' : 'Substitute'}
                                  >
                                    {p.is_starter ? 'Starter' : 'Sub'}
                                  </button>

                                  {/* Goalkeeper Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleGoalkeeper('away', playerId)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      p.is_goalkeeper
                                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-black'
                                        : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                                    }`}
                                    title={p.is_goalkeeper ? 'Designated Goalkeeper' : 'Click to make Goalkeeper'}
                                  >
                                    {p.is_goalkeeper ? '🧤 GK' : 'GK'}
                                  </button>

                                  {/* Remove from Squad */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlayerFromSquad('away', playerId)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Remove from squad"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Save Bar */}
                <div className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span>
                      <strong className="text-white">{selectedMatch.home_team.name}:</strong>{' '}
                      {homeSquadList.filter((p: any) => p.is_starter).length} Starters, {homeSquadList.filter((p: any) => !p.is_starter).length} Subs
                    </span>
                    <span>&bull;</span>
                    <span>
                      <strong className="text-white">{selectedMatch.away_team.name}:</strong>{' '}
                      {awaySquadList.filter((p: any) => p.is_starter).length} Starters, {awaySquadList.filter((p: any) => !p.is_starter).length} Subs
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLineupPosterOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      title="Open Starting Lineup Poster Studio"
                    >
                      <Camera className="w-4 h-4 text-purple-200" />
                      <span>Lineup Poster Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSquads}
                      disabled={squadSaving || squadLoading}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {squadSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving Line-ups...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Official Line-ups</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Starting Lineup Poster Generator Modal */}
                {selectedMatch && (
                  <LineupPosterGenerator
                    match={selectedMatch}
                    homeSquad={homeSquadList}
                    awaySquad={awaySquadList}
                    isOpen={lineupPosterOpen}
                    onClose={() => setLineupPosterOpen(false)}
                    onPublished={() => {
                      loadAnnouncements();
                      setSquadSuccessMsg('✓ Official Starting Lineup poster published to homepage carousel and match feed!');
                    }}
                  />
                )}
              </div>
            )}

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
              {pendingPlayers.map((app) => {
                const playerName = app.full_name || app.member_name || app.username || 'Applicant';
                const playerPosition = app.preferred_position || app.football_position || 'Position TBD';
                const playerJersey = app.jersey_number ? `#${app.jersey_number}` : '#TBD';
                const playerBatch = app.batch_name || app.batch_code || 'Batch Squad';
                const playerDept = app.department || 'Department TBD';
                const playerYear = app.academic_year || 'Academic Year';

                return (
                  <div
                    key={app.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 group cursor-pointer shadow-lg"
                    onClick={() => setSelectedPlayer(app)}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Avatar / Photo / Initials */}
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 overflow-hidden text-emerald-400 font-black text-sm">
                        {app.profile_picture_url || app.avatar_url ? (
                          <img
                            src={app.profile_picture_url || app.avatar_url}
                            alt={playerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{playerName.slice(0, 2).toUpperCase()}</span>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161D36]" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {playerName}
                          </h4>
                          <span className="text-xs text-slate-400">@{app.username}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {playerBatch}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {playerYear}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <span>🏛️</span> {playerDept}
                          </span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-emerald-300 font-medium">
                            Role: <span className="text-white font-bold">{playerPosition}</span>
                          </span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-amber-400 font-bold">Jersey: {playerJersey}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: View Details & Quick Approve/Reject */}
                    <div
                      className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#2C3960]/60 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedPlayer(app)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#2C3960]"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>View Full Details</span>
                      </button>
                      <button
                        onClick={() => handleReviewPlayer(app.id, 'APPROVED')}
                        disabled={playerActionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => setSelectedPlayer(app)}
                        disabled={playerActionLoading}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
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
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                            {(m.avatar_url || m.profile_picture || m.profile_picture_url) ? (
                              <img src={m.avatar_url || m.profile_picture || m.profile_picture_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[11px] font-bold text-emerald-400">{(m.first_name || m.full_name || 'U')[0]}</span>
                            )}
                          </div>
                          <div>
                            <Link href={`/members/${m.username}`} className="hover:text-emerald-400">
                              {m.full_name}
                            </Link>
                            <span className="block text-[10px] text-slate-500 font-mono">@{m.username}</span>
                          </div>
                        </div>
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
      {/* TAB: BATCH COACHES ADMINISTRATION */}
      {/* ========================================================================= */}
      {activeTab === 'coaches' && (
        <div className="space-y-6">
          <div className="card-gloss p-6 sm:p-8 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Batch Coaches Administration
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Appoint dedicated coaches per academic batch (2nd, 3rd, 4th, 5th Year). Coaches receive separate credentials to manage applications and submit official lineups via <code className="text-purple-300 font-mono">/coach</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadCoaches}
                disabled={coachesLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${coachesLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Coaches</span>
              </button>
            </div>
          </div>

          {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coachesLoading && coachesData.length === 0 ? (
              <div className="col-span-2 card-gloss p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                <p className="text-xs">Loading batch coach data...</p>
              </div>
            ) : coachesData.length === 0 ? (
              <div className="col-span-2 card-gloss p-12 text-center text-slate-400">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs">No batch teams configured yet.</p>
              </div>
            ) : (
              coachesData.map((batch: any) => {
                const hasCoach = !!batch.coach;
                return (
                  <div
                    key={batch.batch_id || batch.batch_code}
                    className="card-gloss p-6 rounded-3xl border border-[#2C3960]/80 hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-5"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-[#2C3960]/60 pb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md"
                            style={{
                              background: (batch.color_hex || batch.primary_color)
                                ? `linear-gradient(135deg, ${batch.color_hex || batch.primary_color}, #0B0E1A)`
                                : 'linear-gradient(135deg, #7C3AED, #4338CA)',
                              borderColor: batch.color_hex || batch.primary_color || '#8B5CF6',
                            }}
                          >
                            {batch.batch_code?.replace('_YEAR', '').replace('_', ' ') || `${batch.year_number || ''}th`}
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white">{batch.name}</h3>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {batch.nickname ? `${batch.nickname} • ` : ''}
                              {(batch.eligible_members || batch.eligible_candidates || []).length} Eligible Members
                            </span>
                          </div>
                        </div>

                        {hasCoach ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Coach Assigned
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            No Coach
                          </span>
                        )}
                      </div>

                      {/* Coach Details Body */}
                      <div className="mt-4">
                        {hasCoach ? (
                          <div className="p-4 rounded-2xl bg-[#161D36]/80 border border-[#2C3960]/70 flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border-2 border-purple-500/40 flex items-center justify-center text-purple-200 font-black text-base shrink-0 overflow-hidden shadow-inner">
                              {(batch.coach.photo_url || batch.coach.avatar_url) ? (
                                <img
                                  src={batch.coach.photo_url || batch.coach.avatar_url}
                                  alt={batch.coach.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{(batch.coach.full_name || 'C')[0]}</span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate flex items-center gap-2">
                                <span>{batch.coach.full_name}</span>
                                {(batch.coach.jersey_number || batch.coach.preferred_jersey_number) && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                                    #{batch.coach.jersey_number || batch.coach.preferred_jersey_number} Player-Coach
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {batch.coach.department || 'Academic Member'}
                              </p>

                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E162E] border border-purple-500/30 text-[11px] font-mono text-purple-300">
                                  <Lock className="w-3 h-3 text-purple-400" />
                                  <span>Portal Login: <strong>@{batch.coach.username}</strong></span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 rounded-2xl bg-[#161D36]/40 border border-dashed border-[#2C3960] text-center space-y-2">
                            <Shield className="w-8 h-8 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-300 font-semibold">
                              No dedicated coach assigned for {batch.name}
                            </p>
                            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                              The tournament manager directly handles approvals and matchday lineups for this batch until a coach is appointed.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="border-t border-[#2C3960]/60 pt-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {(batch.eligible_members || batch.eligible_candidates || []).length} eligible candidates
                      </span>

                      <div className="flex items-center gap-2">
                        {hasCoach ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setRevokeBatchTarget(batch);
                                setRevokeModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Revoke Role
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAppointCoach(batch)}
                              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Reassign / Update</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAppointCoach(batch)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Appoint Batch Coach</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ANNOUNCEMENTS & CONTENT SETTINGS */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Post Announcement */}
          <div className="card-gloss p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Publish Fellowship Announcement
            </h3>
            {announcementSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                ✓ Announcement published successfully to homepage and broadcasted to fellowship members!
              </div>
            )}
            {announcementError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {announcementError}
              </div>
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAnnouncementLoading(true);
                setAnnouncementError('');
                try {
                  await api.community.createAnnouncement(announcementForm);
                  setAnnouncementSuccess(true);
                  loadAnnouncements();
                  setAnnouncementForm({
                    title: '',
                    content: '',
                    category: 'TOURNAMENT',
                    priority: 'NORMAL',
                    is_pinned: false,
                    image_url: '',
                  });
                  setTimeout(() => setAnnouncementSuccess(false), 4000);
                } catch (err: any) {
                  setAnnouncementError(
                    err?.data?.error || err?.data?.detail || 'Failed to publish announcement. Please ensure you are logged in as tournament manager.'
                  );
                } finally {
                  setAnnouncementLoading(false);
                }
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Category</label>
                  <select
                    value={announcementForm.category}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  >
                    <option value="TOURNAMENT">Tournament Notice</option>
                    <option value="MATCH_DAY">Match Day Info</option>
                    <option value="FELLOWSHIP">Fellowship Family</option>
                    <option value="SPIRITUAL">Encouragement & Prayer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Priority</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white"
                  >
                    <option value="NORMAL">Standard Notice</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
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

              {/* Graphic Design Flyer / Banner Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIconLucide className="w-3.5 h-3.5 text-purple-400" />
                    Graphic Design Flyer / Banner (Optional)
                  </span>
                  {announcementImageUploading && (
                    <span className="text-[10px] text-purple-300 animate-pulse">Uploading to Cloudinary...</span>
                  )}
                </label>

                {announcementForm.image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-[#161D36] p-2 flex items-center gap-3">
                    <img
                      src={announcementForm.image_url}
                      alt="Announcement Flyer Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-[#2C3960]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">Graphic flyer attached</p>
                      <p className="text-[10px] text-slate-400 truncate">{announcementForm.image_url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnnouncementForm({ ...announcementForm, image_url: '' })}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#2C3960] hover:border-purple-500/60 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#161D36]/50">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">Click to upload flyer / banner</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WebP up to 10MB (Recommended 16:9 or 4:3)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={announcementImageUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAnnouncementImageUploading(true);
                        try {
                          const res = await uploadToCloudinary(file, 'focus_fellowship/announcements');
                          setAnnouncementForm((prev) => ({ ...prev, image_url: res.secure_url }));
                        } catch (err: any) {
                          alert('Failed to upload image: ' + (err.message || 'Unknown error'));
                        } finally {
                          setAnnouncementImageUploading(false);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="pin"
                  checked={announcementForm.is_pinned}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_pinned: e.target.checked })}
                  className="mt-0.5 accent-purple-500"
                />
                <label htmlFor="pin" className="text-xs text-slate-300 cursor-pointer">
                  <span className="font-semibold text-white block">Pin to top of public homepage</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Pinned announcements with graphic designs display in the top hero carousel, auto-transitioning right-to-left every 3–4 seconds.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={announcementLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
              >
                {announcementLoading ? 'Publishing Announcement...' : 'Publish Announcement'}
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

        {/* Manage Published Announcements & Hero Notices */}
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2C3960]/60 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Manage Published Announcements &amp; Carousel Notices
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Suspend (hide) notices from public view, toggle pinned status for the top hero carousel, or permanently delete announcements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                {announcementsList.length} Total Notice{announcementsList.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={loadAnnouncements}
                disabled={announcementsLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${announcementsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {announcementsLoading && announcementsList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading fellowship announcements...
            </div>
          ) : announcementsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No announcements published yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Use the form above to publish your first fellowship notice or graphic flyer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#161D36] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#2C3960]">
                  <tr>
                    <th className="py-3 px-4">Flyer / Banner</th>
                    <th className="py-3 px-4">Title &amp; Category</th>
                    <th className="py-3 px-4">Hero Carousel Pin</th>
                    <th className="py-3 px-4">Public Visibility</th>
                    <th className="py-3 px-4">Published Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C3960]/50">
                  {announcementsList.map((item) => {
                    const isPendingAction = announcementActionId === item.id;
                    const hasImage = Boolean(item.photo_url || item.image_url);
                    const imageUrl = item.photo_url || item.image_url;
                    const isSuspended = item.is_active === false;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        {/* Flyer Thumbnail */}
                        <td className="py-3 px-4">
                          {hasImage ? (
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-purple-500/40 bg-slate-900 shadow-sm shrink-0">
                              <img
                                src={imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl border border-dashed border-[#2C3960] bg-[#161D36] flex flex-col items-center justify-center text-slate-500 text-[9px] shrink-0 text-center p-1">
                              <ImageIconLucide className="w-4 h-4 mb-0.5 opacity-60" />
                              Text Notice
                            </div>
                          )}
                        </td>

                        {/* Title, Category & Excerpt */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {item.category_display || item.category || 'NOTICE'}
                            </span>
                            {item.priority === 'URGENT' && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Urgent
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">{item.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.content}</p>
                        </td>

                        {/* Hero Pin Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.is_pinned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              <Pin className="w-3 h-3 fill-purple-400" /> Pinned on Top Hero
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                              Not Pinned
                            </span>
                          )}
                        </td>

                        {/* Public Visibility */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <EyeOff className="w-3 h-3" /> Suspended (Hidden)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <Eye className="w-3 h-3" /> Publicly Visible
                            </span>
                          )}
                        </td>

                        {/* Published Date */}
                        <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                          <div>{item.created_at ? item.created_at.slice(0, 10) : 'Recent'}</div>
                          <span className="text-[10px] text-slate-500">{item.author_name || 'Manager'}</span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Pin / Unpin Button */}
                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => handleToggleAnnouncementPin(item)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                item.is_pinned
                                  ? 'bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 hover:bg-purple-900/30 text-slate-300 hover:text-purple-200 border border-slate-700'
                              }`}
                              title={item.is_pinned ? 'Unpin from Top Hero Carousel' : 'Pin to Top Hero Carousel'}
                            >
                              <Pin className="w-3 h-3" />
                              {item.is_pinned ? 'Unpin' : 'Pin to Top'}
                            </button>

                            {/* Suspend / Make Visible Button */}
                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => handleToggleAnnouncementSuspend(item)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                isSuspended
                                  ? 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-500/40'
                              }`}
                              title={isSuspended ? 'Make visible to public' : 'Suspend / Hide from public'}
                            >
                              {isSuspended ? (
                                <>
                                  <Eye className="w-3 h-3" /> Make Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" /> Suspend
                                </>
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              disabled={isPendingAction}
                              onClick={() => handleDeleteAnnouncement(item)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Permanently Delete Announcement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
            <button
              type="button"
              disabled={!!exportingType}
              onClick={() => handleExport('members')}
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500 transition-all text-left block group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <Users className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform" />
                {exportingType === 'members' && (
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                )}
              </div>
              <h4 className="font-bold text-white text-sm">
                {exportingType === 'members' ? 'Exporting CSV...' : 'Members Directory CSV'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">All registered fellowship members by college and batch.</p>
            </button>

            <button
              type="button"
              disabled={!!exportingType}
              onClick={() => handleExport('rosters')}
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-purple-500 transition-all text-left block group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <GraduationCap className="w-7 h-7 text-purple-400 group-hover:scale-110 transition-transform" />
                {exportingType === 'rosters' && (
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                )}
              </div>
              <h4 className="font-bold text-white text-sm">
                {exportingType === 'rosters' ? 'Exporting CSV...' : 'Batch Squad Rosters CSV'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Approved competition players, jersey numbers, and positions.</p>
            </button>

            <button
              type="button"
              disabled={!!exportingType}
              onClick={() => handleExport('matches')}
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500 transition-all text-left block group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <Calendar className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform" />
                {exportingType === 'matches' && (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                )}
              </div>
              <h4 className="font-bold text-white text-sm">
                {exportingType === 'matches' ? 'Exporting CSV...' : 'Fixtures & Results CSV'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">Full schedule, venues, final scorelines, and match status.</p>
            </button>

            <button
              type="button"
              disabled={!!exportingType}
              onClick={() => handleExport('standings')}
              className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] hover:border-blue-500 transition-all text-left block group cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <Trophy className="w-7 h-7 text-blue-400 group-hover:scale-110 transition-transform" />
                {exportingType === 'standings' && (
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                )}
              </div>
              <h4 className="font-bold text-white text-sm">
                {exportingType === 'standings' ? 'Exporting CSV...' : 'Official Standings CSV'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">P, W, D, L, Goals, Goal Difference, and Points table.</p>
            </button>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL MEMBER & PLAYER REGISTRATION DETAILS MODAL (PORTAL TO DOCUMENT.BODY) */}
      {/* ========================================================================= */}
      {mounted && selectedPlayer && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            setSelectedPlayer(null);
            setReviewReason('');
          }}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-emerald-500/40 bg-[#0E162E] text-white shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header (Never scrolls away, always in view) */}
            <div className="p-4 sm:p-5 border-b border-[#2C3960]/60 shrink-0 flex items-center justify-between gap-3 bg-[#0E162E]">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/80 flex items-center justify-center overflow-hidden shrink-0 shadow-lg text-emerald-300 font-black text-lg">
                  {selectedPlayer.profile_picture_url || selectedPlayer.avatar_url ? (
                    <img
                      src={selectedPlayer.profile_picture_url || selectedPlayer.avatar_url}
                      alt={selectedPlayer.full_name || selectedPlayer.member_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {(selectedPlayer.full_name || selectedPlayer.member_name || selectedPlayer.username || 'FC')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white truncate">
                      {selectedPlayer.full_name || selectedPlayer.member_name || 'Fellowship Member'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      {selectedPlayer.status || 'PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    @{selectedPlayer.username} {selectedPlayer.email ? `• ${selectedPlayer.email}` : ''}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedPlayer.batch_name || selectedPlayer.batch_code || 'Batch Squad'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedPlayer.academic_year || 'Academic Year'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Close Button */}
              <button
                onClick={() => {
                  setSelectedPlayer(null);
                  setReviewReason('');
                }}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Academic Department
                  </span>
                  <span className="text-white font-bold text-sm">
                    {selectedPlayer.department || 'Not specified'}
                  </span>
                  {selectedPlayer.college && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedPlayer.college}</p>
                  )}
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Academic Year &amp; Batch
                  </span>
                  <span className="text-white font-bold text-sm">
                    {selectedPlayer.academic_year || 'Not specified'}
                  </span>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                    Competing for {selectedPlayer.batch_name || 'Batch Squad'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Pitch Role &amp; Squad Number
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-sm">
                      {selectedPlayer.preferred_position || selectedPlayer.football_position || 'Position TBD'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-black text-sm border border-amber-500/30">
                      #{selectedPlayer.jersey_number || 'TBD'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/80 border border-[#2C3960]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fellowship Ministry / Team
                  </span>
                  <span className="text-white font-bold text-sm">
                    {selectedPlayer.fellowship_team || 'General Fellowship'}
                  </span>
                  {selectedPlayer.gender && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Gender: {selectedPlayer.gender}</p>
                  )}
                </div>
              </div>

              {/* Football Notes / Statement */}
              {selectedPlayer.football_notes && (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-[#2C3960] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Player Application Notes / Experience
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    &ldquo;{selectedPlayer.football_notes}&rdquo;
                  </p>
                </div>
              )}

              {/* Rejection Reason Input (Optional when rejecting) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-400 block">
                  Rejection Reason / Feedback (Optional, sent to player if rejected):
                </label>
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="e.g. Duplicate jersey number, wrong academic year batch, etc."
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                />
              </div>
            </div>

            {/* Fixed Modal Footer Action Buttons (Always visible at bottom) */}
            <div className="p-3.5 sm:p-4 border-t border-[#2C3960]/60 bg-[#0B1226] shrink-0 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                onClick={() => handleReviewPlayer(selectedPlayer.id, 'APPROVED')}
                disabled={playerActionLoading}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{playerActionLoading ? 'Processing...' : 'Approve Player for Squad'}</span>
              </button>

              <button
                onClick={() => handleReviewPlayer(selectedPlayer.id, 'REJECTED')}
                disabled={playerActionLoading}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPlayer(null);
                  setReviewReason('');
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* EDIT FIXTURE MODAL (PORTAL TO DOCUMENT.BODY) */}
      {/* ========================================================================= */}
      {mounted && showEditFixtureModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            setShowEditFixtureModal(false);
            setEditFixtureError('');
            setEditFixtureSuccess('');
          }}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-purple-500/40 bg-[#0E162E] text-white shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#2C3960]/60 shrink-0 flex items-center justify-between gap-3 bg-[#0E162E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Edit Fixture Details</h3>
                  <p className="text-xs text-slate-400">Match #{editFixtureData.id} &bull; Reschedule, update venue, status, or teams</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditFixtureModal(false);
                  setEditFixtureError('');
                  setEditFixtureSuccess('');
                }}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEditFixture} id="edit-fixture-form" className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {editFixtureError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editFixtureError}</span>
                </div>
              )}

              {editFixtureSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{editFixtureSuccess}</span>
                </div>
              )}

              {/* Competing Batch Teams */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Home Team <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editFixtureData.home_team_id}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, home_team_id: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select Home Batch</option>
                    {batchTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.batch_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Away Team <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editFixtureData.away_team_id}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, away_team_id: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select Away Batch</option>
                    {batchTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.batch_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stage / Round Name & Round Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Stage / Round Title
                  </label>
                  <input
                    type="text"
                    value={editFixtureData.stage_or_round_name}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, stage_or_round_name: e.target.value }))}
                    placeholder="e.g. Grand Final, Semi-Final, Round 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['Grand Final', 'Semi-Final', '3rd Place Playoff', 'Round of 16', 'Group Match'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditFixtureData((prev) => ({ ...prev, stage_or_round_name: preset }))}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 hover:text-purple-300 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Round Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={editFixtureData.round_number}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, round_number: Number(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Match Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={editFixtureData.match_date}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, match_date: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kick-off Time <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={editFixtureData.kick_off_time}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, kick_off_time: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Venue & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Venue / Stadium Pitch <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFixtureData.venue}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g. AASTU Main Football Field"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {['AASTU Main Football Field', 'Pitch 1', 'Pitch 2', 'Indoor Sports Hall'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditFixtureData((prev) => ({ ...prev, venue: preset }))}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 hover:text-emerald-300 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Match Status <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={editFixtureData.status}
                    onChange={(e) => setEditFixtureData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="LIVE">Live Match</option>
                    <option value="FULL_TIME">Full Time / Concluded</option>
                    <option value="POSTPONED">Postponed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="WALKOVER">Walkover</option>
                  </select>
                </div>
              </div>

              {/* Notes / Match Report */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Match Notes / Announcement / Briefing
                </label>
                <textarea
                  value={editFixtureData.notes}
                  onChange={(e) => setEditFixtureData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Official match instructions, broadcast notices, or referee details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            </form>

            {/* Fixed Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#2C3960]/60 shrink-0 flex items-center justify-end gap-3 bg-[#0E162E]">
              <button
                type="button"
                onClick={() => {
                  setShowEditFixtureModal(false);
                  setEditFixtureError('');
                  setEditFixtureSuccess('');
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-fixture-form"
                disabled={editFixtureLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {editFixtureLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Fixture Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* APPOINT / REASSIGN BATCH COACH MODAL (PORTAL) */}
      {/* ========================================================================= */}
      {mounted && appointModalOpen && selectedBatchForCoach && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            if (!appointLoading) setAppointModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-purple-500/40 bg-[#0E162E] text-white shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#2C3960]/60 flex items-center justify-between gap-3 bg-[#0E162E]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedBatchForCoach.coach ? 'Reassign Batch Coach' : 'Appoint Batch Coach'}
                  </h3>
                  <p className="text-xs text-purple-300">
                    {selectedBatchForCoach.name} ({selectedBatchForCoach.batch_code})
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={appointLoading}
                onClick={() => setAppointModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form id="appoint-coach-form" onSubmit={handleAssignCoachSubmit} className="p-5 space-y-4">
              {appointSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{appointSuccess}</span>
                </div>
              )}

              {appointError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{appointError}</span>
                </div>
              )}

              {/* Two Credentials Notice */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  Two Credentials System
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  The selected member will be granted a <strong>dedicated Coach Account</strong> to manage batch applications and submit matchday starting line-ups at <code className="text-purple-300 font-mono">/coach</code>. Their personal member account remains separate for pitch participation.
                </p>
              </div>

              {/* Step 1: Select Member */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  1. Select Member from {selectedBatchForCoach.name} <span className="text-rose-400">*</span>
                </label>
                {(() => {
                  const candidateList = selectedBatchForCoach.eligible_members || selectedBatchForCoach.eligible_candidates || [];
                  return candidateList.length > 0 ? (
                    <select
                      value={appointMemberId}
                      onChange={(e) => {
                        setAppointMemberId(e.target.value);
                        const m = candidateList.find((x: any) => String(x.id) === e.target.value);
                        if (m && !appointUsername) {
                          setAppointUsername(`coach_${(m.full_name || 'batch').toLowerCase().split(' ')[0]}`);
                        }
                      }}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- Choose an approved member ({candidateList.length} available) --</option>
                      {candidateList.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} {m.jersey_number || m.preferred_jersey_number ? `(#${m.jersey_number || m.preferred_jersey_number})` : ''} - {m.department || 'Member'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                      ⚠️ No approved members found for this batch. Members must apply and be approved first.
                    </div>
                  );
                })()}
              </div>

              {/* Step 2: Dedicated Coach Username */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  2. Coach Account Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">@</span>
                  <input
                    type="text"
                    value={appointUsername}
                    onChange={(e) => setAppointUsername(e.target.value)}
                    placeholder={`coach_${(selectedBatchForCoach.batch_code || '').toLowerCase()}`}
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Unique username used solely for the coach login.
                </p>
              </div>

              {/* Step 3: Dedicated Coach Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  3. Coach Account Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showAppointPassword ? 'text' : 'password'}
                    value={appointPassword}
                    onChange={(e) => setAppointPassword(e.target.value)}
                    placeholder="Enter secure password (min 6 chars)"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAppointPassword(!showAppointPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showAppointPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Share this password with the appointed coach for their coaching duties.
                </p>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#2C3960]/60 shrink-0 flex items-center justify-end gap-3 bg-[#0E162E]">
              <button
                type="button"
                disabled={appointLoading}
                onClick={() => setAppointModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="appoint-coach-form"
                disabled={appointLoading || !appointMemberId || !appointUsername || !appointPassword}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {appointLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Appointing Coach...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm &amp; Appoint Coach</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* REVOKE COACH ROLE CONFIRMATION MODAL (PORTAL) */}
      {/* ========================================================================= */}
      {mounted && revokeModalOpen && revokeBatchTarget && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            if (!revokeLoading) setRevokeModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-[#0E162E] text-white shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Revoke Coach Role?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Are you sure you want to revoke coach permissions for <strong className="text-white">{revokeBatchTarget.name}</strong>?
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-left">
                ⚠️ The coach login credentials (<code className="font-mono font-bold">@{revokeBatchTarget.coach?.username}</code>) will be deactivated. Roster and lineup management will revert completely to tournament managers. The member's playing profile will remain untouched.
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={revokeLoading}
                  onClick={() => setRevokeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={revokeLoading}
                  onClick={handleRevokeCoachSubmit}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {revokeLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Yes, Revoke Role</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

