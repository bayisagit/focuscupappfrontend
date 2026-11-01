'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Calendar,
  Clock,
  Shield,
  Trophy,
  Flame,
  AlertTriangle,
  ArrowRightLeft,
  Check,
  Edit,
  ArrowLeft,
  RefreshCw,
  Plus,
  Send,
} from 'lucide-react';

export default function ManagerMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Match Event Form
  const [eventType, setEventType] = useState('GOAL');
  const [eventTeamId, setEventTeamId] = useState<number | null>(null);
  const [eventPlayerId, setEventPlayerId] = useState<string>('');
  const [eventRelatedPlayerId, setEventRelatedPlayerId] = useState<string>('');
  const [eventMinute, setEventMinute] = useState('1');
  const [eventDesc, setEventDesc] = useState('');
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Score correction state
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [newHomeScore, setNewHomeScore] = useState(0);
  const [newAwayScore, setNewAwayScore] = useState(0);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Eligible players per batch for the selected match
  const [homePlayers, setHomePlayers] = useState<any[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<any[]>([]);

  const loadMatches = async () => {
    try {
      const [mRes, bRes] = await Promise.all([
        api.matches.list(),
        api.competitions.getBatches(),
      ]);
      const list = mRes.results || mRes || [];
      setMatches(list);
      setBatches(bRes.results || bRes || []);
      if (list.length > 0 && !selectedMatch) {
        loadMatchDetails(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchDetails = async (id: number) => {
    try {
      const matchDetail = await api.matches.getDetail(id);
      setSelectedMatch(matchDetail);
      setEventTeamId(matchDetail.home_team.id);

      // Load batch roster players for selection
      const [homeBatch, awayBatch] = await Promise.all([
        api.competitions.getBatchDetail(matchDetail.home_team.batch_code),
        api.competitions.getBatchDetail(matchDetail.away_team.batch_code),
      ]);
      setHomePlayers(homeBatch.roster || []);
      setAwayPlayers(awayBatch.roster || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleGenerateFixtures = async () => {
    if (!confirm('Generate round-robin fixture schedule for all competing batch teams?')) return;
    setGenerating(true);
    try {
      const res = await api.manager.generateFixtures();
      alert(res.message);
      loadMatches();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to generate fixtures.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishMatch = async () => {
    if (!selectedMatch) return;
    if (!confirm(`Publish final result: ${selectedMatch.home_team.name} ${selectedMatch.home_score} - ${selectedMatch.away_score} ${selectedMatch.away_team.name}? Official standings will update automatically.`)) return;

    try {
      const res = await api.manager.publishMatch(selectedMatch.id);
      alert(res.message);
      loadMatchDetails(selectedMatch.id);
      loadMatches();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to publish match.');
    }
  };

  const handleRecordEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !eventTeamId) return;
    setEventSubmitting(true);

    try {
      const res = await api.manager.addMatchEvent(selectedMatch.id, {
        event_type: eventType,
        team_id: eventTeamId,
        player_id: eventPlayerId ? Number(eventPlayerId) : null,
        related_player_id: eventRelatedPlayerId ? Number(eventRelatedPlayerId) : null,
        minute: Number(eventMinute),
        description: eventDesc,
      });
      alert(res.message);
      setEventDesc('');
      setEventPlayerId('');
      setEventRelatedPlayerId('');
      loadMatchDetails(selectedMatch.id);
      loadMatches();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to record event.');
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleCorrectResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setCorrecting(true);

    try {
      const res = await api.manager.correctMatch(
        selectedMatch.id,
        newHomeScore,
        newAwayScore,
        correctionReason
      );
      alert(res.message);
      setCorrectModalOpen(false);
      loadMatchDetails(selectedMatch.id);
      loadMatches();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to correct match.');
    } finally {
      setCorrecting(false);
    }
  };

  // Get active player pool based on selected team in event form
  const isHomeSelected = selectedMatch && eventTeamId === selectedMatch.home_team?.id;
  const activeTeamPlayers = isHomeSelected ? homePlayers : awayPlayers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/manager/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 border-b border-[#2C3960]/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-8 h-8 text-emerald-400" />
            MATCH OPERATIONS &amp; LIVE EVENTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate fixtures, manage match scores, record real-time goals, and publish official results
          </p>
        </div>

        <button
          onClick={handleGenerateFixtures}
          disabled={generating}
          className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Scheduling...' : 'Generate Round-Robin Fixtures'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Match Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            Select Fixture ({matches.length})
          </h2>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {matches.map((m) => {
              const isSelected = selectedMatch?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => loadMatchDetails(m.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'card-gloss border-[#2C3960] hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span>Round {m.round_number} &bull; {m.match_date}</span>
                    <span
                      className={`px-2 py-0.5 rounded uppercase ${
                        m.is_published ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.is_published ? 'Published' : m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="truncate">{m.home_team.name}</span>
                    <span className="px-2 py-0.5 rounded bg-[#161D36] text-emerald-400 font-black">
                      {m.home_score} - {m.away_score}
                    </span>
                    <span className="truncate">{m.away_team.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Match Action Center (8 cols) */}
        {selectedMatch ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Header & Score Action Card */}
            <div className="card-gloss p-6 rounded-3xl border border-[#2C3960] shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-[#2C3960]/60 pb-3">
                <span className="text-slate-400">
                  Round {selectedMatch.round_number} &bull; {selectedMatch.match_date} &bull; {selectedMatch.venue}
                </span>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-emerald-400">
                  {selectedMatch.is_published ? 'Published to Official Standings' : 'Draft / Unofficial'}
                </span>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-7 items-center text-center py-2">
                <div className="col-span-3">
                  <h3 className="text-base font-extrabold text-white">{selectedMatch.home_team.name}</h3>
                  <span className="text-[10px] text-slate-400">{selectedMatch.home_team.nickname}</span>
                </div>
                <div className="col-span-1">
                  <div className="px-4 py-2 rounded-xl bg-[#0B132B] border-2 border-emerald-500/50 text-emerald-400 font-black text-2xl">
                    {selectedMatch.home_score} - {selectedMatch.away_score}
                  </div>
                </div>
                <div className="col-span-3">
                  <h3 className="text-base font-extrabold text-white">{selectedMatch.away_team.name}</h3>
                  <span className="text-[10px] text-slate-400">{selectedMatch.away_team.nickname}</span>
                </div>
              </div>

              {/* Publishing & Correcting Actions */}
              <div className="pt-3 border-t border-[#2C3960]/60 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {!selectedMatch.is_published ? (
                    <button
                      onClick={handlePublishMatch}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                    >
                      <Check className="w-4 h-4" /> Publish Match Result
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Result Officially Published
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setNewHomeScore(selectedMatch.home_score);
                    setNewAwayScore(selectedMatch.away_score);
                    setCorrectModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-[#2C3960]"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" /> Correct Score &amp; Audit
                </button>
              </div>
            </div>

            {/* Event Recording Card */}
            <div className="card-gloss p-6 rounded-3xl border border-[#2C3960] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                Record Live Match Incident / Event
              </h3>

              <form onSubmit={handleRecordEvent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Incident Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="GOAL">Goal Scored</option>
                      <option value="ASSIST">Goal Assist</option>
                      <option value="OWN_GOAL">Own Goal (Against Team)</option>
                      <option value="YELLOW_CARD">Yellow Card</option>
                      <option value="RED_CARD">Red Card</option>
                      <option value="SUBSTITUTION">Substitution</option>
                      <option value="NOTE">Incident / Note</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Batch Team</label>
                    <select
                      value={eventTeamId || ''}
                      onChange={(e) => {
                        setEventTeamId(Number(e.target.value));
                        setEventPlayerId('');
                      }}
                      className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value={selectedMatch.home_team.id}>{selectedMatch.home_team.name}</option>
                      <option value={selectedMatch.away_team.id}>{selectedMatch.away_team.name}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Match Minute (&apos;)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={eventMinute}
                      onChange={(e) => setEventMinute(e.target.value)}
                      className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Player Selector strictly filtered to batch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Player ({isHomeSelected ? selectedMatch.home_team.name : selectedMatch.away_team.name})
                    </label>
                    <select
                      value={eventPlayerId}
                      onChange={(e) => setEventPlayerId(e.target.value)}
                      className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">Select registered batch player...</option>
                      {activeTeamPlayers.map((p) => (
                        <option key={p.member_id} value={p.member_id}>
                          #{p.jersey_number} {p.full_name} ({p.position})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Assister / Subbed Player (Optional)
                    </label>
                    <select
                      value={eventRelatedPlayerId}
                      onChange={(e) => setEventRelatedPlayerId(e.target.value)}
                      className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="">None / N/A</option>
                      {activeTeamPlayers.map((p) => (
                        <option key={p.member_id} value={p.member_id}>
                          #{p.jersey_number} {p.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Event Note / Description</label>
                  <input
                    type="text"
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="e.g. Curled free kick into the top left corner"
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={eventSubmitting}
                    className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Record Event
                  </button>
                </div>
              </form>
            </div>

            {/* Current Recorded Events List */}
            <div className="card-gloss p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recorded Events ({selectedMatch.events?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedMatch.events && selectedMatch.events.length > 0 ? (
                  selectedMatch.events.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#161D36] border border-[#2C3960] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-bold">{ev.minute}&apos;</span>
                        <span className="font-bold text-white">{ev.event_type_display}</span>
                        <span className="text-slate-300">({ev.player_name || 'Team'})</span>
                        <span className="text-slate-500 text-[11px]">&bull; {ev.team_name}</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm('Delete this event?')) return;
                          await api.manager.deleteMatchEvent(selectedMatch.id, ev.id);
                          loadMatchDetails(selectedMatch.id);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No events logged yet.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 card-gloss p-12 rounded-3xl text-center text-slate-400">
            Select a fixture to manage events, scores, and publishing.
          </div>
        )}
      </div>

      {/* Correct Score Modal */}
      {correctModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-gloss max-w-md w-full p-6 rounded-3xl border border-amber-500/40 space-y-4">
            <h3 className="text-base font-bold text-white">Correct Official Match Score</h3>
            <p className="text-xs text-slate-400">
              Any changes to official scores will recalculate league standings and record a permanent audit log.
            </p>

            <form onSubmit={handleCorrectResult} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {selectedMatch.home_team.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newHomeScore}
                    onChange={(e) => setNewHomeScore(Number(e.target.value))}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl p-2.5 text-xs text-white text-center font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {selectedMatch.away_team.name}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newAwayScore}
                    onChange={(e) => setNewAwayScore(Number(e.target.value))}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl p-2.5 text-xs text-white text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason for Correction (Audited)
                </label>
                <input
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Referee scorebook confirmation error"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={correcting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {correcting ? 'Correcting...' : 'Save & Recalculate Standings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
