'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Trophy,
  ArrowLeft,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  Sparkles,
  Maximize2,
  X,
  Shirt,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

export default function ManagerGraphicsArchivePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [graphics, setGraphics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [roundFilter, setRoundFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox State
  const [selectedGraphic, setSelectedGraphic] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadGraphics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.matches.getGraphics();
      setGraphics(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.data?.error || 'Failed to load match graphics archive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || !user.is_manager)) {
      router.push('/manager/login');
      return;
    }
    if (user?.is_manager) {
      loadGraphics();
    }
  }, [user, authLoading, router]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedGraphic(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this archived graphic?')) return;
    setDeletingId(id);
    try {
      await api.matches.deleteGraphic(id);
      setGraphics((prev) => prev.filter((g) => g.id !== id));
      if (selectedGraphic?.id === id) {
        setSelectedGraphic(null);
      }
    } catch (err: any) {
      alert(err?.data?.error || 'Failed to delete graphic.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered List
  const filteredGraphics = useMemo(() => {
    return graphics.filter((g) => {
      // Batch filter
      if (batchFilter !== 'ALL') {
        const matchesTeam = g.team_batch_code === batchFilter || g.opponent_batch_code === batchFilter;
        if (!matchesTeam) return false;
      }
      // Round filter
      if (roundFilter !== 'ALL' && String(g.round_number) !== String(roundFilter)) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'LINEUP_POSTER' && g.graphic_type !== 'LINEUP_POSTER') return false;
        if (typeFilter === 'BROADCAST' && !g.graphic_type.startsWith('BROADCAST')) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (g.title || '').toLowerCase().includes(q);
        const teamMatch = (g.team_name || '').toLowerCase().includes(q);
        const oppMatch = (g.opponent_name || '').toLowerCase().includes(q);
        if (!titleMatch && !teamMatch && !oppMatch) return false;
      }
      return true;
    });
  }, [graphics, batchFilter, roundFilter, typeFilter, searchQuery]);

  // Counts
  const lineupCount = useMemo(() => graphics.filter((g) => g.graphic_type === 'LINEUP_POSTER').length, [graphics]);
  const broadcastCount = useMemo(() => graphics.filter((g) => g.graphic_type.startsWith('BROADCAST')).length, [graphics]);

  if (authLoading || (loading && graphics.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading Match Graphics &amp; Posters Archive...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/manager/dashboard"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/manager/matches"
            className="px-3.5 py-1.5 rounded-xl bg-[#1C2541] hover:bg-[#232F54] text-white border border-[#2C3960] font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Match Operations
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Official Archives
              </span>
              <span className="text-xs text-slate-400">Historical Match Posters &amp; Broadcast Cards</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-8 h-8 text-purple-400" />
              MATCHDAY GRAPHICS &amp; POSTERS ARCHIVE
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Permanent repository of official Starting Lineup Posters and Live Match Broadcast Graphics. Review squad selections, tactical formations, and broadcast graphics across every tournament round.
            </p>
          </div>

          {/* KPI Pills */}
          <div className="flex items-center gap-3">
            <div className="card-gloss px-4 py-2.5 rounded-2xl text-center border border-[#2C3960]/80">
              <p className="text-xl font-black text-white">{graphics.length}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Total Graphics</p>
            </div>
            <div className="card-gloss px-4 py-2.5 rounded-2xl text-center border border-[#2C3960]/80">
              <p className="text-xl font-black text-emerald-400">{lineupCount}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Lineup Posters</p>
            </div>
            <div className="card-gloss px-4 py-2.5 rounded-2xl text-center border border-[#2C3960]/80">
              <p className="text-xl font-black text-amber-400">{broadcastCount}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Broadcast Cards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-gloss p-4 rounded-2xl border border-[#2C3960] mb-8 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by match or team..."
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="ALL">All Batches</option>
              <option value="5TH_YEAR">5th Year Batch</option>
              <option value="4TH_YEAR">4th Year Batch</option>
              <option value="3RD_YEAR">3rd Year Batch</option>
              <option value="2ND_YEAR">2nd Year Batch</option>
            </select>
          </div>

          {/* Round Filter */}
          <div>
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="ALL">All Tournament Rounds</option>
              <option value="1">Round 1</option>
              <option value="2">Round 2</option>
              <option value="3">Round 3</option>
              <option value="4">Round 4</option>
              <option value="5">Round 5</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
            >
              <option value="ALL">All Graphic Types</option>
              <option value="LINEUP_POSTER">Starting Lineup Posters Only</option>
              <option value="BROADCAST">Match Broadcast Graphics Only</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(batchFilter !== 'ALL' || roundFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#2C3960]/60 text-[11px] text-slate-400">
            <span>
              Showing {filteredGraphics.length} of {graphics.length} archived graphics
            </span>
            <button
              onClick={() => {
                setBatchFilter('ALL');
                setRoundFilter('ALL');
                setTypeFilter('ALL');
                setSearchQuery('');
              }}
              className="text-purple-400 hover:text-purple-300 font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Grid of Published Graphics */}
      {filteredGraphics.length === 0 ? (
        <div className="card-gloss p-16 rounded-3xl border border-[#2C3960] text-center space-y-4 my-8">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
            <Shirt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Match Graphics Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {graphics.length === 0
              ? 'No lineup posters or broadcast graphics have been published yet. Go to Match Operations to generate and publish your first official lineup poster!'
              : 'No graphics match your selected filters. Try adjusting the batch, round, or type filter.'}
          </p>
          <div className="pt-2">
            <Link
              href="/manager/matches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
            >
              <Calendar className="w-4 h-4" /> Open Match Operations
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGraphics.map((item) => {
            const isLineup = item.graphic_type === 'LINEUP_POSTER';
            const snapshot = item.data_snapshot || {};
            const startersCount = snapshot.starters?.length || 0;

            return (
              <div
                key={item.id}
                className="card-gloss rounded-2xl border border-[#2C3960] overflow-hidden flex flex-col hover:border-purple-500/50 transition-all hover:shadow-xl group"
              >
                {/* Image Container with Hover Lightbox Click */}
                <div
                  onClick={() => setSelectedGraphic(item)}
                  className="relative aspect-[3/4] bg-[#0B132B] cursor-pointer overflow-hidden group-hover:brightness-105 transition-all"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    loading="lazy"
                  />

                  {/* Top Badge Overlay */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-sm text-[10px] font-black text-white border border-white/20">
                      RD {item.round_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border backdrop-blur-sm ${
                        isLineup
                          ? 'bg-emerald-500/80 text-white border-emerald-400'
                          : 'bg-amber-500/80 text-slate-950 border-amber-400'
                      }`}
                    >
                      {isLineup ? 'Starting XI' : 'Broadcast'}
                    </span>
                  </div>

                  {/* Hover Inspect Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5" /> View Fullscreen
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.team_name} {item.opponent_name ? `vs ${item.opponent_name}` : ''}
                    </p>

                    {/* Snapshot Metadata Snippet */}
                    {isLineup && snapshot.starters && (
                      <div className="mt-2 text-[10px] text-slate-300 line-clamp-2 leading-relaxed bg-[#161D36]/80 p-2 rounded-lg border border-[#2C3960]/60">
                        <span className="font-semibold text-emerald-400">Starters ({startersCount}): </span>
                        {snapshot.starters.map((s: any) => s.player_name).join(', ')}
                      </div>
                    )}

                    {!isLineup && snapshot.home_score !== undefined && (
                      <div className="mt-2 text-[10px] text-slate-300 bg-[#161D36]/80 p-2 rounded-lg border border-[#2C3960]/60 flex items-center justify-between">
                        <span className="font-bold text-white">Score: {snapshot.home_score} - {snapshot.away_score}</span>
                        {snapshot.potm && (
                          <span className="text-amber-300 font-semibold truncate max-w-[120px]">
                            🏆 {snapshot.potm.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-[#2C3960]/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        title="Open Image"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
                        title="Delete from Archive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULLSCREEN PHOTO LIGHTBOX (Matches project style) */}
      {/* ========================================================================= */}
      {selectedGraphic && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedGraphic(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl bg-[#0B132B] border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Fullscreen High-Resolution Graphic Viewer */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-[350px]">
              <img
                src={selectedGraphic.image_url}
                alt={selectedGraphic.title}
                className="max-h-[85vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />

              {/* Lightbox Close Button */}
              <button
                type="button"
                onClick={() => setSelectedGraphic(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-colors"
                title="Close Lightbox (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Authoritative Match & Squad Inspector Drawer */}
            <div className="w-full md:w-80 lg:w-96 bg-[#161D36] border-t md:border-t-0 md:border-l border-[#2C3960] p-6 flex flex-col justify-between overflow-y-auto max-h-[85vh]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Round {selectedGraphic.round_number} Archive
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(selectedGraphic.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    {selectedGraphic.title}
                  </h2>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    {selectedGraphic.team_name} {selectedGraphic.opponent_name ? `vs ${selectedGraphic.opponent_name}` : ''}
                  </p>
                </div>

                {/* Match Summary Info */}
                {selectedGraphic.match_summary && (
                  <div className="p-3 rounded-xl bg-[#0B132B] border border-[#2C3960]/80 space-y-1.5 text-xs">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Fixture Context</p>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Date &amp; Kick-off:</span>
                      <span className="text-white font-semibold">
                        {selectedGraphic.match_summary.match_date} • {selectedGraphic.match_summary.kick_off_time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Match Status:</span>
                      <span className="text-emerald-400 font-bold">
                        {selectedGraphic.match_summary.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* Lineup Squad Snapshot Inspection */}
                {selectedGraphic.graphic_type === 'LINEUP_POSTER' && selectedGraphic.data_snapshot && (
                  <div className="space-y-3">
                    {selectedGraphic.data_snapshot.formation && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Formation:</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-black text-[11px]">
                          {selectedGraphic.data_snapshot.formation}
                        </span>
                      </div>
                    )}

                    {selectedGraphic.data_snapshot.featured_player && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <p className="text-[10px] font-bold text-amber-400 uppercase">Spotlight Hero Player</p>
                        <p className="text-white font-black mt-0.5">
                          #{selectedGraphic.data_snapshot.featured_player.jersey_number} {selectedGraphic.data_snapshot.featured_player.player_name}
                        </p>
                      </div>
                    )}

                    {/* Starters List */}
                    {selectedGraphic.data_snapshot.starters?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-emerald-400" />
                          Starting XI ({selectedGraphic.data_snapshot.starters.length})
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                          {selectedGraphic.data_snapshot.starters.map((s: any, idx: number) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0B132B] text-xs flex items-center justify-between"
                            >
                              <span className="text-slate-200 font-semibold truncate">
                                {s.is_captain && <span className="text-amber-400 mr-1">©</span>}
                                {s.is_goalkeeper && <span className="mr-1">🧤</span>}
                                {s.player_name}
                              </span>
                              <span className="font-black text-emerald-400">#{s.jersey_number}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Substitutes List */}
                    {selectedGraphic.data_snapshot.substitutes?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-300">
                          Substitutes ({selectedGraphic.data_snapshot.substitutes.length})
                        </p>
                        <p className="text-[11px] text-slate-400 bg-[#0B132B] p-2 rounded-lg leading-relaxed">
                          {selectedGraphic.data_snapshot.substitutes.map((sub: any) => `${sub.player_name} #${sub.jersey_number}`).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Broadcast Events Snapshot Inspection */}
                {selectedGraphic.graphic_type.startsWith('BROADCAST') && selectedGraphic.data_snapshot && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#0B132B] border border-emerald-500/20 text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Final Score</p>
                      <p className="text-2xl font-black text-white mt-1">
                        {selectedGraphic.data_snapshot.home_score} - {selectedGraphic.data_snapshot.away_score}
                      </p>
                    </div>

                    {selectedGraphic.data_snapshot.potm && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <p className="text-[10px] font-bold text-amber-400 uppercase">Player of the Match</p>
                        <p className="text-white font-black mt-0.5">
                          🏆 {selectedGraphic.data_snapshot.potm.name} ({selectedGraphic.data_snapshot.potm.team})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-6 border-t border-[#2C3960]/80 space-y-2 mt-4">
                <a
                  href={selectedGraphic.image_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Download className="w-4 h-4" /> Download High-Res PNG
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedGraphic(null)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

