'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Trophy, Check, X, ArrowLeft, Clock, Filter, AlertCircle } from 'lucide-react';

export default function ManagerPlayersPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({});

  const loadRegistrations = () => {
    setLoading(true);
    api.manager.getPlayerRegistrations(statusFilter)
      .then((data) => setRegistrations(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRegistrations();
  }, [statusFilter]);

  const handleReview = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    let reason = '';
    if (status === 'REJECTED') {
      const promptRes = prompt('Enter rejection reason (optional):');
      if (promptRes === null) return;
      reason = promptRes;
    }

    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await api.manager.reviewPlayer(id, status, reason);
      alert(res.message);
      loadRegistrations();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to review player application.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-6">
        <Link href="/manager/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 border-b border-[#2C3960]/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400" />
            TOURNAMENT ROSTER APPROVALS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review player applications and manage official academic batch competition squads
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#1C2541] px-3 py-1.5 rounded-xl border border-[#2C3960]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none"
          >
            <option value="PENDING" className="bg-[#1C2541]">Pending Review</option>
            <option value="APPROVED" className="bg-[#1C2541]">Approved Squad Players</option>
            <option value="REJECTED" className="bg-[#1C2541]">Rejected Applications</option>
            <option value="" className="bg-[#1C2541]">All Applications</option>
          </select>
        </div>
      </div>

      <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Batch Squad</th>
                <th className="py-3.5 px-4 text-center">Jersey</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading registrations...</td>
                </tr>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#232F54]/30">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                          {(reg.avatar_url || reg.profile_picture || reg.profile_picture_url) ? (
                            <img src={reg.avatar_url || reg.profile_picture || reg.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-400">{(reg.full_name || 'P')[0]}</span>
                          )}
                        </div>
                        <div>
                          <Link href={`/members/${reg.username}`} className="hover:text-emerald-400">
                            {reg.full_name}
                          </Link>
                          <span className="block text-[10px] text-slate-400">{reg.department}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {reg.batch_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        #{reg.jersey_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{reg.preferred_position}</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{reg.football_notes || '&mdash;'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          reg.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : reg.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {reg.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReview(reg.id, 'APPROVED')}
                            disabled={actionLoading[reg.id]}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReview(reg.id, 'REJECTED')}
                            disabled={actionLoading[reg.id]}
                            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1 border border-rose-500/30"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No applications found with status &quot;{statusFilter || 'ALL'}&quot;.
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
