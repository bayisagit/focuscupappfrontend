'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Heart,
  Trophy,
  Award,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Flame,
  Check,
  CheckCircle2,
  ExternalLink,
  Camera,
  Maximize2,
  Eye,
  X,
} from 'lucide-react';
import ProfilePhotoLightbox from '@/components/ProfilePhotoLightbox';

import { Suspense } from 'react';

function MemberProfileContent() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'followers' | 'following'>('stats');
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [activeStatModal, setActiveStatModal] = useState<'appearances' | 'goals' | 'assists' | 'potm' | 'yellow_cards' | 'red_cards' | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (username) {
      const rawUser = Array.isArray(username) ? username[0] : username;
      const cleanUser = decodeURIComponent(rawUser);
      api.members.getDetail(cleanUser)
        .then((data) => setProfile(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [username]);

  useEffect(() => {
    if (profile && activeTab === 'followers') {
      api.members.getFollowers(profile.id).then((res) => setFollowersList(res.results || res || []));
    } else if (profile && activeTab === 'following') {
      api.members.getFollowing(profile.id).then((res) => setFollowingList(res.results || res || []));
    }
  }, [activeTab, profile]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert('Please log in to follow fellow members.');
      return;
    }
    setFollowLoading(true);
    try {
      const res = await api.members.toggleFollow(profile.id);
      setProfile((prev: any) => ({
        ...prev,
        is_following: res.is_following,
        followers_count: res.followers_count,
      }));
    } catch (err: any) {
      alert(err.data?.error || 'Failed to update follow relationship.');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveStatModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-slate-400">Loading member profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center card-gloss rounded-2xl my-10">
        <h2 className="text-lg font-bold text-white mb-2">Member Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The profile does not exist or may have been suspended.</p>
        <Link href="/members" className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
          Back to Directory
        </Link>
      </div>
    );
  }

  const isSelf = currentUser && currentUser.username === profile.username;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* 1. PROFILE HEADER CARD */}
      <div className="card-gloss rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2C3960] mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Core Bio */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="relative group/headerAvatar">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-800/40 border-4 border-emerald-400/40 overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer group-hover/headerAvatar:border-emerald-300 transition-all relative focus:outline-none text-left"
                title="Click to view full photo"
              >
                {(profile.profile_picture || profile.avatar_url || profile.profile_picture_url) ? (
                  <img
                    src={profile.profile_picture || profile.avatar_url || profile.profile_picture_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover group-hover/headerAvatar:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Users className="w-12 h-12 text-emerald-300" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/headerAvatar:opacity-100 flex items-center justify-center transition-opacity rounded-3xl">
                  <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                </div>
              </button>

              {profile.preferred_jersey_number && (
                <span className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg">
                  #{profile.preferred_jersey_number}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile.full_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#161D36] text-emerald-400 border border-[#2C3960]">
                  {profile.batch_display || profile.academic_year}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                @{profile.username} &bull; {profile.department} ({profile.college_display})
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="text-[11px] font-semibold bg-slate-800/80 text-slate-200 px-3 py-1 rounded-lg">
                  {profile.fellowship_team}
                </span>
                {profile.primary_position && (
                  <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg">
                    {profile.primary_position}
                  </span>
                )}
              </div>

              {profile.personal_chant && (
                <p className="text-xs font-semibold italic text-amber-300 pt-1">
                  &ldquo;{profile.personal_chant}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Follow Actions & Stats */}
          <div className="flex flex-col items-center md:items-end space-y-4 w-full md:w-auto">
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-xl font-black text-white">{profile.followers_count}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Followers</p>
              </div>
              <div className="w-px h-8 bg-[#2C3960]" />
              <div>
                <p className="text-xl font-black text-white">{profile.following_count}</p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Following</p>
              </div>
            </div>

            {isSelf ? (
              <Link
                href="/profile/edit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all border border-[#2C3960] text-center"
              >
                Edit My Profile
              </Link>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  profile.is_following
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-400'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${profile.is_following ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                {profile.is_following ? 'Following' : 'Follow Member'}
              </button>
            )}
          </div>
        </div>

        {/* Biography */}
        {profile.bio && (
          <div className="mt-6 pt-5 border-t border-[#2C3960]/60 text-xs text-slate-300 leading-relaxed">
            {profile.bio}
          </div>
        )}
      </div>

      {/* 2. PROFILE TABS */}
      <div className="flex items-center border-b border-[#2C3960] mb-6 space-x-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" /> Football Statistics &amp; Awards
        </button>
        <button
          onClick={() => setActiveTab('followers')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'followers'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Followers ({profile.followers_count})
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`px-5 py-3 text-xs font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'following'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Following ({profile.following_count})
        </button>
      </div>

      {/* TAB CONTENT: STATS & AWARDS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Tournament Roster Status */}
          {profile.player_registration ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                  #{profile.player_registration.jersey_number}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Approved for {profile.player_registration.batch_name}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {profile.player_registration.season_name} &bull; {profile.player_registration.preferred_position}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300">
                Official Squad
              </span>
            </div>
          ) : profile.is_football_eligible ? (
            <div className="p-4 rounded-2xl bg-[#1C2541]/60 border border-[#2C3960] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Eligible for {profile.batch_display} Football Squad</p>
                <p className="text-[11px] text-slate-400">Can apply to join the tournament roster.</p>
              </div>
              {isSelf && (
                <Link href="/player-registration" className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                  Apply Now
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#1C2541]/40 border border-[#2C3960] text-xs text-slate-400">
              Community fellowship member profile (non-competing category).
            </div>
          )}

          {/* Football Numbers Grid - Interactive & Clickable for match breakdowns */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Tournament Match Records &amp; Statistics
              </span>
              <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-1">
                <Eye className="w-3 h-3" /> Click any card below for match details
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Appearances */}
              <button
                type="button"
                onClick={() => setActiveStatModal('appearances')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-emerald-500/60 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-left sm:text-center"
                title="Click to view all tournament appearances and opponent batches"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    {profile.football_stats?.appearances || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  Appearances
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <span>Match log</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Goals */}
              <button
                type="button"
                onClick={() => setActiveStatModal('goals')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-emerald-400/70 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-left sm:text-center"
                title="Click to view goals scored, opponent batches, and exact match minutes"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {profile.football_stats?.goals || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  Goals
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <span>Minutes &amp; batches</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Assists */}
              <button
                type="button"
                onClick={() => setActiveStatModal('assists')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-blue-400/70 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-left sm:text-center"
                title="Click to view assists, goalscorers, opponent batches, and exact match minutes"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-blue-400 group-hover:text-blue-300 transition-colors">
                    {profile.football_stats?.assists || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  Assists
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-blue-400 transition-colors">
                  <span>Minutes &amp; batches</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* POTM Awards */}
              <button
                type="button"
                onClick={() => setActiveStatModal('potm')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-amber-400/70 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-left sm:text-center"
                title="Click to view Player of the Match honors and match performances"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-amber-400 group-hover:text-amber-300 transition-colors">
                    {profile.football_stats?.player_of_the_match || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  POTM Awards
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-amber-400 transition-colors">
                  <span>MVP honors</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Yellow Cards */}
              <button
                type="button"
                onClick={() => setActiveStatModal('yellow_cards')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-amber-300/70 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-left sm:text-center"
                title="Click to view yellow card cautions, match minutes, and disciplinary logs"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-amber-300 group-hover:text-amber-200 transition-colors">
                    {profile.football_stats?.yellow_cards || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  Yellow Cards
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-amber-300 transition-colors">
                  <span>Discipline log</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Red Cards */}
              <button
                type="button"
                onClick={() => setActiveStatModal('red_cards')}
                className="card-gloss p-4 rounded-2xl text-center group cursor-pointer hover:border-rose-400/70 hover:bg-[#1C2541] hover:scale-[1.03] active:scale-95 transition-all duration-200 relative overflow-hidden shadow-lg border border-[#2C3960]/80 focus:outline-none focus:ring-2 focus:ring-rose-500/40 text-left sm:text-center"
                title="Click to view red card dismissals, match minutes, and disciplinary logs"
              >
                <div className="flex sm:block items-center justify-between">
                  <p className="text-2xl sm:text-3xl font-black text-rose-400 group-hover:text-rose-300 transition-colors">
                    {profile.football_stats?.red_cards || 0}
                  </p>
                  <span className="sm:hidden text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                    View
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 group-hover:text-slate-200 uppercase font-bold tracking-wider mt-1">
                  Red Cards
                </p>
                <div className="mt-2 pt-2 border-t border-[#2C3960]/50 flex items-center justify-center gap-1 text-[10px] text-slate-400 group-hover:text-rose-400 transition-colors">
                  <span>Discipline log</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          {/* Tournament Awards List */}
          {profile.awards && profile.awards.length > 0 && (
            <div className="card-gloss p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Tournament Awards &amp; Recognitions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.awards.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-xl bg-[#161D36] border border-amber-500/30 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-amber-400">{a.category}</span>
                    <h4 className="text-xs font-bold text-white">{a.title}</h4>
                    <p className="text-xs text-slate-300 italic">{a.citation}</p>
                    <p className="text-[10px] text-slate-400 pt-1">{a.season_name} &bull; {a.awarded_date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: FOLLOWERS */}
      {activeTab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {followersList.length > 0 ? (
            followersList.map((f) => (
              <Link
                key={f.id}
                href={`/members/${f.username}`}
                className="card-gloss p-4 rounded-xl flex items-center gap-3 hover:border-emerald-500/40"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                  {(f.profile_picture || f.avatar_url || f.profile_picture_url) ? (
                    <img src={f.profile_picture || f.avatar_url || f.profile_picture_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{f.first_name ? f.first_name[0] : 'U'}</span>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{f.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{f.batch_display} &bull; {f.department}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center col-span-3">No followers yet.</p>
          )}
        </div>
      )}

      {/* TAB CONTENT: FOLLOWING */}
      {activeTab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {followingList.length > 0 ? (
            followingList.map((f) => (
              <Link
                key={f.id}
                href={`/members/${f.username}`}
                className="card-gloss p-4 rounded-xl flex items-center gap-3 hover:border-emerald-500/40"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                  {(f.profile_picture || f.avatar_url || f.profile_picture_url) ? (
                    <img src={f.profile_picture || f.avatar_url || f.profile_picture_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{f.first_name ? f.first_name[0] : 'U'}</span>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{f.full_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{f.batch_display} &bull; {f.department}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center col-span-3">Not following anyone yet.</p>
          )}
        </div>
      )}

      {/* 4. FOOTBALL STATS DETAIL BREAKDOWN MODAL */}
      {activeStatModal && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setActiveStatModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card-gloss max-w-2xl w-full p-5 sm:p-7 rounded-3xl border border-[#2C3960] shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto bg-[#0F172A]/95 text-left flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#2C3960]/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Trophy className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    {activeStatModal === 'appearances' && `Tournament Appearances (${profile.football_stats?.appearances || 0})`}
                    {activeStatModal === 'goals' && `Tournament Goals Scored (${profile.football_stats?.goals || 0})`}
                    {activeStatModal === 'assists' && `Tournament Assists (${profile.football_stats?.assists || 0})`}
                    {activeStatModal === 'potm' && `Player of the Match Honors (${profile.football_stats?.player_of_the_match || 0})`}
                    {activeStatModal === 'yellow_cards' && `Yellow Card Disciplinary Log (${profile.football_stats?.yellow_cards || 0})`}
                    {activeStatModal === 'red_cards' && `Red Card Disciplinary Log (${profile.football_stats?.red_cards || 0})`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {profile.full_name} &bull; {profile.batch_display || profile.academic_year}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveStatModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveStatModal('appearances')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'appearances'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Appearances ({profile.football_stats?.appearances || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatModal('goals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'goals'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Goals ({profile.football_stats?.goals || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatModal('assists')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'assists'
                    ? 'bg-blue-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Assists ({profile.football_stats?.assists || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatModal('potm')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'potm'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                POTM ({profile.football_stats?.player_of_the_match || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatModal('yellow_cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'yellow_cards'
                    ? 'bg-amber-300 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Yellow Cards ({profile.football_stats?.yellow_cards || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveStatModal('red_cards')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeStatModal === 'red_cards'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Red Cards ({profile.football_stats?.red_cards || 0})
              </button>
            </div>

            {/* Scrollable Event List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[56vh]">
              {/* APPEARANCES */}
              {activeStatModal === 'appearances' && (
                profile.football_stats?.appearances_list?.length > 0 ? (
                  profile.football_stats.appearances_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-[#2C3960]/80 hover:border-emerald-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {item.role} &bull; #{item.jersey_number}
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {item.stage} {item.round_number ? `(Round ${item.round_number})` : ''}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Final Score: </span>
                          <span className="font-extrabold text-white">{item.scoreline}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.match_date} &bull; {item.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Represented: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-[#2C3960]/60 space-y-2">
                    <Users className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Official Appearances Recorded</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      This member has not yet appeared on an official tournament match sheet this season.
                    </p>
                  </div>
                )
              )}

              {/* GOALS */}
              {activeStatModal === 'goals' && (
                profile.football_stats?.goals_list?.length > 0 ? (
                  profile.football_stats.goals_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-md">
                            ⚽ Minute {item.minute}&apos;{item.extra_minute ? `+${item.extra_minute}&apos;` : ''}
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">
                        {item.description || 'Goal scored'}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Assisted by: </span>
                          <span className="font-semibold text-emerald-300">
                            {item.assister_name || 'Solo Effort / Unassisted'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.scoreline} &bull; {item.match_date}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Scored for: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-[#2C3960]/60 space-y-2">
                    <Flame className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Tournament Goals Yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No goals registered yet in official tournament competition.
                    </p>
                  </div>
                )
              )}

              {/* ASSISTS */}
              {activeStatModal === 'assists' && (
                profile.football_stats?.assists_list?.length > 0 ? (
                  profile.football_stats.assists_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-blue-500/30 hover:border-blue-500/60 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-500 text-slate-950 flex items-center gap-1 shadow-md">
                            👟 Minute {item.minute}&apos;{item.extra_minute ? `+${item.extra_minute}&apos;` : ''}
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-400">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">
                        {item.description || 'Assisted teammate goal'}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Goal Scored by: </span>
                          <span className="font-semibold text-blue-300">
                            {item.scorer_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.scoreline} &bull; {item.match_date}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Assisted for: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-[#2C3960]/60 space-y-2">
                    <Sparkles className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No Tournament Assists Yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No assists registered yet in official tournament competition.
                    </p>
                  </div>
                )
              )}

              {/* POTM */}
              {activeStatModal === 'potm' && (
                profile.football_stats?.potm_list?.length > 0 ? (
                  profile.football_stats.potm_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-amber-500/40 hover:border-amber-400 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400 text-slate-950 flex items-center gap-1 shadow-md">
                            ⭐ Player of the Match (MVP)
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-300">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-xs text-amber-200 italic">
                        &ldquo;{item.citation}&rdquo;
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Match Score: </span>
                          <span className="font-bold text-white">{item.scoreline}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.match_date} &bull; {item.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Represented: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-[#2C3960]/60 space-y-2">
                    <Trophy className="w-10 h-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No POTM Honors Yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Player of the Match awards are selected at the conclusion of each completed fixture.
                    </p>
                  </div>
                )
              )}

              {/* YELLOW CARDS */}
              {activeStatModal === 'yellow_cards' && (
                profile.football_stats?.yellow_cards_list?.length > 0 ? (
                  profile.football_stats.yellow_cards_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-amber-300/40 hover:border-amber-300 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-300 text-slate-950 flex items-center gap-1 shadow-md">
                            🟨 Caution ({item.minute}&apos;)
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">
                        {item.description || 'Cautioned by referee'}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Match Score: </span>
                          <span className="font-semibold text-white">{item.scoreline}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.match_date} &bull; {item.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Team: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Clean Disciplinary Record</p>
                    <p className="text-xs text-emerald-300 max-w-sm mx-auto">
                      0 yellow cards received. Outstanding Christian discipline and sportsmanship on the pitch!
                    </p>
                  </div>
                )
              )}

              {/* RED CARDS */}
              {activeStatModal === 'red_cards' && (
                profile.football_stats?.red_cards_list?.length > 0 ? (
                  profile.football_stats.red_cards_list.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-[#161D36] border border-rose-500/40 hover:border-rose-400 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500 text-white flex items-center gap-1 shadow-md">
                            🟥 Dismissal ({item.minute}&apos;)
                          </span>
                          <span className="text-xs font-bold text-white">
                            vs {item.opponent_team} {item.opponent_nickname ? `("${item.opponent_nickname}")` : ''}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-rose-400">
                          {item.stage}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200">
                        {item.description || 'Dismissed by referee'}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-[#2C3960]/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="text-slate-300">
                          <span className="text-slate-400 text-[11px]">Match Score: </span>
                          <span className="font-semibold text-white">{item.scoreline}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.match_date} &bull; {item.venue}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-400">
                          Team: <strong className="text-slate-200">{item.team_represented}</strong>
                        </span>
                        <Link
                          href={`/matches/${item.match_id}`}
                          onClick={() => setActiveStatModal(null)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          View Match Center <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center card-gloss rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Zero Dismissals (No Red Cards)</p>
                    <p className="text-xs text-emerald-300 max-w-sm mx-auto">
                      0 red cards. Exemplary Christian conduct and fellowship honor representing your batch team.
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#2C3960]/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 italic">
                Focus Football Cup Official Tournament Statistics
              </span>
              <button
                type="button"
                onClick={() => setActiveStatModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Profile Photo Lightbox */}
      <ProfilePhotoLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        profile={profile}
      />
    </div>
  );
}

export default function MemberProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 flex items-center justify-center text-slate-400">Loading member profile...</div>}>
      <MemberProfileContent />
    </Suspense>
  );
}
