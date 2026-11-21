'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Image as ImageIcon,
  Camera,
  Plus,
  X,
  History,
  Maximize2,
  Trophy,
  Heart,
  Sparkles,
} from 'lucide-react';
import { FORMER_GALLERY_PHOTOS, FormerPhoto } from '@/data/formerGallery';
import FormerPhotoItem from '@/components/FormerPhotoItem';
import GalleryLightbox from '@/components/GalleryLightbox';
import TournamentPhotoLightbox from '@/components/TournamentPhotoLightbox';
import Spinner from '@/components/Spinner';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { apiCache } from '@/lib/cache';

function normalizeAlbums(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function GalleryPage() {
  const { user } = useAuth();
  const cachedAlbums = apiCache.get<any>('/api/v1/community/gallery/');
  const initialAlbums = normalizeAlbums(cachedAlbums);
  const [albums, setAlbums] = useState<any[]>(initialAlbums);
  const [loading, setLoading] = useState<boolean>(() => initialAlbums.length === 0);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(() => (initialAlbums.length > 0 ? initialAlbums[0].id : null));
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [quota, setQuota] = useState<any>({
    uploaded_count: 0,
    max_allowed: 3,
    is_manager: false,
    can_upload: true,
    remaining: 3,
    batch_limit: 1,
  });

  // Former Gallery State (dynamically supports photo-16, photo-17, etc.)
  const [formerPhotos, setFormerPhotos] = useState<FormerPhoto[]>(FORMER_GALLERY_PHOTOS);
  const [formerCategory, setFormerCategory] = useState<string>('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentFormerIndex, setCurrentFormerIndex] = useState(0);

  // Active Tournament Photos Lightbox State
  const [tournamentLightboxOpen, setTournamentLightboxOpen] = useState(false);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);

  const loadQuota = () => {
    if (user) {
      api.community.getUploadQuota()
        .then((q) => setQuota(q))
        .catch(() => {});
    }
  };

  const loadGallery = (force = false) => {
    if (force) {
      apiCache.invalidate('/api/v1/community/gallery/');
    }
    api.community.getGallery({ forceRefresh: force })
      .then((data) => {
        const list = normalizeAlbums(data);
        setAlbums(list);
        if (list.length > 0) {
          setSelectedAlbum((prev) => (prev && list.some((a) => a.id === prev) ? prev : list[0].id));
        }
      })
      .catch((err) => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    if (user) {
      loadQuota();
    }
  }, [user]);

  // Dynamically fetch all former gallery photos (detects photo-16, photo-17, etc.)
  useEffect(() => {
    fetch('/api/former-gallery')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.photos) && data.photos.length > 0) {
          setFormerPhotos(data.photos);
        }
      })
      .catch((err) => console.error('Failed to load former photos from API', err));
  }, []);

  const maxBatchLimit = quota.is_manager ? 10 : Math.max(1, 3 - (quota.uploaded_count || 0));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const combined = [...files, ...selected];
    const unique = combined.filter(
      (f, idx, arr) =>
        arr.findIndex(
          (x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified
        ) === idx
    );

    if (unique.length > maxBatchLimit) {
      alert(
        `You can select up to ${maxBatchLimit} images at once${
          quota.is_manager ? ' as a Tournament Manager' : ''
        }. The first ${maxBatchLimit} images have been selected.`
      );
      setFiles(unique.slice(0, maxBatchLimit));
    } else {
      setFiles(unique);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quota.can_upload) {
      alert('You have reached the maximum limit of 3 match photos.');
      return;
    }
    if (files.length === 0 || !selectedAlbum) {
      alert('Please select an album and at least one image file.');
      return;
    }
    if (files.length > maxBatchLimit) {
      alert(`You can upload a maximum of ${maxBatchLimit} photos at once.`);
      return;
    }

    setUploading(true);
    setUploadProgressText(`Preparing ${files.length} photo${files.length > 1 ? 's' : ''}...`);

    try {
      let payload: any;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'bzr2e9rj';
      if (cloudName) {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          setUploadProgressText(`Uploading photo ${i + 1} of ${files.length} to Cloudinary CDN...`);
          const cloudRes = await uploadToCloudinary(files[i], 'focus_fellowship/matches');
          uploadedUrls.push(cloudRes.secure_url);
        }

        setUploadProgressText(`Saving ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} to tournament gallery...`);
        payload = {
          album: Number(selectedAlbum),
          image_urls: uploadedUrls,
          caption: caption.trim(),
        };
      } else {
        const formData = new FormData();
        formData.append('album', selectedAlbum.toString());
        files.forEach((f) => {
          formData.append('images', f);
        });
        if (caption) formData.append('caption', caption.trim());
        payload = formData;
      }

      const res = await api.community.uploadPhoto(payload);
      alert(res?.message || `Successfully uploaded ${files.length} photo${files.length > 1 ? 's' : ''}!`);
      setUploadModalOpen(false);
      setFiles([]);
      setCaption('');
      setUploadProgressText('');
      apiCache.invalidate('/api/v1/community/gallery/');
      loadGallery(true);
      loadQuota();
    } catch (err: any) {
      alert(err.data?.error || err.message || 'Failed to upload photo(s).');
    } finally {
      setUploading(false);
      setUploadProgressText('');
    }
  };

  const safeAlbums = Array.isArray(albums) ? albums : [];
  const currentAlbumData = safeAlbums.find((a) => a?.id === selectedAlbum) || safeAlbums[0] || null;
  const currentPhotos: any[] = Array.isArray(currentAlbumData?.photos) ? currentAlbumData.photos : [];

  const filteredFormerPhotos = formerCategory === 'All'
    ? formerPhotos
    : formerPhotos.filter((p) => p.category === formerCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#2C3960]/60 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Camera className="w-7 h-7" />
            </span>
            FELLOWSHIP &amp; MATCH GALLERY
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Capturing memories, match action, prayers, and fellowship in Christ
          </p>
        </div>

        {user && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {!quota.is_manager ? (
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                quota.uploaded_count >= 3
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                Photo Quota: {quota.uploaded_count}/3 used ({quota.remaining} left)
              </span>
            ) : (
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                Manager: Unlimited Uploads
              </span>
            )}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Share Match Photo
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Responsive Layout: Left = Current Active Tournament Photos; Right = Former Focus Cup Fellowship Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Current Focus Cup Gallery) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          <div className="card-gloss p-6 sm:p-7 rounded-3xl border border-[#2C3960]/80 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#2C3960]/60">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Current Active Tournament
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Semester Highlights</span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  {currentAlbumData?.title || 'Focus Cup Opening Match Highlights'}
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentAlbumData?.description || 'Joyful moments, prayers, and competitive action from our opening match fixtures.'}
                </p>
              </div>

              {safeAlbums.length > 1 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {safeAlbums.map((alb) => (
                    <button
                      key={alb.id}
                      onClick={() => setSelectedAlbum(alb.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedAlbum === alb.id
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'bg-[#161D36] text-slate-300 hover:text-white border border-[#2C3960]'
                      }`}
                    >
                      {alb.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current Photos Grid */}
            {loading ? (
              <div className="card-gloss p-12 rounded-3xl text-center border border-[#2C3960] shadow-xl my-4">
                <Spinner
                  size="lg"
                  color="emerald"
                  label="Loading fellowship gallery photos..."
                  sublabel="AASTU Focus Football Cup"
                  centered
                />
              </div>
            ) : currentPhotos.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {currentPhotos.map((photo: any, index: number) => {
                    const imgSrc = photo?.image || photo?.image_url || photo?.photo_url || '';
                    return (
                      <div
                        key={photo?.id || index}
                        onClick={() => {
                          setCurrentTournamentIndex(index);
                          setTournamentLightboxOpen(true);
                        }}
                        className="card-gloss rounded-2xl overflow-hidden group relative aspect-square border border-[#2C3960]/80 hover:border-emerald-400/80 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/15 cursor-pointer"
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={photo?.caption || 'Match moment'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.5';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#161D36] flex flex-col items-center justify-center p-3 text-slate-400">
                            <Camera className="w-8 h-8 text-emerald-400 mb-1" />
                            <span className="text-[10px]">Photo #{index + 1}</span>
                          </div>
                        )}

                        {/* Top Badges overlay on hover */}
                        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500 text-slate-950 shadow-sm">
                            Match #{index + 1}
                          </span>
                          <span className="p-1.5 rounded-lg bg-slate-900/80 text-white backdrop-blur-sm border border-slate-700 shadow-md">
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        </div>

                        {/* Bottom Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end pointer-events-none">
                          {photo?.caption && (
                            <p className="text-xs font-semibold text-white truncate">{photo.caption}</p>
                          )}
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="text-emerald-400 font-medium truncate max-w-[130px]">
                              Photo by {photo?.uploaded_by_name || 'Member'}
                            </span>
                            <span className="text-emerald-300 font-bold shrink-0">View &rarr;</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Open Fullscreen Lightbox Button for Tournament Photos */}
                <button
                  onClick={() => {
                    setCurrentTournamentIndex(0);
                    setTournamentLightboxOpen(true);
                  }}
                  className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" /> Open Fullscreen Lightbox ({currentPhotos.length} Photo{currentPhotos.length === 1 ? '' : 's'})
                </button>
              </>
            ) : (
              <div className="card-gloss p-8 rounded-2xl text-center space-y-3 border border-dashed border-[#2C3960]">
                <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">Opening Match Gallery Uploads</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Photographs from opening match fixtures are being curated by fellowship media members. Fellowship members can also share match photographs using the &ldquo;Share Match Photo&rdquo; button above!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Former Focus Cup Fellowship Gallery */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          <div className="card-gloss p-6 sm:p-7 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#1C2541]/90 to-[#0B1120]/90">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1 mb-1.5">
                  <History className="w-3 h-3" /> Historical Heritage
                </span>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  Former Focus Cup Gallery
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Memories of previous games, match action &amp; championship fellowship in Christ.
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20">
                {formerPhotos.length} Photos
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
              {['All', 'Match Action', 'Fellowship & Prayer', 'Celebration & Trophy', 'Batch Squads'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormerCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    formerCategory === cat
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                      : 'bg-[#161D36] text-slate-400 hover:text-white border border-[#2C3960]'
                  }`}
                >
                  {cat === 'All' ? `All (${formerPhotos.length})` : cat}
                </button>
              ))}
            </div>

            {/* Interactive Grid of Former Photos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredFormerPhotos.map((photo, index) => {
                const globalIndex = formerPhotos.findIndex((p) => p.id === photo.id);
                return (
                  <FormerPhotoItem
                    key={photo.id}
                    photo={photo}
                    onClick={() => {
                      setCurrentFormerIndex(globalIndex >= 0 ? globalIndex : index);
                      setLightboxOpen(true);
                    }}
                  />
                );
              })}
            </div>

            {/* Open Fullscreen Lightbox Button */}
            <button
              onClick={() => {
                setCurrentFormerIndex(0);
                setLightboxOpen(true);
              }}
              className="mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" /> Open Fullscreen Lightbox ({formerPhotos.length} Photos)
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal (Supports any number of photos: 15, 16, 20+) */}
      <GalleryLightbox
        photos={formerPhotos}
        currentIndex={currentFormerIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onSelectIndex={(idx) => setCurrentFormerIndex(idx)}
      />

      {/* Active Tournament Match Photos Lightbox */}
      <TournamentPhotoLightbox
        photos={currentPhotos}
        currentIndex={currentTournamentIndex}
        isOpen={tournamentLightboxOpen}
        onClose={() => setTournamentLightboxOpen(false)}
        onSelectIndex={(idx) => setCurrentTournamentIndex(idx)}
        albumTitle={currentAlbumData?.title || 'Focus Cup Tournament Highlights'}
      />

      {/* Upload Photo Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="card-gloss max-w-lg w-full max-h-[92vh] flex flex-col p-5 sm:p-6 rounded-3xl border border-[#2C3960] relative overflow-hidden shadow-2xl">
            <button
              onClick={() => {
                if (!uploading) {
                  setUploadModalOpen(false);
                  setFiles([]);
                  setCaption('');
                }
              }}
              disabled={uploading}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {quota.is_manager ? 'Share Match Photos (Batch Upload)' : 'Share a Match Photo'}
              </h3>
            </div>

            {/* Storage Limit & Batch Notice */}
            {quota.is_manager ? (
              <div className="p-3 rounded-2xl mb-4 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shrink-0">
                <p className="font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Tournament Manager Upload
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Up to 10 at once
                  </span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As a tournament manager, you have unlimited storage and can upload <strong>up to 10 match photos simultaneously</strong> in a single batch!
                </p>
              </div>
            ) : (
              <div className={`p-3 rounded-2xl mb-4 text-xs border shrink-0 ${
                !quota.can_upload
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-[#161D36] border-[#2C3960] text-slate-300'
              }`}>
                <p className="font-semibold mb-1 flex items-center justify-between">
                  <span>Storage Conservation Policy</span>
                  <span className="font-mono text-[10px] text-emerald-400">
                    {`${quota.uploaded_count}/3 Used`}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {!quota.can_upload
                    ? 'You have reached the maximum allowed limit of 3 match photos to preserve database storage. Tournament managers handle broad match coverage.'
                    : `To preserve database storage, each fellowship member can post up to 3 match photos (you have ${Math.max(0, 3 - quota.uploaded_count)} slot(s) remaining). Tournament managers have unlimited batch uploads.`}
                </p>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Match Album</label>
                <select
                  value={selectedAlbum || ''}
                  onChange={(e) => setSelectedAlbum(Number(e.target.value))}
                  disabled={!quota.can_upload || uploading}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50 cursor-pointer"
                  required
                >
                  {safeAlbums.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {quota.is_manager ? 'Select Match Photos (Up to 10)' : 'Select Match Photo'}
                  </label>
                  {files.length > 0 && (
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {files.length} / {maxBatchLimit} selected
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple={maxBatchLimit > 1}
                  disabled={!quota.can_upload || uploading}
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                />
                {quota.is_manager && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hold <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">Ctrl</kbd> or <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">Shift</kbd> to select up to 10 images at once.
                  </p>
                )}
              </div>

              {/* Selected Thumbnails Grid */}
              {files.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#0B132B] border border-[#2C3960]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Selected Photos ({files.length}):
                    </span>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => setFiles([])}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer disabled:opacity-40"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1">
                    {files.map((f, idx) => (
                      <div key={`${f.name}-${idx}`} className="relative group rounded-xl overflow-hidden aspect-square border border-[#2C3960]/80 bg-slate-900 shadow-sm">
                        <img
                          src={URL.createObjectURL(f)}
                          alt={f.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={() => removeFile(idx)}
                            className="p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-lg cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pointer-events-none">
                          <p className="text-[9px] text-white truncate font-medium">{f.name}</p>
                          <p className="text-[8px] text-slate-400 font-mono">{(f.size / (1024 * 1024)).toFixed(1)} MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Caption / Description {files.length > 1 ? '(Applies to all selected photos)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={caption}
                  disabled={!quota.can_upload || uploading}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={files.length > 1 ? "e.g. 4th Year vs 5th Year Opening Match Highlights" : "e.g. 2nd Year post-match prayer circle"}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Upload Progress Status Indicator */}
              {uploadProgressText && (
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
                  <Spinner size="xs" color="purple" />
                  <span className="font-medium">{uploadProgressText}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2C3960]/60 shrink-0">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    setUploadModalOpen(false);
                    setFiles([]);
                    setCaption('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer disabled:opacity-40"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={uploading || !quota.can_upload || files.length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                >
                  {uploading ? (
                    <>
                      <Spinner size="xs" color="slate" />
                      <span>{uploadProgressText || 'Uploading...'}</span>
                    </>
                  ) : !quota.can_upload ? (
                    'Limit Reached (3/3)'
                  ) : files.length > 1 ? (
                    `Upload ${files.length} Photos`
                  ) : (
                    'Upload Photo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
