'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Trophy, Shield, Info, ArrowUpRight } from 'lucide-react';

export default function StandingsPage() {
  const [standings, setStandings] = useState<any[]>([]);
  const [seasonName, setSeasonName] = useState<string>('Focus Football Cup');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.competitions.getStandings()
      .then((data) => {
        setStandings(data.standings || []);
        if (data.season_name) setSeasonName(data.season_name);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-400" />
              OFFICIAL LEAGUE STANDINGS
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {seasonName} &bull; Single round-robin standings calculated dynamically from published matches
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#1C2541] px-4 py-2 rounded-xl border border-[#2C3960]">
            <span className="font-bold text-white">Scoring System:</span>
            <span>Win = 3 pts</span>
            <span>&bull;</span>
            <span>Draw = 1 pt</span>
            <span>&bull;</span>
            <span>Loss = 0 pts</span>
          </div>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[11px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-4 px-4 text-center">Pos</th>
                <th className="py-4 px-4 min-w-[180px]">Batch Team</th>
                <th className="py-4 px-3 text-center">Played</th>
                <th className="py-4 px-3 text-center">Won</th>
                <th className="py-4 px-3 text-center">Drawn</th>
                <th className="py-4 px-3 text-center">Lost</th>
                <th className="py-4 px-3 text-center font-bold">GF</th>
                <th className="py-4 px-3 text-center font-bold">GA</th>
                <th className="py-4 px-3 text-center font-bold text-slate-200">GD</th>
                <th className="py-4 px-4 text-center text-emerald-400 font-black text-sm">Points</th>
                <th className="py-4 px-4 text-center min-w-[120px]">Recent Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading standings table...
                  </td>
                </tr>
              ) : standings.length > 0 ? (
                standings.map((row) => (
                  <tr key={row.batch_code} className="hover:bg-[#232F54]/40 transition-colors">
                    <td className="py-4 px-4 text-center font-black">
                      {row.position === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 inline-flex items-center justify-center font-black text-xs shadow-md">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-300">{row.position}</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white shrink-0 shadow"
                          style={{ backgroundColor: row.color_hex || '#10B981' }}
                        >
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <Link
                            href={`/batches/${row.batch_code}`}
                            className="font-bold text-white text-sm hover:text-emerald-400 transition-colors flex items-center gap-1"
                          >
                            {row.name}
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                          <span className="text-[10px] text-slate-400">
                            {row.nickname || row.batch_code.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-3 text-center font-semibold text-slate-300">{row.played}</td>
                    <td className="py-4 px-3 text-center text-slate-300">{row.won}</td>
                    <td className="py-4 px-3 text-center text-slate-300">{row.drawn}</td>
                    <td className="py-4 px-3 text-center text-slate-300">{row.lost}</td>
                    <td className="py-4 px-3 text-center text-slate-300 font-semibold">{row.goals_for}</td>
                    <td className="py-4 px-3 text-center text-slate-300 font-semibold">{row.goals_against}</td>
                    <td className="py-4 px-3 text-center font-black text-white">
                      {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                    </td>
                    <td className="py-4 px-4 text-center font-black text-emerald-400 text-base">
                      {row.points}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {row.recent_form && row.recent_form.length > 0 ? (
                          row.recent_form.map((res: string, idx: number) => (
                            <span
                              key={idx}
                              className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center ${
                                res === 'W'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : res === 'D'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[10px]">&mdash;</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No tournament matches have been completed and published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standings Rules & Fellowship Ethos Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#1C2541]/70 border border-[#2C3960] space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            Tiebreaker &amp; Calculation Rules
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              &bull; <strong>Primary Sorting:</strong> Points &rarr; Goal Difference &rarr; Goals Scored &rarr; Head-to-Head record.
            </li>
            <li>
              &bull; <strong>Official Integrity:</strong> Standings cannot be manually edited by the manager; all numbers are calculated directly from published match event sheets.
            </li>
            <li>
              &bull; <strong>Fair Play:</strong> If all statistics and head-to-head records are tied, the team with fewer disciplinary points is ranked higher.
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#1C2541]/80 to-[#10B981]/10 border border-emerald-500/30 space-y-3">
          <h3 className="text-sm font-bold text-amber-400">
            Fellowship Spirit in Christ
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed italic">
            &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Focus Football Cup celebrates academic batch identity while nurturing eternal brotherhood in Christ. Every batch plays for God&apos;s glory and the edification of the campus body.
          </p>
        </div>
      </div>
    </div>
  );
}
