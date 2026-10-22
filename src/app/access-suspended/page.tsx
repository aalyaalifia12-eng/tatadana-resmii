'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { clearClientUserId } from '@/lib/auth/session';

export default function AccessSuspendedPage() {
  const router = useRouter();

  const handleBackToLogin = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientUserId();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-orange-600" />

        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>

        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Akun Dinonaktifkan
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Akses Ditangguhkan
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Akun Anda telah dinonaktifkan sementara oleh administrator sistem. Akses ke seluruh fitur dashboard dan pencatatan telah dicabut.
        </p>

        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 mb-6">
          <p className="font-bold mb-1">Status Keamanan:</p>
          <p className="text-amber-800">
            Penangguhan ini ditegakkan di sisi database dan backend. Silakan hubungi bagian kepatuhan jika Anda merasa ini merupakan kekeliruan.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:admin@tatadana.id?subject=Permohonan%20Reaktivasi%20Akun%20TataDana"
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Hubungi Bantuan / Administrator</span>
          </a>

          <button
            onClick={handleBackToLogin}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Keluar & Kembali ke Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
