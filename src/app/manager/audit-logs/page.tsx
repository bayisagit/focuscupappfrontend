'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Clock, Shield, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ManagerAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = () => {
    setLoading(true);
    api.manager.getAuditLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="mb-6">
        <Link href="/manager/dashboard" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-8 border-b border-[#2C3960]/60 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Clock className="w-8 h-8 text-purple-400" />
            ADMINISTRATIVE AUDIT TRAILS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Permanent system records of match publications, score corrections, and member moderation
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2.5 rounded-xl bg-[#1C2541] border border-[#2C3960] text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161D36] text-[10px] uppercase font-bold text-slate-400 border-b border-[#2C3960]">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Manager User</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Target Model</th>
                <th className="py-3.5 px-4">Object Description</th>
                <th className="py-3.5 px-4">Notes &amp; Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C3960]/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading audit logs...</td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#232F54]/30">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {log.timestamp?.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.user}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{log.model_name}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">{log.object_repr}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">{log.notes || '&mdash;'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No audit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
