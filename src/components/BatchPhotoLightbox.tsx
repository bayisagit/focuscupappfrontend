'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Maximize2,
  Edit,
  Camera,
  Users,
  Trophy,
  Check,
  Upload,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Shield,
  Loader2,
} from 'lucide-react';
import TeamCrest from '@/components/TeamCrest';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';

export interface BatchTeamData {
  id?: number | string;
  batch_code: string;
  name: string;
  nickname?: string | null;
  motto?: string | null;
  description?: string | null;
  color_hex?: string | null;
  photo_url?: string | null;
  team_photo_url?: string | null;
  team_photo?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  total_members?: number;
  approved_players?: number;
}

interface BatchPhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchTeamData | null;
  onBatchUpdated?: (updatedTeam: BatchTeamData) => void;
}

export default function BatchPhotoLightbox({
  isOpen,
  onClose,
  batch,
  onBatchUpdated,
}: BatchPhotoLightboxProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Edit Form State
  const [formData, setFormData] = useState({
    nickname: '',
    motto: '',
    description: '',
    color_hex: '#10B981',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setFormData({
        nickname: batch.nickname || '',
        motto: batch.motto || '',
        description: batch.description || '',
        color_hex: batch.color_hex || '#10B981',
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
      setError(null);
      setUploadProgress('');
    }
  }, [batch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  if (!isOpen || !batch) return null;

  const activePhoto =
    previewUrl ||
    batch.photo_url ||
    batch.team_photo_url ||
    batch.team_photo ||
    batch.logo_url ||
    batch.logo;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setUploadProgress('');

    try {
      let finalPhotoUrl = batch.team_photo_url || batch.photo_url;

      if (selectedFile) {
        setUploadProgress('Uploading batch photo to Cloudinary CDN...');
        const cloudRes = await uploadToCloudinary(selectedFile, 'focus_fellowship/batches');
        finalPhotoUrl = cloudRes.secure_url;
        setUploadProgress('Photo uploaded! Saving batch profile...');
      }

      const payload: any = {
        nickname: formData.nickname.trim(),
        motto: formData.motto.trim(),
        description: formData.description.trim(),
        color_hex: formData.color_hex,
      };

      if (finalPhotoUrl) {
        payload.team_photo_url = finalPhotoUrl;
      }

      const res = await api.competitions.updateBatch(batch.batch_code, payload);
      const updated = res.team || { ...batch, ...payload, photo_url: finalPhotoUrl };

      if (onBatchUpdated) {
        onBatchUpdated(updated);
      }

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      setError(err.data?.error || err.message || 'Failed to update batch profile.');
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#121A33] border border-[#2C3960] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C3960]/80 bg-[#0E162E]">
          <div className="flex items-center gap-3">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase text-slate-950 shadow"
              style={{ backgroundColor: formData.color_hex || batch.color_hex || '#10B981' }}
            >
              {batch.batch_code.replace('_', ' ')}
            </span>
            <h2 className="text-base sm:text-lg font-black text-white truncate">
              {batch.name}
            </h2>
            {batch.nickname && (
              <span className="hidden sm:inline text-xs text-amber-400 font-semibold italic">
                &ldquo;{batch.nickname}&rdquo;
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user?.is_manager && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Edit batch profile and photo"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto">
          {isEditing ? (
            /* =================== MANAGER EDIT VIEW =================== */
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-[#2C3960]/60 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    Edit Batch Profile &amp; Photo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload a sketch photo or team group photo to display across the platform
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Photo Upload Area */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#0E162E] border border-[#2C3960]">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg">
                  {activePhoto ? (
                    <img src={activePhoto} alt="Batch Preview" className="w-full h-full object-cover" />
                  ) : (
                    <TeamCrest team={batch} size="lg" preferBadge />
                  )}
                  {uploadProgress && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-center p-2">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mb-1" />
                      <span className="text-[10px] text-white font-bold">Uploading...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg transition-transform active:scale-95">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo (Sketch or Group)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, or WEBP up to 5MB. Uploaded securely to Cloudinary CDN for instant fullscreen viewing.
                  </p>
                  {selectedFile && (
                    <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Selected: {selectedFile.name}
                    </p>
                  )}
                  {uploadProgress && (
                    <p className="text-xs text-amber-400 font-bold animate-pulse">
                      {uploadProgress}
                    </p>
                  )}
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Batch Nickname
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="e.g. The Conquerors, The Eagles..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Batch Motto / Verse
                  </label>
                  <input
                    type="text"
                    value={formData.motto}
                    onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                    placeholder="e.g. United in Christ, Strong in Fellowship"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Batch Description &amp; Spirit
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description celebrating brotherhood, fellowship, and sportsmanship..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="w-12 h-10 rounded-xl bg-[#0E162E] border border-[#2C3960] p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color_hex}
                      onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-[#0E162E] border border-[#2C3960] text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C3960]/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Batch Profile</span>
                </button>
              </div>
            </form>
          ) : (
            /* =================== LIGHTBOX FULLSCREEN PHOTO VIEW =================== */
            <div className="flex flex-col">
              {/* Photo Display Viewport */}
              <div className="relative min-h-[320px] max-h-[60vh] bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={batch.name}
                    className="max-h-[56vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-slate-800"
                  />
                ) : (
                  <div className="py-14 text-center space-y-4">
                    <div className="w-24 h-24 mx-auto rounded-3xl shadow-xl flex items-center justify-center">
                      <TeamCrest team={batch} size="xl" preferBadge />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">No batch sketch/photo uploaded yet</p>
                      {user?.is_manager ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Upload Batch Sketch / Photo Now</span>
                        </button>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">
                          Tournament manager can upload the batch sketch or group photo
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Batch Bio & Details Footer */}
              <div className="p-6 bg-[#0E162E] border-t border-[#2C3960]/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">{batch.name}</h3>
                      {batch.nickname && (
                        <span className="text-xs text-amber-400 font-bold">
                          &ldquo;{batch.nickname}&rdquo;
                        </span>
                      )}
                    </div>
                    {batch.motto && (
                      <p className="text-xs text-emerald-400 font-semibold italic mt-0.5">
                        &ldquo;{batch.motto}&rdquo;
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/batches/${batch.batch_code}`}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow shrink-0"
                  >
                    <span>Visit Batch Page &amp; Squad</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {batch.description && (
                  <p className="text-xs text-slate-300 leading-relaxed border-t border-[#2C3960]/50 pt-3">
                    {batch.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

