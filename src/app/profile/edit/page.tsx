'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  UserCog,
  User,
  Trophy,
  Check,
  ArrowLeft,
  Camera,
  Upload,
  Sparkles,
  Cloud,
  AlertCircle,
  GraduationCap,
  Mail,
  Shield,
  CheckCircle2,
} from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    second_name: '',
    email: '',
    gender: 'MALE',
    college: 'ENGINEERING',
    department: 'Software Engineering',
    academic_year: '2nd Year',
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

  // Fetch options and profile
  useEffect(() => {
    let active = true;

    // Load available registration options (fellowship teams, football positions, colleges, departments, etc.)
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
            email: meData.email || user?.email || '',
            gender: p.gender || 'MALE',
            college: p.college || 'ENGINEERING',
            department: p.department || 'Software Engineering',
            academic_year: p.academic_year || '2nd Year',
            fellowship_team: p.fellowship_team || 'No Team',
            primary_position: p.primary_position || '',
            secondary_position: p.secondary_position || '',
            preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
            personal_chant: p.personal_chant || '',
            bio: p.bio || '',
          });
          setCurrentPhoto(p.profile_picture || null);
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
              email: user.email || '',
              gender: p.gender || 'MALE',
              college: p.college || 'ENGINEERING',
              department: p.department || 'Software Engineering',
              academic_year: p.academic_year || '2nd Year',
              fellowship_team: p.fellowship_team || 'No Team',
              primary_position: p.primary_position || '',
              secondary_position: p.secondary_position || '',
              preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
              personal_chant: p.personal_chant || '',
              bio: p.bio || '',
            });
            setCurrentPhoto(p.profile_picture || null);
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
        email: user.email || '',
        gender: p.gender || 'MALE',
        college: p.college || 'ENGINEERING',
        department: p.department || 'Software Engineering',
        academic_year: p.academic_year || '2nd Year',
        fellowship_team: p.fellowship_team || 'No Team',
        primary_position: p.primary_position || '',
        secondary_position: p.secondary_position || '',
        preferred_jersey_number: p.preferred_jersey_number != null ? String(p.preferred_jersey_number) : '',
        personal_chant: p.personal_chant || '',
        bio: p.bio || '',
      });
    }
  }, [user]);

  // When college changes, auto-select default department and academic year
  const handleCollegeChange = (col: string) => {
    let defaultDept = 'Other';
    let defaultYear = 'Other';

    if (col === 'ENGINEERING') {
      defaultDept = 'Software Engineering';
      defaultYear = '2nd Year';
    } else if (col === 'APPLIED_SCIENCES') {
      defaultDept = 'Food Science';
      defaultYear = '2nd Year';
    }

    setFormData((prev) => ({
      ...prev,
      college: col,
      department: defaultDept,
      academic_year: defaultYear,
    }));
  };

  // Compute available departments & years for current selected college
  const currentDepartments = options?.departments?.[formData.college] || [];
  const currentYears = options?.academic_years?.[formData.college] || [];

  // Determine official batch info dynamically from selected college and academic year
  const batchAffiliation = useMemo(() => {
    if (formData.college === 'OTHER' || formData.academic_year === '1st Year' || formData.academic_year === 'Other') {
      return {
        batchCode: null,
        batchLabel: 'Community Fellowship (Non-competing)',
        isEligible: false,
      };
    }
    const map: Record<string, { code: string; label: string }> = {
      '2nd Year': { code: '2ND_YEAR', label: '2nd Year Batch Squad' },
      '3rd Year': { code: '3RD_YEAR', label: '3rd Year Batch Squad' },
      '4th Year': { code: '4TH_YEAR', label: '4th Year Batch Squad' },
      '5th Year': { code: '5TH_YEAR', label: '5th Year Batch Squad' },
    };
    const info = map[formData.academic_year];
    return info
      ? { batchCode: info.code, batchLabel: info.label, isEligible: true }
      : { batchCode: null, batchLabel: 'Community Fellowship', isEligible: false };
  }, [formData.college, formData.academic_year]);

  // Fetch taken jerseys whenever batch affiliation changes
  useEffect(() => {
    if (batchAffiliation.batchCode) {
      api.members.getBatchJerseys(batchAffiliation.batchCode)
        .then((bData) => {
          if (bData) {
            setTakenNumbers(bData.taken_numbers || []);
            setBatchName(bData.batch_name || batchAffiliation.batchLabel);
          }
        })
        .catch((err) => console.warn('Could not load batch jerseys', err));
    } else {
      setTakenNumbers([]);
      setBatchName('');
    }
  }, [batchAffiliation.batchCode]);

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
    setErrorMessage(null);
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
        email: formData.email.trim(),
        gender: formData.gender,
        college: formData.college,
        department: formData.department,
        academic_year: formData.academic_year,
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
      console.error('Update profile error:', err);
      const errs = err.data || {};
      const firstKey = Object.keys(errs)[0];
      const message = firstKey
        ? Array.isArray(errs[firstKey])
          ? errs[firstKey][0]
          : errs[firstKey]
        : err.data?.error || err.message || 'Failed to update profile. Please verify your inputs.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 min-h-screen">
      {/* Back to Profile Top Link */}
      <div className="mb-6">
        <Link
          href={user?.username ? `/members/${user.username}` : '/members'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161D36] border border-[#2C3960] hover:border-emerald-500/60 hover:bg-[#1C2541] text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:-translate-x-1"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to My Profile</span>
        </Link>
      </div>

      <div className="card-gloss p-6 sm:p-8 rounded-3xl border border-[#2C3960] shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <UserCog className="w-5 h-5" />
              </span>
              Edit Fellowship &amp; Football Profile
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Update your personal credentials, correct your academic batch &amp; department, and manage your football squad identity
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="my-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">Profile updated successfully! Redirecting back to your profile...</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="my-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
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
          <form onSubmit={handleSubmit} className="space-y-8 mt-6">
            {/* 1. Profile Photo Section */}
            <div className="p-5 rounded-2xl bg-[#161D36] border border-[#2C3960] space-y-4">
              <label className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Profile Photo (Cloudinary CDN)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-5">
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
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
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

            {/* 2. Personal Information */}
            <div className="p-5 rounded-2xl bg-[#161D36]/70 border border-[#2C3960] space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2C3960]/60 pb-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Personal Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Second Name (Father Name) *</label>
                  <input
                    type="text"
                    value={formData.second_name}
                    onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {options?.genders ? (
                      options.genders.map((g: any) => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Academic Batch & Department (Requested Correction Feature) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161D36] to-[#1C2541] border border-emerald-500/40 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2C3960]/60 pb-2">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                  <span>Academic Batch &amp; Department</span>
                </h2>
                <span className="text-[10px] text-emerald-400/90 font-medium bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  Batch Correction Enabled
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0B132B]/80 border border-[#2C3960] text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Made an error choosing your batch or department when you registered? Correct it here. Your official football tournament squad affiliation and eligibility will update automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* College */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">College *</label>
                  <select
                    value={formData.college}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {options?.colleges?.map((c: any) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {currentDepartments.map((d: any) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Academic Year / Batch */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year / Batch *</label>
                  <select
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {currentYears.map((y: any) => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Batch Affiliation Badge */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0B132B]/60 border border-[#2C3960]/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-300">Official Tournament Squad:</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                    batchAffiliation.isEligible
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {batchAffiliation.batchLabel}
                  </span>
                </div>

                {batchAffiliation.isEligible && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Eligible for batch competition
                  </span>
                )}
              </div>
            </div>

            {/* 4. Fellowship Ministry Team */}
            <div className="p-5 rounded-2xl bg-[#161D36]/70 border border-[#2C3960] space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2C3960]/60 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Fellowship Ministry Team</span>
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Ministry Team *</label>
                <select
                  value={formData.fellowship_team}
                  onChange={(e) => setFormData({ ...formData, fellowship_team: e.target.value })}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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

            {/* 5. Football Identity & Positions */}
            <div className="p-5 rounded-2xl bg-[#161D36]/70 border border-[#2C3960] space-y-4">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#2C3960]/60 pb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Football Identity &amp; Squad Positions</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Primary Position */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Pitch Position</label>
                  <select
                    value={formData.primary_position}
                    onChange={(e) => setFormData({ ...formData, primary_position: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None / Community Member</option>
                    {options?.football_positions?.map((p: any) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Secondary Position */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Secondary Position (Optional)</label>
                  <select
                    value={formData.secondary_position}
                    onChange={(e) => setFormData({ ...formData, secondary_position: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None / Same as Primary</option>
                    {options?.football_positions?.map((p: any) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Preferred Jersey Number */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Preferred Jersey Number (1-99)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.preferred_jersey_number}
                    onChange={(e) => setFormData({ ...formData, preferred_jersey_number: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  {formData.preferred_jersey_number && takenNumbers.includes(Number(formData.preferred_jersey_number)) && (
                    <p className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        #{formData.preferred_jersey_number} is already taken in {batchName || 'this batch'} squad.
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Personal Faith / Football Motto
                </label>
                <input
                  type="text"
                  value={formData.personal_chant}
                  onChange={(e) => setFormData({ ...formData, personal_chant: e.target.value })}
                  placeholder="e.g. Jesus Is My Savior, Playing For His Glory"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Personal Biography</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Share a short introduction with fellowship brethren..."
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#2C3960]">
              <Link
                href={user?.username ? `/members/${user.username}` : '/members'}
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Spinner size="xs" color="slate" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  'Save Profile & Batch Info'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
