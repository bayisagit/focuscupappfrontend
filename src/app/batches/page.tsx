'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { GraduationCap, ArrowRight } from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';

export default function BatchesIndexPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.competitions.getBatches()
      .then((data) => setBatches(data.results || data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <GraduationCap className="w-7 h-7" />
          </span>
          FELLOWSHIP ACADEMIC BATCHES
        </h1>
        <p className="text-xs text-slate-400 mt-2">
          Explore rosters, fixtures, and community members across academic years
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((b) => (
          <Link
            key={b.batch_code}
            href={`/batches/${b.batch_code}`}
            className="card-gloss p-6 rounded-3xl group hover:border-emerald-500/50 transition-all flex flex-col justify-between border-t-4"
            style={{ borderTopColor: b.color_hex }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase text-slate-950"
                  style={{ backgroundColor: b.color_hex }}
                >
                  {b.batch_code.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {b.total_members} Members
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <TeamCrest team={b} size="md" />
                <div>
                  <h2 className="text-xl font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                    {b.name}
                  </h2>
                  <p className="text-xs font-semibold text-amber-400">
                    &ldquo;{b.nickname || b.motto}&rdquo;
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-6">
                {b.description || 'AASTU Focus Fellowship academic batch team.'}
              </p>
            </div>

            <div className="pt-4 border-t border-[#2C3960]/60 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold">
                {b.approved_players} Approved Squad Players
              </span>
              <span className="text-white group-hover:translate-x-1.5 transition-transform flex items-center gap-1 font-bold">
                View Batch <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
