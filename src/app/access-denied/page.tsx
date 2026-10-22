'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-950 rounded-3xl border border-slate-800 p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />

        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldX className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full mb-3 uppercase tracking-wider border border-red-500/30">
          403 Forbidden
        </span>

        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          Akses Terbatas
        </h1>

        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Anda tidak memiliki izin untuk membuka halaman atau area ini. Halaman control panel hanya dapat diakses oleh administrator terverifikasi.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard Saya</span>
          </button>

          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
