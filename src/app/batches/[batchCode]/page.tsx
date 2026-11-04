'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
  Award,
  Camera,
  Edit,
} from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';
import BatchPhotoLightbox, { BatchTeamData } from '@/components/BatchPhotoLightbox';
import { useAuth } from '@/lib/auth-context';
import { apiCache } from '@/lib/cache';

import { Suspense } from 'react';

function BatchDetailContent() {
  const { batchCode } = useParams();
  const { user } = useAuth();
  const cached = batchCode ? apiCache.get<any>(`/api/v1/competitions/batches/${batchCode}/`) : null;
  const [data, setData] = useState<any>(() => cached || null);
  const [loading, setLoading] = useState<boolean>(() => !cached);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  const handleBatchUpdated = (updated: BatchTeamData) => {
    setData((prev: any) => ({
      ...prev,
      team: {
        ...prev.team,
        ...updated,
      },
    }));
  };

  useEffect(() => {
    if (batchCode) {
      api.competitions.getBatchDetail(batchCode as string)
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [batchCode]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading batch details...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10">
        <h2 className="text-lg font-bold text-white mb-2">Batch Not Found</h2>
        <Link href="/batches" className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
          View All Batches
        </Link>
      </div>
    );
  }

  const { team, total_members, roster, standing, fixtures, results } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Batch Hero Card */}
      <div
        className="card-gloss rounded-3xl p-6 sm:p-8 shadow-2xl border-t-4 mb-8"
        style={{ borderTopColor: team.color_hex }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setIsPhotoLightboxOpen(true)}
              className="relative group/photo shrink-0 rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer transform hover:scale-105 active:scale-95 transition-all shadow-xl"
              title="Click to view full batch photo / sketch"
            >
              <TeamCrest team={team} size="xl" className="rounded-2xl" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex flex-col items-center justify-center transition-opacity rounded-2xl text-white">
                <Camera className="w-6 h-6 mb-1 drop-shadow" />
                <span className="text-[10px] font-bold">View Photo</span>
              </div>
            </button>
            <div>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-slate-950 inline-block mb-1"
                style={{ backgroundColor: team.color_hex }}
              >
                {team.batch_code.replace('_', ' ')}
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {team.name}
              </h1>
              <p className="text-xs font-semibold text-amber-400">
                &ldquo;{team.nickname || team.motto}&rdquo;
              </p>

              {user?.is_manager && (
                <button
                  type="button"
                  onClick={() => setIsPhotoLightboxOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Batch Photo &amp; Info</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto">
            <div className="p-3 rounded-xl bg-[#161D36] border border-[#2C3960]">
              <p className="text-xl font-black text-white">{total_members}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Registered</p>
            </div>
            <div className="p-3 rounded-xl bg-[#161D36] border border-[#2C3960]">
              <p className="text-xl font-black text-emerald-400">{roster.length}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Roster Squad</p>
            </div>
            <div className="p-3 rounded-xl bg-[#161D36] border border-[#2C3960]">
              <p className="text-xl font-black text-amber-400">
                {standing ? `#${standing.position}` : '&mdash;'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">League Pos</p>
            </div>
          </div>
        </div>

        {team.description && (
          <p className="text-xs text-slate-300 leading-relaxed mt-6 pt-5 border-t border-[#2C3960]/60">
            {team.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Official Squad Roster (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              OFFICIAL FOOTBALL ROSTER ({roster.length} PLAYERS)
            </h2>
            <span className="text-[11px] text-slate-400">Approved for Season</span>
          </div>

          {roster.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roster.map((p: any) => (
                <div
                  key={p.id}
                  className="card-gloss p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/40 transition-all"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-800/40 border-2 border-emerald-400/40 flex items-center justify-center overflow-hidden">
                      {p.profile_picture || p.avatar_url || p.profile_picture_url ? (
                        <img src={p.profile_picture || p.avatar_url || p.profile_picture_url} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-emerald-300" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                      #{p.jersey_number}
                    </span>
                  </div>

                  <div className="flex-1 truncate">
                    <Link
                      href={`/members/${p.username}`}
                      className="text-xs font-bold text-white hover:text-emerald-400 truncate block"
                    >
                      {p.full_name}
                    </Link>
                    <p className="text-[10px] text-emerald-400 font-medium">{p.position}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.department}</p>
                    {p.personal_chant && (
                      <p className="text-[10px] text-amber-300/80 italic truncate mt-0.5">
                        &ldquo;{p.personal_chant}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-gloss p-8 rounded-2xl text-center text-slate-400 text-xs">
              No registered tournament players for this batch yet.
            </div>
          )}
        </div>

        {/* Right Column: Batch Fixtures & Results (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Standing Summary Card */}
          {standing && (
            <div className="card-gloss p-5 rounded-2xl space-y-2 border-emerald-500/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> League Table Position
              </h3>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-300">Rank:</span>
                <span className="text-base font-black text-white">#{standing.position}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Points:</span>
                <span className="font-bold text-emerald-400">{standing.points} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Record:</span>
                <span className="text-slate-300">
                  {standing.won}W - {standing.drawn}D - {standing.lost}L
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Goals (GF/GA):</span>
                <span className="text-slate-300">{standing.goals_for} / {standing.goals_against} (GD: {standing.goal_difference})</span>
              </div>
            </div>
          )}

          {/* Matches & Results */}
          <div className="card-gloss p-5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Batch Matches
            </h3>

            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Recent Results</p>
                {results.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block p-3 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/40 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white mb-1">
                      <span>{m.home_team.name}</span>
                      <span className="text-emerald-400 font-black">{m.home_score} - {m.away_score}</span>
                      <span>{m.away_team.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">{m.match_date}</p>
                  </Link>
                ))}
              </div>
            )}

            {fixtures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#2C3960]/60">
                <p className="text-[11px] font-bold text-amber-400 uppercase">Upcoming Fixtures</p>
                {fixtures.map((m: any) => (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block p-3 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500/40 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white mb-1">
                      <span className="truncate">{m.home_team.name}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-amber-400">VS</span>
                      <span className="truncate">{m.away_team.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center">{m.match_date} &bull; {m.kick_off_time}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Batch Photo Lightbox */}
      <BatchPhotoLightbox
        isOpen={isPhotoLightboxOpen}
        onClose={() => setIsPhotoLightboxOpen(false)}
        batch={team}
        onBatchUpdated={handleBatchUpdated}
      />
    </div>
  );
}

export default function BatchDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-slate-400">Loading batch details...</div>}>
      <BatchDetailContent />
    </Suspense>
  );
}
