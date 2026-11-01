'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Trophy,
  Users,
  Calendar,
  Shield,
  FileText,
  Clock,
  ArrowRight,
  Flame,
  AlertCircle,
  Download,
  Lock,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_manager)) {
      router.push('/manager/login');
      return;
    }

    if (user?.is_manager) {
      api.manager.getDashboard()
        .then((res) => setData(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading Manager Dashboard...</p>
      </div>
    );
  }

  const { kpis, pending_applications, members_by_batch, recent_members, recent_activity } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Tournament Director
            </span>
            <span className="text-xs text-slate-400">AASTU Focus Football Cup</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Lock className="w-7 h-7 text-purple-400" />
            MANAGEMENT ADMINISTRATION
          </h1>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/manager/matches"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
          >
            <Calendar className="w-4 h-4" /> Match Operations
          </Link>
          <Link
            href="/manager/players"
            className="px-4 py-2 rounded-xl bg-[#1C2541] hover:bg-[#232F54] text-white border border-[#2C3960] font-bold text-xs flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-amber-400" /> Review Players ({pending_applications})
          </Link>
          <Link
            href="/manager/reports"
            className="px-4 py-2 rounded-xl bg-[#1C2541] hover:bg-[#232F54] text-white border border-[#2C3960] font-bold text-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-blue-400" /> Export Reports
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-white">{kpis?.total_members || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Total Members</p>
        </div>
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-emerald-400">{kpis?.approved_players || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Approved Players</p>
        </div>
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-amber-400">{pending_applications || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Pending Review</p>
        </div>
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-blue-400">{kpis?.total_matches || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Total Matches</p>
        </div>
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-purple-400">{kpis?.completed_matches || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Completed</p>
        </div>
        <div className="card-gloss p-5 rounded-2xl text-center">
          <p className="text-3xl font-black text-rose-400">{kpis?.total_goals || 0}</p>
          <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Total Goals</p>
        </div>
      </div>

      {/* Grid: Batch Distribution & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Batch Breakdown */}
        <div className="lg:col-span-6 card-gloss p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" /> Member Distribution by Academic Batch
            </span>
            <Link href="/manager/members" className="text-xs text-emerald-400 hover:underline">
              Manage Members
            </Link>
          </h2>

          <div className="space-y-3 pt-2">
            {members_by_batch?.map((b: any) => (
              <div key={b.batch} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{b.batch}</span>
                  <span className="text-slate-400 font-bold">{b.count} members</span>
                </div>
                <div className="w-full bg-[#161D36] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (b.count / Math.max(1, kpis?.total_members || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Management Actions Card */}
        <div className="lg:col-span-6 card-gloss p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Tournament Operations Hub
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/manager/matches"
              className="p-4 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/40 transition-all block group"
            >
              <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center justify-between">
                <span>Record Match Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Live goals, assists, cards, subs, and scores entry.
              </p>
            </Link>

            <Link
              href="/manager/players"
              className="p-4 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-amber-500/40 transition-all block group"
            >
              <h3 className="text-xs font-bold text-white group-hover:text-amber-400 flex items-center justify-between">
                <span>Roster Approvals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Approve or reject player applications per batch rules.
              </p>
            </Link>

            <Link
              href="/manager/audit-logs"
              className="p-4 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-purple-500/40 transition-all block group"
            >
              <h3 className="text-xs font-bold text-white group-hover:text-purple-400 flex items-center justify-between">
                <span>Audit Logs Trail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Verify timestamps of match publications &amp; edits.
              </p>
            </Link>

            <Link
              href="/manager/reports"
              className="p-4 rounded-xl bg-[#161D36] border border-[#2C3960] hover:border-blue-500/40 transition-all block group"
            >
              <h3 className="text-xs font-bold text-white group-hover:text-blue-400 flex items-center justify-between">
                <span>Export CSV Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Download member lists, rosters, and match results.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Logs */}
      <div className="card-gloss p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Recent Manager Activity &amp; Audit Trail
          </h2>
          <Link href="/manager/audit-logs" className="text-xs text-purple-400 hover:underline">
            View All Logs
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Manager</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Target Object</th>
                <th className="py-3 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {recent_activity?.length > 0 ? (
                recent_activity.map((l: any) => (
                  <tr key={l.id} className="hover:bg-[#232F54]/30">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {l.timestamp?.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{l.user}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        {l.action_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-emerald-400">{l.object_repr}</td>
                    <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">{l.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No management activities logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
