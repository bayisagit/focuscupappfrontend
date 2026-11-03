'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Search,
  Filter,
  Heart,
  Trophy,
  Check,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import ProfilePhotoLightbox, { LightboxProfile } from '@/components/ProfilePhotoLightbox';

export default function MembersDirectoryPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [sortBy, setSortBy] = useState('followers');

  const [followLoading, setFollowLoading] = useState<Record<number, boolean>>({});

  // Fullscreen Profile Lightbox State
  const [lightboxProfile, setLightboxProfile] = useState<LightboxProfile | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    api.members.getOptions()
      .then((opts) => setOptions(opts))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (selectedBatch) params.batch = selectedBatch;
    if (selectedCollege) params.college = selectedCollege;
    if (selectedDept) params.department = selectedDept;
    if (selectedTeam) params.fellowship_team = selectedTeam;
    if (selectedPosition) params.position = selectedPosition;
    if (sortBy) params.sort_by = sortBy;

    api.members.list(params)
      .then((data) => setMembers(data.results || data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [search, selectedBatch, selectedCollege, selectedDept, selectedTeam, selectedPosition, sortBy]);

  const handleFollowToggle = async (memberId: number) => {
    if (!user) {
      alert('Please log in or create an account to follow fellowship members!');
      return;
    }
    setFollowLoading((prev) => ({ ...prev, [memberId]: true }));
    try {
      const res = await api.members.toggleFollow(memberId);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, is_following: res.is_following, followers_count: res.followers_count }
            : m
        )
      );
    } catch (err: any) {
      alert(err.data?.error || 'Failed to update follow relationship.');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="mb-8 border-b border-[#2C3960]/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <Users className="w-8 h-8 text-emerald-400" />
          FELLOWSHIP MEMBER DIRECTORY
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Discover, connect, and follow fellow members across academic batches, colleges, and fellowship teams
        </p>
      </div>

      {/* Main Filter Bar */}
      <div className="card-gloss p-5 rounded-2xl mb-8 space-y-4 shadow-xl border border-[#2C3960]">
        {/* Search Input & Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, department, or personal motto..."
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="followers">Most Followed</option>
              <option value="name">Name (A-Z)</option>
              <option value="newest">Newest Members</option>
            </select>
          </div>
        </div>

        {/* Batch Pills Quick Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2C3960]/60">
          <span className="text-xs font-bold text-slate-400 mr-1">Batch:</span>
          {[
            { label: 'All Batches', val: '' },
            { label: '2nd Year', val: '2ND_YEAR' },
            { label: '3rd Year', val: '3RD_YEAR' },
            { label: '4th Year', val: '4TH_YEAR' },
            { label: '5th Year', val: '5TH_YEAR' },
            { label: 'Other', val: 'OTHER' },
          ].map((pill) => (
            <button
              key={pill.val}
              onClick={() => setSelectedBatch(pill.val)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                selectedBatch === pill.val
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#161D36] text-slate-300 hover:text-white border border-[#2C3960]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Extended Secondary Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* College */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">College</label>
            <select
              value={selectedCollege}
              onChange={(e) => {
                setSelectedCollege(e.target.value);
                setSelectedDept('');
              }}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">All Colleges</option>
              {options?.colleges?.map((c: any) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Fellowship Team */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fellowship Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">All Teams</option>
              {options?.fellowship_teams?.map((t: any) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Football Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="">All Positions</option>
              {options?.football_positions?.map((p: any) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setSelectedBatch('');
                setSelectedCollege('');
                setSelectedDept('');
                setSelectedTeam('');
                setSelectedPosition('');
              }}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#1C2541]/40 animate-pulse" />
          ))}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="card-gloss p-5 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all shadow-xl"
            >
              <div>
                {/* Avatar & Batch Badge */}
                <div className="flex items-start justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxProfile(member);
                      setLightboxOpen(true);
                    }}
                    className="relative group/avatar cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-2xl text-left"
                    title="Click to view full photo"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-800/40 border-2 border-emerald-400/40 flex items-center justify-center overflow-hidden shadow group-hover/avatar:border-emerald-300 transition-all relative">
                      {(member.profile_picture || member.avatar_url || member.profile_picture_url) ? (
                        <img
                          src={member.profile_picture || member.avatar_url || member.profile_picture_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Users className="w-7 h-7 text-emerald-300" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                        <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                      </div>
                    </div>
                    {member.preferred_jersey_number && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                        #{member.preferred_jersey_number}
                      </span>
                    )}
                  </button>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#161D36] text-emerald-400 border border-[#2C3960]">
                    {member.batch_display || member.academic_year}
                  </span>
                </div>

                {/* Member Details */}
                <Link
                  href={`/members/${member.username}`}
                  className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors block truncate"
                >
                  {member.full_name}
                </Link>

                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {member.department}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                    {member.fellowship_team}
                  </span>
                  {member.primary_position && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                      {member.primary_position}
                    </span>
                  )}
                </div>

                {member.personal_chant && (
                  <p className="text-[11px] text-amber-300 italic mt-3 line-clamp-1">
                    &ldquo;{member.personal_chant}&rdquo;
                  </p>
                )}
              </div>

              {/* Action: Follow & View Profile */}
              <div className="mt-5 pt-3 border-t border-[#2C3960]/60 flex items-center justify-between">
                <button
                  onClick={() => handleFollowToggle(member.id)}
                  disabled={followLoading[member.id]}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    member.is_following
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${member.is_following ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                  {member.is_following ? 'Following' : 'Follow'}
                  <span className="text-[10px] opacity-80">({member.followers_count})</span>
                </button>

                <Link
                  href={`/members/${member.username}`}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-0.5"
                >
                  Profile <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card-gloss rounded-2xl">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No fellowship members found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query or filter selections.
          </p>
        </div>
      )}

      {/* Fullscreen Profile Photo Lightbox */}
      <ProfilePhotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        profile={lightboxProfile}
      />
    </div>
  );
}
