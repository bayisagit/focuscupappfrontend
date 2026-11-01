'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Heart,
  Users,
  Shield,
  BookOpen,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  const engineeringDepartments = [
    'Software Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Electromechanical Engineering',
    'Civil Engineering',
    'Environmental Engineering',
    'Chemical Engineering',
    'Mining Engineering',
    'Architecture',
  ];

  const appliedSciencesDepartments = [
    'Food Science',
    'Biotechnology',
    'Geology',
    'Industrial Engineering',
  ];

  const fellowshipTeams = [
    { name: 'Ebenim', desc: 'Merged voluntary benevolence, poor and needy relief, member practical support & counsel, financial stewardship, fellowship collections, and hospitality seating.' },
    { name: 'BS Team', desc: 'Bible Study facilitation and freshman coordinating & discipleship.' },
    { name: 'Lady', desc: 'Creative arts ministry, drama, and artistic expression to serve God and minister to the fellowship.' },
    { name: 'Elios', desc: 'Song and choir ministry, leading the fellowship in deep worship and praise.' },
    { name: 'Media', desc: 'Photography, tournament digital coverage, graphics, audio engineering, photo editing, and stage instrument management.' },
    { name: 'Action and Prayer', desc: 'Missionary outreach, prayer ministry, intercession, and multifaceted fellowship service roles.' },
    { name: 'No Team', desc: 'General fellowship members not currently active in a specific ministry team.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
        <div className="w-20 h-20 rounded-3xl bg-white p-2 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 border-2 border-emerald-400/40 overflow-hidden mb-4">
          <Image
            src="/logo.png"
            alt="AASTU Focus Fellowship Official Logo"
            width={72}
            height={72}
            priority
            className="w-full h-full object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> AASTU Focus Fellowship Community
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          ONE FAMILY IN CHRIST, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">
            STRIVING FOR HIS GLORY
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
          Addis Ababa Science and Technology University (AASTU) Focus Fellowship is a university Christian family dedicated to spiritual nurture, academic brilliance, authentic friendship, and loving unity across all student years.
        </p>

        <div className="p-4 rounded-2xl bg-[#1C2541]/90 border border-emerald-500/30 shadow-xl inline-block mt-4">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            Tournament Foundation Ethos
          </p>
          <p className="text-base font-extrabold text-white italic">
            &ldquo;Winning is a bonus; friendship, joy, and fellowship come first!&rdquo;
          </p>
        </div>
      </div>

      {/* Campus Academic Colleges */}
      <div className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          AASTU ACADEMIC COLLEGES &amp; DEPARTMENTS
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          Our fellowship members represent every engineering and applied science department across the campus.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Engineering */}
          <div className="card-gloss p-6 rounded-3xl border-t-4 border-emerald-500 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">College of Engineering</h3>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400">
                5 Academic Years
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Engineering students study for five full academic years. 5th-year engineering members are officially eligible for the 5th Year Batch tournament squad!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {engineeringDepartments.map((dept, i) => (
                <div key={dept} className="flex items-center gap-2 text-xs text-slate-200 bg-[#161D36] p-2.5 rounded-xl border border-[#2C3960]/50">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span className="truncate">{dept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Applied Sciences */}
          <div className="card-gloss p-6 rounded-3xl border-t-4 border-blue-500 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">College of Applied Sciences</h3>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-500/20 text-blue-400">
                4 Academic Years
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Applied Sciences students study for four academic years. Applied Sciences students are eligible up to their graduating 4th Year.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {appliedSciencesDepartments.map((dept, i) => (
                <div key={dept} className="flex items-center gap-2 text-xs text-slate-200 bg-[#161D36] p-2.5 rounded-xl border border-[#2C3960]/50">
                  <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span className="truncate">{dept}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-[#2C3960] text-xs text-slate-400 leading-relaxed mt-4">
              <strong>1st Year Guidance:</strong> First-year fellowship members focus wholeheartedly on their fundamental campus studies and departmental placement, and are community members cheering in love.
            </div>
          </div>
        </div>
      </div>

      {/* Fellowship Ministry Teams */}
      <div className="mb-16">
        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-400" />
          FELLOWSHIP MINISTRY TEAMS
        </h2>
        <p className="text-xs text-slate-400 mb-8">
          The fellowship ministry teams and service roles through which our members serve the Lord and the university body
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {fellowshipTeams.map((team) => (
            <div key={team.name} className="card-gloss p-5 rounded-2xl space-y-2 border-emerald-500/20 hover:border-emerald-500/50 transition-all">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                {team.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {team.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="card-gloss p-8 sm:p-12 rounded-3xl text-center space-y-4 border border-emerald-500/30 bg-gradient-to-b from-[#1C2541] to-[#0B132B]">
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Join the AASTU Focus Fellowship Community
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Create your fellowship member profile today, discover members in your department and batch, and share your personal Christian motto.
        </p>
        <div className="pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
          >
            Create Your Member Profile <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
