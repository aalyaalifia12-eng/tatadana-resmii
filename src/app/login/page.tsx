'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Lock, Mail } from 'lucide-react';
import { setClientUserId } from '@/lib/auth/session';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('email');
  const [phoneNumber, setPhoneNumber] = useState('081234567890');
  const [email, setEmail] = useState('admin@tatadana.id');
  const [password, setPassword] = useState('admin123');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!phoneNumber) {
      setErrorMsg('Nomor HP tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 400);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (otpCode !== '123456' && otpCode.length < 4) {
        setErrorMsg('Kode OTP salah. Masukkan kode 123456 untuk testing.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'phone',
          phoneNumber,
        }),
      });

      const data = await res.json();
      if (data.ok && data.user) {
        setClientUserId(data.user.id);
        router.push(data.redirect || '/dashboard');
      } else if (data.redirect) {
        if (data.user?.id) setClientUserId(data.user.id);
        router.push(data.redirect);
      } else {
        setErrorMsg(data.error || 'Nomor HP tidak terdaftar atau login gagal.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.ok && data.user) {
        setClientUserId(data.user.id);
        router.push(data.redirect || '/dashboard');
      } else if (data.redirect) {
        // Redirect to pending, rejected, or suspended
        if (data.user?.id) setClientUserId(data.user.id);
        router.push(data.redirect);
      } else {
        setErrorMsg(data.error || 'Email atau kata sandi tidak valid.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.');
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
            Catat setiap rupiah semudah chat di Telegram. Dapatkan insight finansial otomatis tanpa ribet.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 text-sm text-orange-50 bg-white/10 backdrop-blur-sm p-3.5 rounded-2xl border border-white/20">
            <ShieldCheck className="w-5 h-5 text-white flex-shrink-0" />
            <span>Sistem otentikasi aman terintegrasi Supabase Auth & RLS</span>
          </div>
          <p className="text-xs text-orange-200">
            &copy; 2026 PT Tata Data Indonesia &bull; Supabase Security Protocol
          </p>
        </div>
      </div>

      {/* KANAN (60%): Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="lg:hidden flex items-center space-x-2 mb-6">
              <span className="w-8 h-8 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm">TD</span>
              <span className="text-xl font-bold text-slate-900">TataDana</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Masuk ke Akun Anda</h2>
            <p className="text-sm text-slate-500 mt-1">
              Belum punya akun?{' '}
              <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-500">
                Daftar baru di sini
              </Link>
            </p>
          </div>

          {/* Toggle Tab Login Method */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Email & Sandi
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Nomor HP (OTP)
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMethod === 'phone' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nomor WhatsApp / HP
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
                      className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-orange-800">
                  Kode verifikasi OTP terkirim ke <strong>+62{phoneNumber.replace(/^(\+62|0)/, '')}</strong>.
                  <span className="block mt-1 text-[11px] text-orange-600">(Mode Dev: Masukkan kode <strong>123456</strong>)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Kode OTP 6-Digit
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-bold py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 text-center"
                >
                  Ubah Nomor HP
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* Quick Preset Buttons for Testing */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Pilih Akun Demo / Uji Coba:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@tatadana.id');
                      setPassword('admin123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 rounded-lg text-[11px] font-bold"
                  >
                    👑 Superadmin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('user@tatadana.id');
                      setPassword('user123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 rounded-lg text-[11px] font-bold"
                  >
                    👤 User Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('ahmad.pending@example.com');
                      setPassword('pending123');
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200 rounded-lg text-[11px] font-bold"
                  >
                    ⏳ User Pending
                  </button>
                </div>
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
                  Kata Sandi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Memproses...' : 'Masuk Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <Link
              href="/register"
              className="w-full py-2.5 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 flex items-center justify-center space-x-2"
            >
              <span>Belum punya akun? Buat akun baru</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
