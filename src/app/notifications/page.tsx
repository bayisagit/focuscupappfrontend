'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bell, Check, User, Heart, ArrowRight } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    api.community.getNotifications()
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.community.markNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center justify-between mb-8 border-b border-[#2C3960]/60 pb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" />
            FELLOWSHIP NOTIFICATIONS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated with follow activity, match events, and announcements
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Mark all read
          </button>
        )}
      </div>

      <div className="card-gloss rounded-2xl overflow-hidden border border-[#2C3960] shadow-xl divide-y divide-[#2C3960]/60">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-center justify-between transition-colors ${
                !n.is_read ? 'bg-emerald-500/5' : 'hover:bg-[#232F54]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-200">
                    <strong className="text-white font-bold">{n.actor_name || 'Someone'}</strong> {n.verb}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {n.created_at?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              </div>

              {n.target_url && (
                <Link
                  href={n.target_url}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 text-xs font-bold shrink-0 ml-4 flex items-center gap-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs">You have no notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
