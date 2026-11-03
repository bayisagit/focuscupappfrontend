'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, ExternalLink, Shield, GraduationCap, Users } from 'lucide-react';

export interface LightboxProfile {
  id?: number | string;
  username?: string;
  full_name: string;
  profile_picture?: string | null;
  avatar_url?: string | null;
  profile_picture_url?: string | null;
  department?: string;
  college_display?: string;
  academic_year?: string;
  batch_display?: string;
  fellowship_team?: string;
  primary_position?: string;
  preferred_jersey_number?: number | string | null;
  personal_chant?: string;
}

interface ProfilePhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LightboxProfile | null;
}

export default function ProfilePhotoLightbox({
  isOpen,
  onClose,
  profile,
}: ProfilePhotoLightboxProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${profile.full_name}'s profile photo`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Lightbox Content Container */}
      <div
        className="relative max-w-2xl w-full bg-[#10172A] border border-[#2C3960] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2C3960]/80 bg-[#0B132B]">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
              {profile.full_name} &bull; Profile Photo
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
            title="Close lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Image Display Area */}
        <div className="relative flex-1 min-h-[300px] max-h-[60vh] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
          {(profile.profile_picture || profile.avatar_url || profile.profile_picture_url) ? (
            <img
              src={(profile.profile_picture || profile.avatar_url || profile.profile_picture_url) as string}
              alt={profile.full_name}
              className="max-h-[56vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-emerald-950/60 border-4 border-emerald-500/40 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Users className="w-16 h-16 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">No photo uploaded</span>
            </div>
          )}

          {/* Jersey Number Tag Overlay */}
          {profile.preferred_jersey_number && (
            <div className="absolute bottom-6 right-6 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-xl flex items-center gap-1 border border-amber-300">
              #{profile.preferred_jersey_number}
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        <div className="p-5 bg-[#0E162E] border-t border-[#2C3960]/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{profile.full_name}</h3>
                {(profile.batch_display || profile.academic_year) && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {profile.batch_display || profile.academic_year}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{profile.department || 'Department'}</span>
                {profile.fellowship_team && (
                  <>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-blue-300 font-medium">{profile.fellowship_team}</span>
                  </>
                )}
              </p>
            </div>

            {profile.username && (
              <Link
                href={`/members/${profile.username}`}
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>View Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {profile.personal_chant && (
            <p className="text-xs text-amber-300 italic border-l-2 border-amber-400 pl-3 py-0.5 bg-amber-500/5 rounded-r-lg">
              &ldquo;{profile.personal_chant}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
