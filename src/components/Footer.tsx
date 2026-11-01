'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Trophy, Send, Mail, Phone, Heart } from 'lucide-react';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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
    telegram_url: 'https://t.me/AASTUFocusFellowship',
    facebook_url: 'https://facebook.com/AASTUFocusFellowship',
    youtube_url: 'https://youtube.com/@AASTUFocusFellowship',
    instagram_url: '',
    contact_email: 'contact@aastufocus.org',
    contact_phone: '+251 900 000 000',
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Trophy className="w-5 h-5 text-white" />
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
            <div className="flex items-center space-x-3 mb-6">
              {settings.telegram_url && (
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all text-slate-300"
                  aria-label="Telegram"
                >
                  <Send className="w-4 h-4" />
                </a>
              )}
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all text-slate-300"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#1C2541] border border-[#2C3960] flex items-center justify-center hover:bg-emerald-500 hover:text-slate-950 transition-all text-slate-300"
                  aria-label="YouTube"
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
            <Link href="/manager/login" className="hover:text-purple-400">
              Manager Administration
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
