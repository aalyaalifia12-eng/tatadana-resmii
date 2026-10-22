'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, Mail, LogOut } from 'lucide-react';
import { clearClientUserId } from '@/lib/auth/session';

export default function AccessRejectedPage() {
  const router = useRouter();

  const handleBackToLogin = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientUserId();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-rose-600" />

        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>

        <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          Akses Ditolak
        </span>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Permintaan Akun Ditolak
        </h1>

        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Maaf, permintaan pendaftaran akses akun Anda ke aplikasi TataDana tidak disetujui oleh administrator.
        </p>

        <div className="p-4 bg-red-50/70 border border-red-200/60 rounded-2xl text-left text-xs text-red-800 mb-6">
          <p className="font-bold mb-1">Keterangan / Alasan:</p>
          <p className="text-red-700">
            Data registrasi belum memenuhi persyaratan verifikasi identitas finansial TataDana.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:admin@tatadana.id?subject=Banding%20Permintaan%20Akun%20TataDana"
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Hubungi Administrator</span>
          </a>

          <button
            onClick={handleBackToLogin}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Halaman Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
