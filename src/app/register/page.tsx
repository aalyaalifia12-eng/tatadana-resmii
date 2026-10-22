'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { setClientUserId } from '@/lib/auth/session';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName || !email || !password) {
      setErrorMsg('Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
          plan: 'starter',
        }),
      });

      const data = await res.json();
      if (data.ok && data.user) {
        setClientUserId(data.user.id);
        // STRICT: Redirect to pending-approval page
        router.push(data.redirect || '/pending-approval');
      } else {
        setErrorMsg(data.error || 'Pendaftaran gagal. Silakan coba kembali.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* KIRI (40%): Branding Panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white text-orange-600 font-extrabold flex items-center justify-center text-xl shadow-md">
              TD
            </div>
            <span className="text-2xl font-bold tracking-tight">TataDana</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Keuanganmu.<br />Terkontrol.
          </h1>
          <p className="text-orange-100 text-base leading-relaxed max-w-sm">
            Bergabunglah dengan ribuan orang yang berhasil mengendalikan pengeluaran harian cukup lewat chat Telegram.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 text-sm text-orange-50 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/20">
            <Clock className="w-5 h-5 text-white flex-shrink-0" />
            <span>Sistem registrasi aman dengan verifikasi persetujuan admin</span>
          </div>
          <p className="text-xs text-orange-200">
            &copy; 2026 PT Tata Data Indonesia &bull; Supabase Security & RLS Protocol
          </p>
        </div>
      </div>

      {/* KANAN (60%): Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="lg:hidden flex items-center space-x-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm">TD</span>
              <span className="text-xl font-bold text-slate-900">TataDana</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Daftar Akun Baru</h2>
            <p className="text-sm text-slate-500 mt-1">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500">
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Info Notice about Admin Approval */}
          <div className="mb-6 p-3.5 bg-orange-50/80 rounded-2xl border border-orange-200/70 text-xs text-orange-900 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Catatan Persetujuan:</strong> Akun baru akan berstatus <em>Pending</em> dan diverifikasi oleh admin sebelum Anda dapat mengakses dashboard keuangan.
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Misal: Ahmad Pratama"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nomor WhatsApp / HP (Opsional)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">
                  +62
                </span>
                <input
                  type="tel"
                  value={phoneNumber.replace(/^(\+62|0)/, '')}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="81234567890"
                  className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dipakai untuk menghubungkan bot Telegram TataDana setelah akun disetujui.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar & Ajukan Persetujuan'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-6">
            Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi TataDana.
          </p>
        </div>
      </div>
    </div>
  );
}
