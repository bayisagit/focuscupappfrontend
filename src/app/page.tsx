'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Trophy,
  Calendar,
  Users,
  Flame,
  Star,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Shield,
  Heart,
  ArrowUpRight,
  Radio,
} from 'lucide-react';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [latestAndNext, setLatestAndNext] = useState<any>({ latest_result: null, next_upcoming: null });
  const [standings, setStandings] = useState<any[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [mostFollowed, setMostFollowed] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [
          seasonRes,
          matchesRes,
          standingsRes,
          scorersRes,
          assistsRes,
          followedRes,
          batchesRes,
          announcementsRes,
          summaryRes,
        ] = await Promise.allSettled([
          api.competitions.getActiveSeason(),
          api.matches.getLatestAndNext(),
          api.competitions.getStandings(),
          api.statistics.getTopScorers(5),
          api.statistics.getTopAssists(5),
          api.statistics.getMostFollowed(6),
          api.competitions.getBatches(),
          api.community.getAnnouncements(),
          api.statistics.getSummary(),
        ]);

        if (seasonRes.status === 'fulfilled') setActiveSeason(seasonRes.value);
        if (matchesRes.status === 'fulfilled') setLatestAndNext(matchesRes.value);
        if (standingsRes.status === 'fulfilled') setStandings(standingsRes.value.standings || []);
        if (scorersRes.status === 'fulfilled') setTopScorers(scorersRes.value || []);
        if (assistsRes.status === 'fulfilled') setTopAssists(assistsRes.value || []);
        if (followedRes.status === 'fulfilled') setMostFollowed(followedRes.value || []);
        if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value.results || batchesRes.value || []);
        if (announcementsRes.status === 'fulfilled') setAnnouncements(announcementsRes.value.results || announcementsRes.value || []);
        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value || null);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="pitch-bg min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-[#2C3960]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Vision & Brand */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {activeSeason?.name || 'Focus Football Cup 2026/27'}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                CELEBRATING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
                  UNITY, JOY &amp; FAITH
                </span>{' '}
                ON THE PITCH
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-medium max-w-xl leading-relaxed">
                The official semester-based tournament and digital fellowship platform for{' '}
                <strong className="text-white font-bold">AASTU Focus Fellowship</strong>. Discover members across batches, follow match results, and celebrate fellowship in Christ.
              </p>

              {/* Fellowship Core Motto Callout */}
              <div className="p-4 rounded-2xl bg-[#1C2541]/90 border-l-4 border-emerald-500 shadow-xl backdrop-blur-md">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
                  Our Central Fellowship Motto
                </p>
                <p className="text-sm font-semibold italic text-white">
                  &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/standings"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  View League Table
                </Link>
                <Link
                  href="/members"
                  className="px-6 py-3 rounded-xl bg-[#1C2541] hover:bg-[#232F54] text-white border border-[#2C3960] font-bold text-sm transition-all hover:border-emerald-500/40 flex items-center gap-2"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  Explore Members
                </Link>
              </div>

              {/* Tournament Stat Quick Stats */}
              {summary && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-4 border-t border-[#2C3960]/60">
                  <div className="p-3 rounded-xl bg-[#1C2541]/60">
                    <p className="text-2xl font-black text-white">{summary.total_members}</p>
                    <p className="text-[11px] text-slate-400 font-medium uppercase">Members</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1C2541]/60">
                    <p className="text-2xl font-black text-emerald-400">{summary.approved_players}</p>
                    <p className="text-[11px] text-slate-400 font-medium uppercase">Roster Players</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1C2541]/60">
                    <p className="text-2xl font-black text-amber-400">{summary.total_goals}</p>
                    <p className="text-[11px] text-slate-400 font-medium uppercase">Goals Scored</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1C2541]/60">
                    <p className="text-2xl font-black text-blue-400">{summary.completed_matches}</p>
                    <p className="text-[11px] text-slate-400 font-medium uppercase">Matches Played</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Latest Result & Next Match Cards */}
            <div className="lg:col-span-5 space-y-4">
              {/* Card 1: Latest Match Result */}
              {latestAndNext.latest_result ? (
                <div className="card-gloss p-5 rounded-2xl shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> Latest Match Result
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                      Round {latestAndNext.latest_result.round_number}
                    </span>
                  </div>

                  {/* Scoreboard */}
                  <div className="grid grid-cols-7 items-center gap-2 py-2">
                    <div className="col-span-3 text-right">
                      <p className="text-sm font-bold text-white truncate">
                        {latestAndNext.latest_result.home_team.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {latestAndNext.latest_result.home_team.nickname || 'Warriors'}
                      </span>
                    </div>

                    <div className="col-span-1 text-center">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-lg">
                        {latestAndNext.latest_result.home_score} - {latestAndNext.latest_result.away_score}
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1 uppercase font-bold">FT</span>
                    </div>

                    <div className="col-span-3 text-left">
                      <p className="text-sm font-bold text-white truncate">
                        {latestAndNext.latest_result.away_team.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {latestAndNext.latest_result.away_team.nickname || 'Light Bearers'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {latestAndNext.latest_result.match_date} &bull; {latestAndNext.latest_result.venue}
                    </span>
                    <Link
                      href={`/matches/${latestAndNext.latest_result.id}`}
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Match Center <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="card-gloss p-6 rounded-2xl text-center text-slate-400">
                  <p className="text-xs">No completed matches published yet.</p>
                </div>
              )}

              {/* Card 2: Next Upcoming Match */}
              {latestAndNext.next_upcoming ? (
                <div className="card-gloss p-5 rounded-2xl shadow-2xl relative overflow-hidden border-emerald-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Next Upcoming Match
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Round {latestAndNext.next_upcoming.round_number}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-2 py-2">
                    <div className="col-span-3 text-right">
                      <p className="text-sm font-bold text-white truncate">
                        {latestAndNext.next_upcoming.home_team.name}
                      </p>
                      <span className="text-[10px] text-slate-400">Home Batch</span>
                    </div>

                    <div className="col-span-1 text-center">
                      <div className="px-2.5 py-1 rounded-lg bg-[#2C3960] text-white font-extrabold text-sm">
                        VS
                      </div>
                      <span className="text-[10px] text-amber-400 block mt-1 font-semibold">
                        {latestAndNext.next_upcoming.kick_off_time?.slice(0, 5) || '16:00'}
                      </span>
                    </div>

                    <div className="col-span-3 text-left">
                      <p className="text-sm font-bold text-white truncate">
                        {latestAndNext.next_upcoming.away_team.name}
                      </p>
                      <span className="text-[10px] text-slate-400">Away Batch</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {latestAndNext.next_upcoming.venue} &bull; {latestAndNext.next_upcoming.match_date}
                    </span>
                    <Link
                      href={`/matches/${latestAndNext.next_upcoming.id}`}
                      className="text-amber-400 font-bold hover:underline flex items-center gap-1"
                    >
                      Match Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="card-gloss p-6 rounded-2xl text-center text-slate-400">
                  <p className="text-xs">No upcoming matches scheduled at this moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 4 COMPETING BATCHES */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              COMPETING ACADEMIC BATCHES
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Four academic year teams competing with honor and Christian unity
            </p>
          </div>
          <Link
            href="/batches"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Explore All Batches <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {batches.filter((b) => b.is_competing).map((batch) => (
            <Link
              key={batch.batch_code}
              href={`/batches/${batch.batch_code}`}
              className="card-gloss p-5 rounded-2xl group transition-all transform hover:-translate-y-1 block border-t-4"
              style={{ borderTopColor: batch.color_hex }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-950"
                  style={{ backgroundColor: batch.color_hex }}
                >
                  {batch.batch_code.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {batch.total_members} members
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                {batch.name}
              </h3>
              <p className="text-xs text-amber-400 font-semibold mb-2">
                &ldquo;{batch.nickname || batch.motto}&rdquo;
              </p>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {batch.description || 'Dedicated to fellowship and competitive sportsmanship.'}
              </p>

              <div className="pt-3 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-medium">
                  {batch.approved_players} Roster Squad
                </span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. STANDINGS & TOP PERFORMERS DUAL SECTION */}
      <section className="py-14 bg-[#080E21] border-y border-[#2C3960]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Standings Table (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    LEAGUE STANDINGS
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Official single round-robin standings calculated dynamically
                  </p>
                </div>
                <Link
                  href="/standings"
                  className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Full Table <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl card-gloss border border-[#2C3960]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
                    <tr>
                      <th className="py-3 px-3 text-center">Pos</th>
                      <th className="py-3 px-3">Batch Team</th>
                      <th className="py-3 px-2 text-center">P</th>
                      <th className="py-3 px-2 text-center">W</th>
                      <th className="py-3 px-2 text-center">D</th>
                      <th className="py-3 px-2 text-center">L</th>
                      <th className="py-3 px-2 text-center font-bold">GD</th>
                      <th className="py-3 px-3 text-center text-emerald-400 font-black">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C3960]/60">
                    {standings.length > 0 ? (
                      standings.map((row) => (
                        <tr key={row.batch_code} className="hover:bg-[#232F54]/40 transition-colors">
                          <td className="py-3.5 px-3 text-center font-extrabold text-slate-300">
                            {row.position === 1 ? (
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 inline-flex items-center justify-center font-black text-[11px]">
                                1
                              </span>
                            ) : (
                              row.position
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: row.color_hex }}
                            />
                            <Link href={`/batches/${row.batch_code}`} className="hover:text-emerald-400 truncate">
                              {row.name}
                            </Link>
                          </td>
                          <td className="py-3.5 px-2 text-center text-slate-300 font-medium">{row.played}</td>
                          <td className="py-3.5 px-2 text-center text-slate-300">{row.won}</td>
                          <td className="py-3.5 px-2 text-center text-slate-300">{row.drawn}</td>
                          <td className="py-3.5 px-2 text-center text-slate-300">{row.lost}</td>
                          <td className="py-3.5 px-2 text-center font-bold text-slate-200">
                            {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                          </td>
                          <td className="py-3.5 px-3 text-center font-black text-emerald-400 text-sm">
                            {row.points}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Standings will appear once tournament matches commence.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performers (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Golden Boot Preview */}
              <div className="card-gloss p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" />
                    Golden Boot (Top Scorers)
                  </h3>
                  <Link href="/statistics" className="text-[11px] font-semibold text-emerald-400 hover:underline">
                    View All
                  </Link>
                </div>

                <div className="space-y-2">
                  {topScorers.length > 0 ? (
                    topScorers.slice(0, 3).map((scorer) => (
                      <div
                        key={scorer.player_id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#161D36]/70 border border-[#2C3960]/60"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center">
                            {scorer.rank}
                          </span>
                          <div>
                            <Link href={`/members/${scorer.username}`} className="text-xs font-bold text-white hover:text-emerald-400">
                              {scorer.full_name}
                            </Link>
                            <p className="text-[10px] text-slate-400">{scorer.batch} &bull; {scorer.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-400">{scorer.goals}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Goals</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Scorers will be recorded from published match results.
                    </p>
                  )}
                </div>
              </div>

              {/* Playmaker / Top Assists Preview */}
              <div className="card-gloss p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-blue-400" />
                    Top Playmakers (Assists)
                  </h3>
                  <Link href="/statistics" className="text-[11px] font-semibold text-emerald-400 hover:underline">
                    View All
                  </Link>
                </div>

                <div className="space-y-2">
                  {topAssists.length > 0 ? (
                    topAssists.slice(0, 3).map((assister) => (
                      <div
                        key={assister.player_id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#161D36]/70 border border-[#2C3960]/60"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 font-black text-xs flex items-center justify-center">
                            {assister.rank}
                          </span>
                          <div>
                            <Link href={`/members/${assister.username}`} className="text-xs font-bold text-white hover:text-emerald-400">
                              {assister.full_name}
                            </Link>
                            <p className="text-[10px] text-slate-400">{assister.batch}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-400">{assister.assists}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Assists</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Assists will appear here as recorded by the manager.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MOST-FOLLOWED FELLOWSHIP MEMBERS */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              FELLOWSHIP COMMUNITY HIGHLIGHTS
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Connect with brothers and sisters across all departments and academic batches
            </p>
          </div>
          <Link
            href="/members"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            All Members Directory <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {mostFollowed.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.username}`}
              className="card-gloss p-4 rounded-2xl text-center group hover:border-emerald-500/40 transition-all block"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-800/40 border-2 border-emerald-400/30 overflow-hidden mb-3 group-hover:scale-105 transition-transform flex items-center justify-center">
                {member.profile_picture ? (
                  <img src={member.profile_picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-emerald-300" />
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400">
                {member.full_name}
              </h4>
              <p className="text-[10px] text-emerald-400 font-medium truncate mt-0.5">
                {member.batch}
              </p>
              <p className="text-[9px] text-slate-400 truncate mb-2">
                {member.department}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-full">
                <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                {member.followers_count} followers
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. FELLOWSHIP ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="py-12 bg-[#080E21] border-t border-[#2C3960]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              FELLOWSHIP ANNOUNCEMENTS &amp; NOTICES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.slice(0, 3).map((item) => (
                <div key={item.id} className="card-gloss p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400">
                      {item.category_display || item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.created_at?.slice(0, 10)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
