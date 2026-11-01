'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Mail, Phone, Heart } from 'lucide-react';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.535-.194 1.006.128.832.92z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98v7.62c-.03 2.05-.72 4.1-2.07 5.66-1.78 2.08-4.52 3.07-7.23 2.72-2.78-.36-5.24-2.24-6.3-4.83-1.07-2.61-.67-5.74 1.03-7.95 1.58-2.05 4.18-3.13 6.74-2.81.01 1.45.01 2.89.01 4.34-1.34-.23-2.77.16-3.7 1.05-.98.94-1.32 2.39-1.02 3.69.29 1.25 1.32 2.27 2.59 2.52 1.32.26 2.74-.23 3.51-1.32.48-.68.68-1.53.67-2.37V.02h-1.66z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function Footer() {
  const [settings, setSettings] = useState<any>({
    site_title: 'AASTU Focus Fellowship – Focus Football Cup',
    tagline: 'Winning is a bonus; friendship, joy, and fellowship come first!',
    about_fellowship:
      'Focus Fellowship at Addis Ababa Science and Technology University (AASTU) is a Christ-centered university student community dedicated to spiritual growth, academic excellence, brotherly fellowship, and building lasting memories across academic batches.',
    verse_text: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!',
    verse_reference: 'Psalm 133:1',
    facebook_url: 'https://web.facebook.com/fstufocus',
    telegram_url: 'https://t.me/fstufocus',
    tiktok_url: 'https://www.tiktok.com/@aastu_focus?lang=en',
    instagram_url: 'https://www.instagram.com/aastufocus/',
    youtube_url: 'https://www.youtube.com/@aastufocusofficial9025',
    contact_email: 'contact@aastufocus.org',
    contact_phone: '+25191 784 1282',
  });

  useEffect(() => {
    api.settings.get()
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#070D1E] border-t border-[#2C3960] text-slate-300 pt-16 pb-24 md:pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Vision */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20 overflow-hidden shrink-0">
                <Image
                  src="/logo.png"
                  alt="AASTU Focus Fellowship Logo"
                  width={38}
                  height={38}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">
                FOCUS <span className="text-emerald-400">FOOTBALL CUP</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {settings.about_fellowship}
            </p>
            <div className="p-3.5 rounded-xl bg-[#1C2541]/70 border border-emerald-500/20">
              <p className="text-xs italic text-emerald-300 font-medium">
                &ldquo;{settings.verse_text}&rdquo;
              </p>
              <p className="text-[11px] text-amber-400 font-bold mt-1 text-right">
                — {settings.verse_reference}
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Competition Portal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/fixtures" className="hover:text-emerald-400 transition-colors">
                  Fixtures & Match Center
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-emerald-400 transition-colors">
                  Match Results & Scores
                </Link>
              </li>
              <li>
                <Link href="/standings" className="hover:text-emerald-400 transition-colors">
                  Official League Standings
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="hover:text-emerald-400 transition-colors">
                  Top Scorers & Assists
                </Link>
              </li>
              <li>
                <Link href="/statistics" className="hover:text-emerald-400 transition-colors">
                  Tournament Awards
                </Link>
              </li>
            </ul>
          </div>

          {/* Batches & Community */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Academic Batches
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/batches/2ND_YEAR" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 2nd Year Batch
                </Link>
              </li>
              <li>
                <Link href="/batches/3RD_YEAR" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> 3rd Year Batch
                </Link>
              </li>
              <li>
                <Link href="/batches/4TH_YEAR" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> 4th Year Batch
                </Link>
              </li>
              <li>
                <Link href="/batches/5TH_YEAR" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> 5th Year Batch (Engineering)
                </Link>
              </li>
              <li>
                <Link href="/batches/OTHER" className="hover:text-slate-400 transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span> Other Fellowship Members
                </Link>
              </li>
              <li className="pt-2 border-t border-[#2C3960]">
                <Link href="/members" className="hover:text-emerald-400 transition-colors font-medium">
                  Search Member Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Socials & Connect */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Connect in Fellowship
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              &ldquo;{settings.tagline}&rdquo;
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white transition-all text-slate-300 shadow-sm"
                  aria-label="Facebook"
                  title="AASTU Focus on Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {settings.telegram_url && (
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-[#229ED9] hover:border-[#229ED9] hover:text-white transition-all text-slate-300 shadow-sm"
                  aria-label="Telegram"
                  title="AASTU Focus on Telegram"
                >
                  <TelegramIcon className="w-4 h-4" />
                </a>
              )}
              {settings.tiktok_url && (
                <a
                  href={settings.tiktok_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-black hover:border-pink-500 hover:text-pink-400 transition-all text-slate-300 shadow-sm"
                  aria-label="TikTok"
                  title="AASTU Focus on TikTok"
                >
                  <TikTokIcon className="w-4 h-4" />
                </a>
              )}
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-gradient-to-tr hover:from-amber-500 hover:via-pink-500 hover:to-purple-600 hover:text-white transition-all text-slate-300 shadow-sm"
                  aria-label="Instagram"
                  title="AASTU Focus on Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-[#FF0000] hover:border-[#FF0000] hover:text-white transition-all text-slate-300 shadow-sm"
                  aria-label="YouTube"
                  title="AASTU Focus on YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              {settings.contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{settings.contact_email}</span>
                </div>
              )}
              {settings.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{settings.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#2C3960]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            &copy; 2026 AASTU Focus Fellowship. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="/about" className="hover:text-slate-400">
              Fellowship Teams
            </Link>
            <Link href="/admin" className="hover:text-purple-400 font-semibold">
              Frontend &amp; Backend Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
