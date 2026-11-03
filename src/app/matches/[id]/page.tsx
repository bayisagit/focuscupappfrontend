'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Award,
  Users,
  Flame,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';

import { Suspense } from 'react';

function MatchDetailContent() {
  const { id } = useParams();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'report'>('timeline');

  useEffect(() => {
    if (id) {
      api.matches.getDetail(id as string)
        .then((data) => setMatch(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading Match Center...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10">
        <h2 className="text-lg font-bold text-white mb-2">Match Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The requested fixture does not exist or has been removed.</p>
        <Link href="/fixtures" className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
          Back to Fixtures
        </Link>
      </div>
    );
  }

  const isCompleted = match.status === 'COMPLETED';
  const isLive = match.status === 'LIVE' || match.status === 'HALF_TIME';

  const homeEvents = match.events?.filter((ev: any) =>
    ev.team_batch === match.home_team.batch_code || ev.team === match.home_team.id
  ) || [];

  const awayEvents = match.events?.filter((ev: any) =>
    ev.team_batch === match.away_team.batch_code || ev.team === match.away_team.id
  ) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* 1. MATCH HEADER & SCOREBOARD */}
      <div className="card-gloss rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2C3960] mb-8 relative overflow-hidden">
        {/* Match Meta Top Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-b border-[#2C3960]/60 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white bg-slate-800 px-2.5 py-1 rounded text-[11px]">
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

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {match.venue}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" /> LIVE
              </span>
            )}
            {isCompleted && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Full Time
              </span>
            )}
          </div>
        </div>

        {/* Big Match Scoreboard */}
        <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 py-4">
          {/* Home Batch */}
          <div className="flex-1 text-center sm:text-right space-y-1.5 sm:space-y-2 min-w-0">
            <TeamCrest team={match.home_team} size="lg" className="mx-auto sm:ml-auto sm:mr-0" />
            <h2 className="text-base sm:text-2xl font-black text-white tracking-tight break-words">
              {match.home_team.name}
            </h2>
            <p className="text-[10px] sm:text-xs text-amber-400 font-semibold truncate sm:whitespace-normal">
              &ldquo;{match.home_team.nickname || match.home_team.motto}&rdquo;
            </p>
          </div>

          {/* Central Score Display */}
          <div className="shrink-0 px-1 sm:px-4 text-center">
            {isCompleted || isLive ? (
              <div className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-[#0B132B] border-2 border-emerald-500/50 text-emerald-400 font-black text-2xl sm:text-3xl md:text-4xl shadow-inner whitespace-nowrap tabular-nums tracking-wider select-none">
                <span>{match.home_score}</span>
                <span className="mx-1.5 sm:mx-2.5 text-slate-500 text-xl sm:text-2xl md:text-3xl font-light">-</span>
                <span>{match.away_score}</span>
              </div>
            ) : (
              <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#2C3960] text-slate-300 font-extrabold text-xs sm:text-base whitespace-nowrap">
                VS
              </div>
            )}
            <span className="block text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 font-medium uppercase tracking-wider whitespace-nowrap">
              {isCompleted ? 'Final Score' : (isLive ? 'In Play' : 'Scheduled')}
            </span>
          </div>

          {/* Away Batch */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 sm:space-y-2 min-w-0">
            <TeamCrest team={match.away_team} size="lg" className="mx-auto sm:mr-auto sm:ml-0" />
            <h2 className="text-base sm:text-2xl font-black text-white tracking-tight break-words">
              {match.away_team.name}
            </h2>
            <p className="text-[10px] sm:text-xs text-blue-400 font-semibold truncate sm:whitespace-normal">
              &ldquo;{match.away_team.nickname || match.away_team.motto}&rdquo;
            </p>
          </div>
        </div>

        {/* Compact Key Match Events (Screenshot & Telegram Share Card) */}
        {(homeEvents.length > 0 || awayEvents.length > 0) && (
          <div className="mt-6 pt-5 border-t border-[#2C3960]/60 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
              <span>Match Scoring &amp; Cards Summary</span>
              <span className="text-emerald-400 font-mono">Telegram / Share Card</span>
            </div>

            {/* Row 1: Home Batch Events */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-xl bg-[#0B132B]/90 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: match.home_team.color_hex || '#10B981' }}
                />
                <span className="font-extrabold text-white text-[12px]">{match.home_team.name}:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:text-right">
                {homeEvents.length > 0 ? (
                  homeEvents.map((ev: any) => (
                    <span key={ev.id} className="inline-flex items-center gap-1 text-[11px] bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-200">
                      {ev.event_type === 'GOAL' && <span>⚽</span>}
                      {ev.event_type === 'OWN_GOAL' && <span>⚠️ (OG)</span>}
                      {ev.event_type === 'YELLOW_CARD' && <span>🟨</span>}
                      {ev.event_type === 'RED_CARD' && <span>🟥</span>}
                      {ev.event_type === 'SUBSTITUTION' && <span>🔄</span>}
                      <span className="font-bold text-white">{ev.player_name || 'Player'}</span>
                      <span className="text-emerald-400 font-black">{ev.minute}&apos;</span>
                      {ev.related_player_name && ev.event_type === 'GOAL' && (
                        <span className="text-slate-400 text-[10px] font-medium">(Assist: {ev.related_player_name})</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No events recorded</span>
                )}
              </div>
            </div>

            {/* Row 2: Away Batch Events */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-xl bg-[#0B132B]/90 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: match.away_team.color_hex || '#3B82F6' }}
                />
                <span className="font-extrabold text-white text-[12px]">{match.away_team.name}:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:text-right">
                {awayEvents.length > 0 ? (
                  awayEvents.map((ev: any) => (
                    <span key={ev.id} className="inline-flex items-center gap-1 text-[11px] bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800 text-slate-200">
                      {ev.event_type === 'GOAL' && <span>⚽</span>}
                      {ev.event_type === 'OWN_GOAL' && <span>⚠️ (OG)</span>}
                      {ev.event_type === 'YELLOW_CARD' && <span>🟨</span>}
                      {ev.event_type === 'RED_CARD' && <span>🟥</span>}
                      {ev.event_type === 'SUBSTITUTION' && <span>🔄</span>}
                      <span className="font-bold text-white">{ev.player_name || 'Player'}</span>
                      <span className="text-blue-400 font-black">{ev.minute}&apos;</span>
                      {ev.related_player_name && ev.event_type === 'GOAL' && (
                        <span className="text-slate-400 text-[10px] font-medium">(Assist: {ev.related_player_name})</span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No events recorded</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player of the Match Banner */}
        {match.player_of_the_match_details && (
          <div className="mt-8 pt-4 border-t border-[#2C3960]/60 flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              {(match.player_of_the_match_details.profile_picture || match.player_of_the_match_details.avatar_url || match.player_of_the_match_details.profile_picture_url) ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0">
                  <img
                    src={match.player_of_the_match_details.profile_picture || match.player_of_the_match_details.avatar_url || match.player_of_the_match_details.profile_picture_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md shrink-0">
                  <Award className="w-6 h-6" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  Player of the Match Award
                </span>
                <Link
                  href={`/members/${match.player_of_the_match_details.username}`}
                  className="text-sm font-extrabold text-white hover:text-emerald-400 transition-colors"
                >
                  {match.player_of_the_match_details.full_name} ({match.player_of_the_match_details.batch})
                </Link>
                {match.player_of_the_match_details.personal_chant && (
                  <p className="text-[11px] text-slate-300 italic">
                    &ldquo;{match.player_of_the_match_details.personal_chant}&rdquo;
                  </p>
                )}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full">
                Exemplary Performance
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MATCH DETAILS TABS */}
      <div className="flex items-center border-b border-[#2C3960] mb-6 space-x-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'timeline'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Match Timeline &amp; Events
        </button>
        <button
          onClick={() => setActiveTab('lineups')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'lineups'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Team Squads &amp; Line-ups
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'report'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> Fellowship Match Report
        </button>
      </div>

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="card-gloss p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Chronological Match Events
          </h3>

          {match.events && match.events.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-6 before:w-0.5 before:bg-[#2C3960]">
              {match.events.map((ev: any) => {
                const isHome = ev.team_batch === match.home_team.batch_code;
                const isGoal = ev.event_type === 'GOAL';
                const isOwnGoal = ev.event_type === 'OWN_GOAL';
                const isYellow = ev.event_type === 'YELLOW_CARD';
                const isRed = ev.event_type === 'RED_CARD';
                const isSub = ev.event_type === 'SUBSTITUTION';

                return (
                  <div key={ev.id} className="relative flex items-start gap-4 pl-12 group">
                    {/* Event Minute Badge on timeline */}
                    <div className="absolute left-3 -translate-x-1/2 w-7 h-7 rounded-full bg-[#1C2541] border-2 border-emerald-500/60 flex items-center justify-center text-[10px] font-black text-emerald-400">
                      {ev.minute}&apos;
                    </div>

                    <div className="flex-1 p-3.5 rounded-xl bg-[#161D36]/80 border border-[#2C3960]/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {isGoal && <Flame className="w-4 h-4 text-emerald-400" />}
                          {isOwnGoal && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                          {isYellow && <span className="w-3 h-4 rounded bg-amber-400 inline-block" />}
                          {isRed && <span className="w-3 h-4 rounded bg-rose-500 inline-block" />}
                          {isSub && <ArrowRightLeft className="w-4 h-4 text-blue-400" />}
                          {ev.event_type_display}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {ev.team_name}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-200">
                        {ev.player_name || 'Team Action'}
                        {ev.related_player_name && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            {' '}(Assist: {ev.related_player_name})
                          </span>
                        )}
                      </p>

                      {ev.description && (
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              No match incidents or events have been recorded yet.
            </p>
          )}
        </div>
      )}

      {/* TAB CONTENT: LINEUPS */}
      {activeTab === 'lineups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home Squad */}
          <div className="card-gloss p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-4 pb-2 border-b border-[#2C3960] flex items-center justify-between">
              <span>{match.home_team.name} Squad</span>
              <span className="text-xs text-emerald-400 font-medium">Home Roster</span>
            </h4>
            <div className="space-y-2">
              {match.home_squad && match.home_squad.length > 0 ? (
                match.home_squad.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#161D36]/60 border border-[#2C3960]/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                        #{item.jersey_number}
                      </span>
                      {item.player_photo && (
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-400/30 shrink-0">
                          <img src={item.player_photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 truncate">
                        <Link
                          href={`/members/${item.player_username}`}
                          className="text-xs font-bold text-white hover:text-emerald-400 truncate block"
                        >
                          {item.player_name}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {item.position || 'Player'}
                        </span>
                      </div>
                    </div>
                    {item.is_goalkeeper ? (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">GK</span>
                    ) : item.is_starter ? (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">Starter</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Sub</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No squad selections recorded yet.</p>
              )}
            </div>
          </div>

          {/* Away Squad */}
          <div className="card-gloss p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-4 pb-2 border-b border-[#2C3960] flex items-center justify-between">
              <span>{match.away_team.name} Squad</span>
              <span className="text-xs text-blue-400 font-medium">Away Roster</span>
            </h4>
            <div className="space-y-2">
              {match.away_squad && match.away_squad.length > 0 ? (
                match.away_squad.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#161D36]/60 border border-[#2C3960]/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
                        #{item.jersey_number}
                      </span>
                      {item.player_photo && (
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-blue-400/30 shrink-0">
                          <img src={item.player_photo} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 truncate">
                        <Link
                          href={`/members/${item.player_username}`}
                          className="text-xs font-bold text-white hover:text-blue-400 truncate block"
                        >
                          {item.player_name}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {item.position || 'Player'}
                        </span>
                      </div>
                    </div>
                    {item.is_goalkeeper ? (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">GK</span>
                    ) : item.is_starter ? (
                      <span className="text-[9px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">Starter</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Sub</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No squad selections recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPORT */}
      {activeTab === 'report' && (
        <div className="card-gloss p-6 sm:p-8 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Official Fellowship Match Commentary &amp; Summary
          </h3>
          {match.match_report ? (
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line p-4 rounded-xl bg-[#161D36]/70 border border-[#2C3960]">
              {match.match_report}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              The official match report will be compiled by the tournament manager upon match completion.
            </p>
          )}

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs italic text-emerald-300">
              &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-slate-400">Loading match center...</div>}>
      <MatchDetailContent />
    </Suspense>
  );
}
