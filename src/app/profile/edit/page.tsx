'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { UserCog, User, Trophy, Check, ArrowLeft, Camera, Upload, Sparkles, Cloud, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Spinner from '@/components/Spinner';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
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

  // Photo Upload States
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Batch Squad Jersey Availability
  const [takenNumbers, setTakenNumbers] = useState<number[]>([]);
  const [batchName, setBatchName] = useState<string>('');

  useEffect(() => {
    let active = true;

    // Load available registration options (fellowship teams, football positions, etc.)
    api.members.getOptions()
      .then((opts) => {
        if (active) setOptions(opts);
      })
      .catch((err) => console.error('Failed to load options', err));

    // Fetch authoritative current profile directly from backend
    api.auth.getMe()
      .then((meData) => {
        if (!active) return;
        const p = meData?.profile;
        if (p) {
          setFormData({
            first_name: p.first_name || '',
            second_name: p.second_name || '',
            fellowship_team: p.fellowship_team || 'No Team',
            primary_position: p.primary_position || '',
            secondary_position: p.secondary_position || '',
            preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
            personal_chant: p.personal_chant || '',
            bio: p.bio || '',
          });
          setCurrentPhoto(p.profile_picture || null);

          if (p.competing_batch) {
            api.members.getBatchJerseys(p.competing_batch)
              .then((bData) => {
                if (active && bData) {
                  setTakenNumbers(bData.taken_numbers || []);
                  setBatchName(bData.batch_name || '');
                }
              })
              .catch((err) => console.warn('Could not load batch jerseys in profile edit', err));
          }
        }
        setProfileLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load getMe profile', err);
        if (active) {
          if (user?.profile) {
            const p = user.profile;
            setFormData({
              first_name: p.first_name || '',
              second_name: p.second_name || '',
              fellowship_team: p.fellowship_team || 'No Team',
              primary_position: p.primary_position || '',
              secondary_position: p.secondary_position || '',
              preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
              personal_chant: p.personal_chant || '',
              bio: p.bio || '',
            });
            setCurrentPhoto(p.profile_picture || null);

            if (p.competing_batch) {
              api.members.getBatchJerseys(p.competing_batch)
                .then((bData) => {
                  if (active && bData) {
                    setTakenNumbers(bData.taken_numbers || []);
                    setBatchName(bData.batch_name || '');
                  }
                })
                .catch((err) => console.warn('Could not load batch jerseys in profile edit', err));
            }
          }
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Sync if user context loads later and form is still unpopulated
  useEffect(() => {
    if (user?.profile && !formData.first_name) {
      const p = user.profile;
      setFormData({
        first_name: p.first_name || '',
        second_name: p.second_name || '',
        fellowship_team: p.fellowship_team || 'No Team',
        primary_position: p.primary_position || '',
        secondary_position: p.secondary_position || '',
        preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
        personal_chant: p.personal_chant || '',
        bio: p.bio || '',
      });
    }
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setUploadProgress('');

    try {
      let finalPhotoUrl = currentPhoto;

      if (photoFile) {
        setUploadProgress('Uploading photo to Cloudinary CDN...');
        try {
          const cloudRes = await uploadToCloudinary(photoFile, 'focus_fellowship/profiles');
          finalPhotoUrl = cloudRes.secure_url;
          setUploadProgress('Photo uploaded to Cloudinary! Saving profile...');
        } catch (uploadErr: any) {
          console.warn('Cloudinary upload status:', uploadErr);
          if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
            alert('Cloudinary settings missing: To store photos in Cloudinary, add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to frontend/.env.local.');
          } else {
            alert(`Cloudinary error: ${uploadErr.message}`);
          }
          setLoading(false);
          setUploadProgress('');
          return;
        }
      }

      await api.members.updateProfile({
        first_name: formData.first_name.trim(),
        second_name: formData.second_name.trim(),
        fellowship_team: formData.fellowship_team,
        primary_position: formData.primary_position || null,
        secondary_position: formData.secondary_position || null,
        preferred_jersey_number: formData.preferred_jersey_number ? Number(formData.preferred_jersey_number) : null,
        personal_chant: formData.personal_chant.trim(),
        bio: formData.bio.trim(),
        ...(finalPhotoUrl ? { profile_picture_url: finalPhotoUrl } : {}),
      });

      await refreshUser();
      setSuccess(true);
      setTimeout(() => {
        router.push(user?.username ? `/members/${user.username}` : '/members');
      }, 1200);
    } catch (err: any) {
      alert(err.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-6">
        <Link
          href={user?.username ? `/members/${user.username}` : '/members'}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Profile
        </Link>
      </div>

      <div className="card-gloss p-8 rounded-3xl border border-[#2C3960] shadow-2xl">
        <h1 className="text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <UserCog className="w-5 h-5" />
          </span>
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

        {profileLoading && !formData.first_name ? (
          <div className="py-16 text-center">
            <Spinner
              size="lg"
              color="emerald"
              label="Loading your profile information..."
              sublabel="AASTU Focus Fellowship"
              centered
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Uploader Section */}
            <div className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-4">
              <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Profile Photo (Stored in Cloudinary)
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Photo Preview Avatar */}
                <div className="relative w-24 h-24 rounded-2xl bg-[#0B132B] border-2 border-emerald-400/40 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
                  {photoPreview || currentPhoto ? (
                    <img
                      src={photoPreview || currentPhoto || ''}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-500" />
                  )}
                  {photoPreview && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px]">
                      New
                    </span>
                  )}
                </div>

                {/* Upload Action */}
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-2 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoPreview || currentPhoto ? 'Replace Photo' : 'Choose Photo'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handlePhotoSelect}
                        className="hidden"
                      />
                    </label>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, or WEBP up to 5MB. Hosted securely on Cloudinary CDN for instant fullscreen lightbox view.
                  </p>

                  {uploadProgress && (
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 animate-pulse" />
                      {uploadProgress}
                    </p>
                  )}
                </div>
              </div>
            </div>

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
                <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Jersey Number (1-99)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formData.preferred_jersey_number}
                  onChange={(e) => setFormData({ ...formData, preferred_jersey_number: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
                {formData.preferred_jersey_number && takenNumbers.includes(Number(formData.preferred_jersey_number)) && (
                  <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      #{formData.preferred_jersey_number} is already taken in {batchName || 'your batch'} squad.
                    </span>
                  </p>
                )}
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
                href={user?.username ? `/members/${user.username}` : '/members'}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="xs" color="slate" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
