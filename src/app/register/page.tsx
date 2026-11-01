'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Trophy, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [options, setOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    second_name: '',
    college: 'ENGINEERING',
    department: 'Software Engineering',
    academic_year: '2nd Year',
    fellowship_team: 'No Team',
    gender: 'MALE',
    primary_position: 'Midfielder',
    personal_chant: '',
  });

  useEffect(() => {
    api.members.getOptions()
      .then((opts) => {
        setOptions(opts);
      })
      .catch((err) => console.error(err));
  }, []);

  // When college changes, auto-select first available department and academic year
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      router.push('/');
    } catch (err: any) {
      const errs = err.data || {};
      const firstKey = Object.keys(errs)[0];
      const message = firstKey
        ? Array.isArray(errs[firstKey])
          ? errs[firstKey][0]
          : errs[firstKey]
        : 'Registration failed. Please check your inputs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Compute available departments & years for selected college
  const currentDepartments = options?.departments?.[formData.college] || [];
  const currentYears = options?.academic_years?.[formData.college] || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 min-h-screen">
      <div className="card-gloss p-8 sm:p-10 rounded-3xl border border-[#2C3960] shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 border-2 border-white/30 overflow-hidden">
            <Image
              src="/logo.png"
              alt="AASTU Focus Logo"
              width={56}
              height={56}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Join Focus Fellowship &amp; Football Cup
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Complete your fellowship identity to discover members, follow fellow students, and represent your academic batch.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Account Credentials */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#2C3960] pb-2">
              1. Account Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. yonatan_k"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. name@aastufocus.org"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  placeholder="Re-enter password"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. Personal & Fellowship Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#2C3960] pb-2">
              2. Fellowship Member Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. Yonatan"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Second Name</label>
                <input
                  type="text"
                  value={formData.second_name}
                  onChange={(e) => setFormData({ ...formData, second_name: e.target.value })}
                  placeholder="e.g. Kassahun"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Fellowship Team</label>
                <select
                  value={formData.fellowship_team}
                  onChange={(e) => setFormData({ ...formData, fellowship_team: e.target.value })}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  {options?.fellowship_teams?.map((t: any) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Academic College & Department (Dynamic) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#2C3960] pb-2">
              3. Academic Affiliation &amp; Batch Eligibility
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">AASTU College</label>
                <select
                  value={formData.college}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="ENGINEERING">College of Engineering (5-Year Program)</option>
                  <option value="APPLIED_SCIENCES">College of Applied Sciences (4-Year Program)</option>
                  <option value="OTHER">Other Fellowship Category</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {currentDepartments.map((d: any) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Academic Year</label>
                  <select
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {currentYears.map((y: any) => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Eligibility Indicator */}
              <div className="p-3.5 rounded-xl bg-[#161D36] border border-emerald-500/20 text-xs">
                {formData.academic_year === '1st Year' ? (
                  <p className="text-amber-400">
                    &bull; <strong>1st Year Members:</strong> You are registering as a community fellowship member to focus on your 1st-year academic foundation. You will not be included on competition match rosters.
                  </p>
                ) : formData.college === 'APPLIED_SCIENCES' && formData.academic_year === '5th Year' ? (
                  <p className="text-rose-400">
                    &bull; Applied Sciences does not have a 5th academic year.
                  </p>
                ) : formData.academic_year === 'Other' || formData.college === 'OTHER' ? (
                  <p className="text-slate-300">
                    &bull; Community-only profile for fellowship friends and alumni.
                  </p>
                ) : (
                  <p className="text-emerald-400">
                    &bull; <strong>Eligible for Football:</strong> You will be qualified for the <strong>{formData.academic_year} Batch</strong> squad roster!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. Football Identity (Optional) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-[#2C3960] pb-2">
              4. Football Identity &amp; Personal Motto (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">Personal Faith or Sports Chant</label>
                <input
                  type="text"
                  value={formData.personal_chant}
                  onChange={(e) => setFormData({ ...formData, personal_chant: e.target.value })}
                  placeholder="e.g. Jesus Is My Savior, Christ Above All"
                  className="w-full bg-[#161D36] border border-[#2C3960] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Member Account...' : 'Complete Fellowship Registration'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#2C3960]/60 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
