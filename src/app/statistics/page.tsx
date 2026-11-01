'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Trophy,
  Flame,
  Star,
  Award,
  Users,
  Shield,
  Heart,
  Sparkles,
} from 'lucide-react';

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'scorers' | 'assists' | 'followed' | 'awards'>('scorers');
  const [scorers, setScorers] = useState<any[]>([]);
  const [assists, setAssists] = useState<any[]>([]);
  const [followed, setMostFollowed] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [sRes, aRes, fRes, awRes] = await Promise.all([
          api.statistics.getTopScorers(20),
          api.statistics.getTopAssists(20),
          api.statistics.getMostFollowed(20),
          api.statistics.getAwards(),
        ]);
        setScorers(sRes || []);
        setAssists(aRes || []);
        setMostFollowed(fRes || []);
        setAwards(awRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-8 h-8 text-amber-400" />
          STATISTICS &amp; TOURNAMENT AWARDS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Authoritative leaderboards calculated exclusively from official published tournament matches
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#2C3960]">
        {[
          { id: 'scorers', label: 'Golden Boot (Top Scorers)', icon: Flame },
          { id: 'assists', label: 'Playmakers (Assists)', icon: Star },
          { id: 'followed', label: 'Most Followed Members', icon: Users },
          { id: 'awards', label: 'Official Tournament Awards', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
                active
                  ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. TOP SCORERS */}
      {activeTab === 'scorers' && (
        <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Academic Batch</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Position</th>
                <th className="py-3.5 px-4 text-center text-emerald-400 font-black text-sm">Goals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {scorers.length > 0 ? (
                scorers.map((s) => (
                  <tr key={s.player_id} className="hover:bg-[#232F54]/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-black">
                      {s.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 inline-flex items-center justify-center font-black text-xs">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-300">{s.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/members/${s.username}`}
                        className="font-bold text-white hover:text-emerald-400 flex items-center gap-2"
                      >
                        {s.full_name}
                        {s.jersey_number && (
                          <span className="text-[10px] text-amber-400">#{s.jersey_number}</span>
                        )}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{s.batch}</td>
                    <td className="py-3.5 px-4 text-slate-400">{s.department}</td>
                    <td className="py-3.5 px-4 text-center text-slate-300">{s.position}</td>
                    <td className="py-3.5 px-4 text-center font-black text-emerald-400 text-base">
                      {s.goals}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No goal records found in published matches yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TOP ASSISTS */}
      {activeTab === 'assists' && (
        <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Academic Batch</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4 text-center">Position</th>
                <th className="py-3.5 px-4 text-center text-blue-400 font-black text-sm">Assists</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {assists.length > 0 ? (
                assists.map((a) => (
                  <tr key={a.player_id} className="hover:bg-[#232F54]/40 transition-colors">
                    <td className="py-3.5 px-4 text-center font-black">
                      <span className="text-slate-300">{a.rank}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/members/${a.username}`}
                        className="font-bold text-white hover:text-blue-400 flex items-center gap-2"
                      >
                        {a.full_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-semibold">{a.batch}</td>
                    <td className="py-3.5 px-4 text-slate-400">{a.department}</td>
                    <td className="py-3.5 px-4 text-center text-slate-300">{a.position}</td>
                    <td className="py-3.5 px-4 text-center font-black text-blue-400 text-base">
                      {a.assists}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No assist records found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. MOST FOLLOWED */}
      {activeTab === 'followed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {followed.map((m) => (
            <div key={m.id} className="card-gloss p-5 rounded-2xl text-center group hover:border-emerald-500/40">
              <div className="w-16 h-16 rounded-full bg-emerald-800/40 border-2 border-emerald-400/40 mx-auto mb-3 flex items-center justify-center font-bold text-white overflow-hidden">
                {m.profile_picture ? <img src={m.profile_picture} alt="" className="w-full h-full object-cover" /> : m.full_name[0]}
              </div>
              <Link href={`/members/${m.username}`} className="text-sm font-bold text-white hover:text-emerald-400 block truncate">
                {m.full_name}
              </Link>
              <p className="text-[10px] text-emerald-400 font-semibold">{m.batch} &bull; {m.fellowship_team}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.department}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-200">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                {m.followers_count} Followers
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. AWARDS */}
      {activeTab === 'awards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {awards.length > 0 ? (
            awards.map((award) => (
              <div
                key={award.id}
                className="card-gloss p-6 rounded-2xl border-l-4 border-amber-500 space-y-3 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300">
                    {award.category}
                  </span>
                  <span className="text-[10px] text-slate-400">{award.awarded_date}</span>
                </div>

                <h3 className="text-lg font-black text-white">{award.title}</h3>

                {award.recipient_member && (
                  <p className="text-xs font-bold text-emerald-400">
                    Recipient: {award.recipient_member.full_name} ({award.recipient_member.batch})
                  </p>
                )}

                {award.recipient_team && (
                  <p className="text-xs font-bold text-emerald-400">
                    Recipient Batch: {award.recipient_team.name}
                  </p>
                )}

                <p className="text-xs text-slate-300 italic leading-relaxed">
                  &ldquo;{award.citation}&rdquo;
                </p>

                <p className="text-[10px] text-slate-500 pt-2 border-t border-[#2C3960]/60">
                  {award.season_name}
                </p>
              </div>
            ))
          ) : (
            <div className="card-gloss p-12 rounded-2xl text-center text-slate-400 col-span-2">
              <Award className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-60" />
              <p className="text-xs">Official tournament awards will be presented at the conclusion of the season.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
