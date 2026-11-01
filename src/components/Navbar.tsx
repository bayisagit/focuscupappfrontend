'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Trophy,
  Calendar,
  Award,
  Users,
  Shield,
  Image as ImageIcon,
  Info,
  Menu,
  X,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { Suspense } from 'react';

function NavbarContent() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      api.community.getNotifications()
        .then((res) => setUnreadNotifs(res.unread_count || 0))
        .catch(() => {});
    }
  }, [user, pathname]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Fixtures', href: '/fixtures' },
    { label: 'Results', href: '/results' },
    { label: 'Standings', href: '/standings' },
    { label: 'Batches', href: '/batches' },
    { label: 'Members', href: '/members' },
    { label: 'Statistics', href: '/statistics' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#2C3960]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                FOCUS <span className="text-emerald-400">FOOTBALL CUP</span>
              </span>
              <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium">
                AASTU Focus Fellowship
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Auth Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-full bg-[#1C2541] border border-[#2C3960] hover:border-emerald-500/50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-700/50 flex items-center justify-center overflow-hidden border border-emerald-400/30">
                    {user.profile?.profile_picture ? (
                      <img src={user.profile.profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-emerald-300" />
                    )}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-white leading-tight truncate max-w-[110px]">
                      {user.profile?.first_name || user.username}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {user.is_manager ? 'Manager' : (user.profile?.batch || 'Member')}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#1C2541] border border-[#2C3960] shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#2C3960]/60">
                      <p className="text-xs font-bold text-white truncate">{user.profile?.full_name || user.username}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      href={`/members/${user.username}`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <UserIcon className="w-4 h-4 mr-2.5 text-slate-400" />
                      View My Profile
                    </Link>

                    <Link
                      href="/profile/edit"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                      <Shield className="w-4 h-4 mr-2.5 text-slate-400" />
                      Edit Profile & Jersey
                    </Link>

                    {user.profile?.is_football_eligible && (
                      <Link
                        href="/player-registration"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs text-amber-300 hover:bg-amber-500/10"
                      >
                        <Trophy className="w-4 h-4 mr-2.5 text-amber-400" />
                        Tournament Squad Roster
                      </Link>
                    )}

                    {user.is_manager && (
                      <Link
                        href="/manager/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs text-purple-300 hover:bg-purple-500/10 border-t border-[#2C3960]/60"
                      >
                        <Lock className="w-4 h-4 mr-2.5 text-purple-400" />
                        Manager Portal
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left flex items-center px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 border-t border-[#2C3960]/60 mt-1"
                    >
                      <LogOut className="w-4 h-4 mr-2.5 text-rose-400" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  Join Fellowship
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <Link
                href={`/members/${user.username}`}
                className="w-8 h-8 rounded-full bg-emerald-700/50 flex items-center justify-center border border-emerald-400/30"
              >
                {user.profile?.profile_picture ? (
                  <img src={user.profile.profile_picture} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-300" />
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B132B] border-b border-[#2C3960] px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#2C3960] space-y-2">
            {mounted && user ? (
              <>
                <Link
                  href="/profile/edit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-slate-300 hover:text-white"
                >
                  Edit Profile & Jersey
                </Link>
                {user.is_manager && (
                  <Link
                    href="/manager/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-purple-400 font-semibold"
                  >
                    Manager Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-rose-400 font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-slate-800 text-sm font-semibold text-white"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-emerald-500 text-sm font-bold text-slate-950"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#0B132B] border-b border-[#2C3960]/60" />}>
      <NavbarContent />
    </Suspense>
  );
}
