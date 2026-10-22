'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, RefreshCw, LogOut, ShieldAlert, ArrowRight } from 'lucide-react';
import { clearClientUserId } from '@/lib/auth/session';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProfile = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.ok && data.user) {
        setProfile(data.user);
        if (data.user.approval_status === 'approved') {
          if (data.user.role === 'admin' || data.user.role === 'superadmin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
          return;
        } else if (data.user.approval_status === 'rejected') {
          router.push('/access-rejected');
          return;
        } else if (data.user.approval_status === 'suspended') {
          router.push('/access-suspended');
          return;
        }
      } else {
        router.push('/login');
      }
    } catch {
      setMessage('Gagal memperbarui status. Periksa koneksi Anda.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientUserId();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500" />

        {/* Brand Icon */}
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Clock className="w-8 h-8 animate-pulse text-orange-500" />
        </div>

        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Menunggu Verifikasi Admin
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Pendaftaran Berhasil!
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Akun kamu berhasil didaftarkan dan sedang menunggu verifikasi admin. Kamu akan mendapatkan akses setelah akun disetujui.
        </p>

        {/* User Card */}
        {profile && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left mb-6 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-400 font-medium">Nama Akun:</span>
              <span className="font-bold text-slate-800">{profile.full_name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-400 font-medium">Email:</span>
              <span className="font-mono text-slate-800 font-semibold">{profile.email || '-'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-400 font-medium">Nomor HP:</span>
              <span className="font-mono text-slate-800 font-semibold">{profile.phone_number || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Status Akses:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[11px]">
                Pending Approval
              </span>
            </div>
          </div>
        )}

        {message && (
          <p className="text-xs text-red-500 mb-4">{message}</p>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={fetchProfile}
            disabled={checking}
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Memeriksa Persetujuan...' : 'Cek Status Persetujuan'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-6">
          Butuh akses segera? Hubungi administrator internal TataDana di{' '}
          <a href="mailto:admin@tatadana.id" className="text-orange-600 underline font-semibold">
            admin@tatadana.id
          </a>
        </p>
      </div>
    </div>
  );
}
