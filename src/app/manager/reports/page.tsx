'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Download, FileText, ArrowLeft, Users, Trophy, Shield } from 'lucide-react';

export default function ManagerReportsPage() {
  const exportItems = [
    {
      type: 'members' as const,
      title: 'Full Member Directory Export',
      desc: 'All registered fellowship members, academic departments, colleges, contact emails, and eligibility.',
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      type: 'rosters' as const,
      title: 'Tournament Squad Rosters Export',
      desc: 'Approved competition players per batch team with jersey numbers and assigned positions.',
      icon: Shield,
      color: 'text-amber-400',
    },
    {
      type: 'matches' as const,
      title: 'Fixtures & Match Results Export',
      desc: 'All scheduled and completed matches, final scores, dates, rounds, and venues.',
      icon: Trophy,
      color: 'text-blue-400',
    },
    {
      type: 'standings' as const,
      title: 'Official League Standings Export',
      desc: 'Current computed league table (P, W, D, L, GF, GA, GD, Points, and Rankings).',
      icon: FileText,
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-6">
        <Link href="/manager/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Download className="w-8 h-8 text-blue-400" />
          TOURNAMENT DATA EXPORTS &amp; REPORTS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Export authoritative tournament and fellowship datasets in CSV format for offline reporting and committee review
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportItems.map((item) => {
          const Icon = item.icon;
          const exportUrl = api.manager.getExportUrl(item.type);

          return (
            <div
              key={item.type}
              className="card-gloss p-6 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-500 transition-all shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#161D36] border border-[#2C3960] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-13">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={exportUrl}
                  download
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-[#2C3960]"
                >
                  <Download className="w-4 h-4" /> Download CSV Report
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
