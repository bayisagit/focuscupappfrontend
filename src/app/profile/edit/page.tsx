'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Shield, User, Trophy, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    fellowship_team: 'No Team',
    primary_position: '',
    secondary_position: '',
    preferred_jersey_number: '',
    personal_chant: '',
    bio: '',
  });

  useEffect(() => {
    api.members.getOptions().then((opts) => setOptions(opts));
    if (user?.profile) {
      const p = user.profile;
      setFormData({
        first_name: p.first_name || '',
        second_name: p.second_name || '',
        fellowship_team: p.fellowship_team || 'No Team',
        primary_position: p.primary_position || '',
        secondary_position: p.secondary_position || '',
        preferred_jersey_number: p.preferred_jersey_number?.toString() || '',
        personal_chant: p.personal_chant || '',
        bio: p.bio || '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await api.members.updateProfile({
        ...formData,
        preferred_jersey_number: formData.preferred_jersey_number ? Number(formData.preferred_jersey_number) : null,
      });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => {
        router.push(`/members/${user?.username}`);
      }, 1200);
    } catch (err: any) {
      alert(err.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-6">
        <Link href={`/members/${user?.username}`} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to My Profile
        </Link>
      </div>

      <div className="card-gloss p-8 rounded-3xl border border-[#2C3960] shadow-2xl">
        <h1 className="text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Edit Fellowship &amp; Football Profile
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Update your personal details, preferred squad jersey number, and Christian sports motto
        </p>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile updated successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Second Name</label>
              <input
                type="text"
                value={formData.second_name}
                onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Pitch Position</label>
              <select
                value={formData.primary_position}
                onChange={(e) => setFormData({ ...formData, primary_position: e.target.value })}
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">None / Community Member</option>
                {options?.football_positions?.map((p: any) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Jersey Number</label>
              <input
                type="number"
                min="1"
                max="99"
                value={formData.preferred_jersey_number}
                onChange={(e) => setFormData({ ...formData, preferred_jersey_number: e.target.value })}
                placeholder="e.g. 10"
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Fellowship Ministry Team</label>
              <select
                value={formData.fellowship_team}
                onChange={(e) => setFormData({ ...formData, fellowship_team: e.target.value })}
                className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                {options?.fellowship_teams ? (
                  options.fellowship_teams.map((t: any) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))
                ) : (
                  <option value="No Team">No Team</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Personal Chant / Christian Sports Motto
            </label>
            <input
              type="text"
              value={formData.personal_chant}
              onChange={(e) => setFormData({ ...formData, personal_chant: e.target.value })}
              placeholder="e.g. Jesus Is My Savior, Christ Above Everything"
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Personal Biography</label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Share a short introduction with fellowship brethren..."
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href={`/members/${user?.username}`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
