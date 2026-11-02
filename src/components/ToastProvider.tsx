'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  LogIn,
  BellRing,
  ShieldAlert,
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AlertModalState {
  isOpen: boolean;
  message: string;
  title?: string;
  isAuthPrompt?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showAlert: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showAlert: () => {},
});

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    message: '',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const showAlert = useCallback((message: string, title?: string) => {
    const isAuthPrompt =
      message.toLowerCase().includes('log in') ||
      message.toLowerCase().includes('create an account') ||
      message.toLowerCase().includes('login');

    setAlertModal({
      isOpen: true,
      message,
      title: title || (isAuthPrompt ? 'Account Required' : 'Focus Football Cup'),
      isAuthPrompt,
    });
  }, []);

  // Globally override window.alert so the browser header "aastufocuscup.netlify.app says" NEVER appears!
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalAlert = window.alert;

    (window as any).showFocusToast = showToast;
    (window as any).showFocusAlert = showAlert;

    window.alert = (msg: any) => {
      showAlert(String(msg));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert, showToast]);

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, showAlert }}>
      {children}

      {/* Floating Toast Notification Stack (Top Center) */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => {
          let bgColor = 'bg-slate-900/95 border-slate-700 text-slate-100';
          let Icon = Info;
          let iconColor = 'text-blue-400';

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-950/95 border-rose-500/50 text-rose-100';
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-950/95 border-amber-500/50 text-amber-100';
            Icon = ShieldAlert;
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 w-full ${bgColor}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className="text-xs font-semibold leading-relaxed flex-1">{toast.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Branded In-App Modal Dialog (Completely removes "aastufocuscup.netlify.app says") */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeAlert}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 border border-emerald-500/40 bg-[#0E162E] text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top decorative gradient glow */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white p-1 border border-emerald-400 shadow-md shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Focus Football Cup"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-white truncate tracking-tight">
                  {alertModal.title}
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <BellRing className="w-3 h-3" />
                  <span>AASTU Focus Cup Fellowship</span>
                </p>
              </div>
              <button
                onClick={closeAlert}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Clean message without browser headers */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-[#2C3960]/80">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {alertModal.message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              {alertModal.isAuthPrompt ? (
                <>
                  <Link
                    href="/login"
                    onClick={closeAlert}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In Now</span>
                  </Link>
                  <button
                    onClick={closeAlert}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    OK
                  </button>
                </>
              ) : (
                <button
                  onClick={closeAlert}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
