'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Search, Shield, Ban, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ManagerMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMembers = () => {
    api.manager.getMembers(search)
      .then((data) => setMembers(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
  }, [search]);

  const handleToggleSuspend = async (memberId: number) => {
    if (!confirm('Are you sure you want to change this member account status?')) return;
    try {
      const res = await api.manager.toggleSuspend(memberId);
      alert(res.message);
      loadMembers();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to update member status.');
    }
  };

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Are you sure you want to permanently delete member "${memberName}"? This will permanently remove their user account, player registrations, and profile.`)) return;
    try {
      const res = await api.manager.deleteMember(memberId);
      alert(res.message || 'Member deleted permanently.');
      loadMembers();
    } catch (err: any) {
      alert(err.data?.error || err.message || 'Failed to delete member.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/manager/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Link
          href="/admin"
          className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Batch Coaches &amp; Admin Central &rarr;</span>
        </Link>
      </div>

      <div className="mb-8 border-b border-[#2C3960]/60 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-emerald-400" />
            MEMBER ACCOUNT MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View full registration details, emails, and manage moderation status
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or dept..."
            className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
          />
        </div>
      </div>

      <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4">Member Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">College &amp; Dept</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Team</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading members...</td>
                </tr>
              ) : members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-[#232F54]/30">
                    <td className="py-3 px-4 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                          {(m.profile_picture || m.avatar_url || m.profile_picture_url) ? (
                            <img src={m.profile_picture || m.avatar_url || m.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-400">{(m.first_name || m.full_name || 'U')[0]}</span>
                          )}
                        </div>
                        <div>
                          <Link href={`/members/${m.username}`} className="hover:text-emerald-400">
                            {m.full_name}
                          </Link>
                          <span className="block text-[10px] text-slate-400 font-mono">@{m.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{m.email}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <p className="truncate max-w-xs">{m.department}</p>
                      <span className="text-[10px] text-slate-500">{m.college}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">{m.batch}</td>
                    <td className="py-3 px-4 text-slate-300">{m.fellowship_team}</td>
                    <td className="py-3 px-4 text-center">
                      {m.is_suspended ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleSuspend(m.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            m.is_suspended
                              ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30'
                          }`}
                        >
                          {m.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m.id, m.full_name)}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30"
                          title="Permanently delete user"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No members found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
