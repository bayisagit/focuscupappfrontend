'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Heart,
  Shield,
  Trophy,
  Award,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Flame,
  Check,
} from 'lucide-react';

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

  useEffect(() => {
    if (username) {
      api.members.getDetail(username as string)
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
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-emerald-800/40 border-4 border-emerald-400/40 overflow-hidden shadow-2xl flex items-center justify-center">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-emerald-300" />
                )}
              </div>
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

          {/* Football Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-white">{profile.football_stats?.appearances || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Appearances</p>
            </div>
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-emerald-400">{profile.football_stats?.goals || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Goals</p>
            </div>
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-blue-400">{profile.football_stats?.assists || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Assists</p>
            </div>
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-amber-400">{profile.football_stats?.player_of_the_match || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">POTM Awards</p>
            </div>
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-amber-300">{profile.football_stats?.yellow_cards || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Yellow Cards</p>
            </div>
            <div className="card-gloss p-4 rounded-2xl text-center">
              <p className="text-2xl font-black text-rose-400">{profile.football_stats?.red_cards || 0}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold mt-1">Red Cards</p>
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
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center font-bold text-white overflow-hidden">
                  {f.profile_picture ? <img src={f.profile_picture} alt="" className="w-full h-full object-cover" /> : f.first_name[0]}
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
                <div className="w-10 h-10 rounded-full bg-emerald-800/40 flex items-center justify-center font-bold text-white overflow-hidden">
                  {f.profile_picture ? <img src={f.profile_picture} alt="" className="w-full h-full object-cover" /> : f.first_name[0]}
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
