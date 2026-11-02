'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  Trophy,
  Calendar,
  Award,
  Users,
  UserCog,
  LayoutDashboard,
  Image as ImageIcon,
  Info,
  Menu,
  X,
  User as UserIcon,
  Bell,
  LogOut,
  ChevronDown,
  Lock,
  Smartphone,
  Download,
} from 'lucide-react';
import { Suspense } from 'react';

function NavbarContent() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Hide the public navigation bar entirely on the dedicated admin command center
  if (pathname === '/admin' || pathname?.startsWith('/admin/')) {
    return null;
  }

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
    <>
      <header className="sticky top-0 z-50 bg-[#0B132B]/90 backdrop-blur-md border-b border-[#2C3960]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-white/20 group-hover:scale-105 group-hover:border-emerald-400/50 transition-all overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="AASTU Focus Fellowship Logo"
                width={38}
                height={38}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="font-black text-white text-xs sm:text-sm md:text-base tracking-tight whitespace-nowrap leading-none flex items-center gap-1 sm:gap-1.5">
                <span>FOCUS</span>
                <span className="text-emerald-400">FOOTBALL CUP</span>
              </div>
              <span className="block text-[8px] sm:text-[10px] text-slate-400 uppercase tracking-wider sm:tracking-widest font-semibold whitespace-nowrap leading-none mt-1 truncate">
                AASTU Focus Cup Fellowship
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
            {/* Install App Button */}
            <button
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  const prompt = (window as any).__focusCupDeferredPrompt;
                  if (prompt) {
                    try {
                      await prompt.prompt();
                      const choice = await prompt.userChoice;
                      if (choice.outcome === 'accepted') {
                        (window as any).__focusCupDeferredPrompt = null;
                      }
                      return;
                    } catch (e) {
                      console.warn(e);
                    }
                  }
                  window.dispatchEvent(new Event('trigger-pwa-install'));
                }
              }}
              className="px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Install Focus Cup on your device"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>App</span>
            </button>
            {mounted && user?.is_manager && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                Admin
              </Link>
            )}

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
                      <UserCog className="w-4 h-4 mr-2.5 text-slate-400" />
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
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs text-purple-300 hover:bg-purple-500/10 border-t border-[#2C3960]/60 font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2.5 text-purple-400" />
                        Admin Command Center
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full text-left flex items-center px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 border-t border-[#2C3960]/60 mt-1 cursor-pointer"
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
            {mounted && user && (
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
        <div className="md:hidden bg-[#0B132B] border-b border-[#2C3960] px-4 pt-3 pb-6 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-xl bg-[#1C2541]/80 border border-[#2C3960]">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <Image
                src="/logo.png"
                alt="AASTU Focus Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white leading-none whitespace-nowrap truncate">AASTU Focus Cup Fellowship</p>
              <p className="text-[10px] text-emerald-400 font-semibold tracking-wide mt-1 leading-none whitespace-nowrap">Focus Football Cup</p>
            </div>
          </div>

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

          {/* Install Mobile App Trigger in Mobile Menu */}
          <button
            onClick={async () => {
              setMobileMenuOpen(false);
              if (typeof window !== 'undefined') {
                const prompt = (window as any).__focusCupDeferredPrompt;
                if (prompt) {
                  try {
                    await prompt.prompt();
                    const choice = await prompt.userChoice;
                    if (choice.outcome === 'accepted') {
                      (window as any).__focusCupDeferredPrompt = null;
                    }
                    return;
                  } catch (e) {
                    console.warn(e);
                  }
                }
                window.dispatchEvent(new Event('trigger-pwa-install'));
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-bold text-left cursor-pointer transition-all hover:bg-emerald-500/25 mt-2"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Install Mobile App</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
              INSTALL
            </span>
          </button>

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
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-purple-400 font-bold"
                  >
                    Admin Command Center
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-rose-400 font-semibold cursor-pointer"
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

    {/* Sign Out Confirmation Modal - Rendered outside header to center perfectly in viewport */}
    {showLogoutConfirm && (
      <div
        className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={() => setShowLogoutConfirm(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="card-gloss max-w-sm w-full p-6 sm:p-7 rounded-3xl border border-rose-500/30 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200 m-auto"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-white">Sign Out Confirmation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to log out? Any unsaved edits will be lost, and you will need to sign back in with your credentials.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLogoutConfirm(false);
                logout();
              }}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Yes, Sign Out
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<div className="h-16 bg-[#0B132B] border-b border-[#2C3960]/60" />}>
      <NavbarContent />
    </Suspense>
  );
}
