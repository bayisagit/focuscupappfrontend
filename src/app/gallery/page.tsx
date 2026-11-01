'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Image as ImageIcon, Upload, Camera, Plus, X } from 'lucide-react';

export default function GalleryPage() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadGallery = () => {
    api.community.getGallery()
      .then((data) => {
        const list = data.results || data || [];
        setAlbums(list);
        if (list.length > 0 && !selectedAlbum) {
          setSelectedAlbum(list[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAlbum) {
      alert('Please select an album and an image file.');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('album', selectedAlbum.toString());
    formData.append('image', file);
    if (caption) formData.append('caption', caption);

    try {
      const res = await api.community.uploadPhoto(formData);
      alert(res.message || 'Photo uploaded successfully!');
      setUploadModalOpen(false);
      setFile(null);
      setCaption('');
      loadGallery();
    } catch (err: any) {
      alert(err.data?.error || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#2C3960]/60 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Camera className="w-8 h-8 text-emerald-400" />
            FELLOWSHIP &amp; MATCH GALLERY
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Capturing memories, match action, prayers, and fellowship in Christ
          </p>
        </div>

        {user && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Share Match Photo
          </button>
        )}
      </div>

      {/* Albums & Photos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#1C2541]/40 animate-pulse" />
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="space-y-12">
          {albums.map((album) => (
            <div key={album.id} className="space-y-4">
              <div className="border-b border-[#2C3960]/40 pb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  {album.title}
                </h2>
                {album.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{album.description}</p>
                )}
              </div>

              {album.photos && album.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {album.photos.map((photo: any) => (
                    <div
                      key={photo.id}
                      className="card-gloss rounded-2xl overflow-hidden group relative aspect-square"
                    >
                      <img
                        src={photo.image}
                        alt={photo.caption || 'Match moment'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                        {photo.caption && (
                          <p className="text-xs font-semibold text-white truncate">{photo.caption}</p>
                        )}
                        <p className="text-[10px] text-emerald-400 font-medium">
                          Photo by {photo.uploaded_by_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-gloss p-8 rounded-2xl text-center text-slate-400 text-xs">
                  No photographs uploaded for this album yet.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card-gloss rounded-2xl">
          <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No gallery albums available</h3>
          <p className="text-xs text-slate-400 mt-1">
            Match and tournament photos will be uploaded by fellowship media members.
          </p>
        </div>
      )}

      {/* Upload Photo Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-gloss max-w-md w-full p-6 rounded-3xl border border-[#2C3960] relative">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Share a Tournament Photo</h3>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Album</label>
                <select
                  value={selectedAlbum || ''}
                  onChange={(e) => setSelectedAlbum(Number(e.target.value))}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  required
                >
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Photo File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Caption / Description</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. 2nd Year post-match prayer circle"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
