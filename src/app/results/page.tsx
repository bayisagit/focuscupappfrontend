'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { apiCache } from '@/lib/cache';
import { Trophy, Calendar, MapPin, ChevronRight, Award } from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';
import Spinner from '@/components/Spinner';

export default function ResultsPage() {
  const cached = apiCache.get<any>('/api/v1/matches/?category=results');
  const [results, setResults] = useState<any[]>(() => cached?.results || cached || []);
  const [loading, setLoading] = useState<boolean>(() => !cached);

  const loadResults = (force = false) => {
    if (force || results.length === 0) setLoading(true);
    api.matches.list({ category: 'results' })
      .then((data) => setResults(data.results || data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          MATCH RESULTS &amp; SCORES
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Official results from published Focus Football Cup matches
        </p>
      </div>

      {loading ? (
        <div className="card-gloss p-12 rounded-3xl text-center border border-[#2C3960] shadow-xl my-4">
          <Spinner
            size="lg"
            color="amber"
            label="Loading official match results & scores..."
            sublabel="AASTU Focus Football Cup"
            centered
          />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((match) => (
            <div
              key={match.id}
              className="card-gloss p-5 sm:p-6 rounded-2xl shadow-xl transition-all hover:border-emerald-500/40"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2C3960]/60 pb-3 mb-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    Round {match.round_number}
                  </span>
                  <span>&bull;</span>
                  <span>{match.match_date}</span>
                  <span>&bull;</span>
                  <span>{match.venue}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Full Time Official
                </span>
              </div>

              {/* Match Score Display */}
              <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 py-2">
                <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-3 text-left md:text-right">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {match.home_team.name}
                    </h3>
                    <p className="text-xs text-slate-400">{match.home_team.nickname}</p>
                  </div>
                  <TeamCrest team={match.home_team} size="md" />
                </div>

                <div className="md:col-span-1 text-center py-2 md:py-0">
                  <div className="inline-block px-5 py-2 rounded-xl bg-[#0B132B] border border-emerald-500/40 text-emerald-400 font-black text-2xl shadow-inner whitespace-nowrap tabular-nums tracking-wide">
                    {match.home_score} - {match.away_score}
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center justify-start gap-3 text-left">
                  <TeamCrest team={match.away_team} size="md" />
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {match.away_team.name}
                    </h3>
                    <p className="text-xs text-slate-400">{match.away_team.nickname}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
                {match.potm_name ? (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold text-[11px]">
                    <Award className="w-3.5 h-3.5" /> Player of the Match: {match.potm_name}
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Official Match Report Available</span>
                )}
                <Link
                  href={`/matches/${match.id}`}
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  View Match Report &amp; Scorers <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card-gloss rounded-2xl">
          <Trophy className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No completed match results yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Results will appear here immediately after matches conclude and are published.
          </p>
        </div>
      )}
    </div>
  );
}
