'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Bot,
  Bell,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
  CreditCard,
  Plus,
} from 'lucide-react';
import { db, Profile, Category } from '@/lib/data/storage';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminder' | 'categories'>('telegram');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [currency, setCurrency] = useState('IDR');

  // Telegram Form
  const [botToken, setBotToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  const [connectionMsg, setConnectionMsg] = useState('');

  // Reminder Form
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFreq, setReminderFreq] = useState<1 | 2>(1);
  const [time1, setTime1] = useState('20:00');
  const [time2, setTime2] = useState('08:00');

  // Custom Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍔');

  // Upgrade Modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'midtrans' | 'manual'>('midtrans');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const p = db.getProfile('usr_tatadana_demo_01');
    if (p) {
      setProfile(p);
      setFullName(p.full_name);
      setCurrency(p.default_currency);
      setBotToken(p.telegram_bot_token || '');
      setConnectionStatus(p.telegram_connected ? 'connected' : 'disconnected');
      setReminderEnabled(p.reminder_enabled);
      setReminderFreq(p.reminder_frequency as 1 | 2);
      if (p.reminder_times?.[0]) setTime1(p.reminder_times[0]);
      if (p.reminder_times?.[1]) setTime2(p.reminder_times[1]);
    }
    setCategories(db.getCategories('usr_tatadana_demo_01'));
  };

  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      alert('Masukkan token bot terlebih dahulu.');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');
    setConnectionMsg('');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken.trim(),
          userId: profile?.id,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setConnectionStatus('connected');
        setConnectionMsg(`Berhasil terhubung ke @${data.bot?.username}! Webhook webhookBaseURL telah diaktifkan.`);
        loadSettings();
      } else {
        setConnectionStatus('disconnected');
        setConnectionMsg(data.error || 'Gagal menghubungi Telegram API.');
      }
    } catch (e: any) {
      setConnectionStatus('disconnected');
      setConnectionMsg(e.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      db.updateProfile(profile.id, { full_name: fullName, default_currency: currency });
      alert('Pengaturan profil berhasil disimpan.');
      loadSettings();
    }
  };

  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (profile) {
      const times = reminderFreq === 2 ? [time1, time2] : [time1];
      db.updateProfile(profile.id, {
        reminder_enabled: reminderEnabled,
        reminder_frequency: reminderFreq,
        reminder_times: times,
      });
      alert('Pengaturan reminder berhasil diperbarui.');
      loadSettings();
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    db.createCategory({
      user_id: profile?.id,
      name: newCatName,
      type: 'expense',
      emoji: newCatEmoji,
      color: '#F97316',
      monthly_budget: 500000,
      is_system: false,
    });

    setNewCatName('');
    loadSettings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">⚙️ Pengaturan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi profil akun, bot Telegram, jadwal pengingat, dan kategori anggaran
          </p>
        </div>

        {profile?.plan === 'starter' && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade ke Pro (Rp99.000)</span>
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
        {[
          { id: 'telegram', label: 'Telegram Bot', icon: Bot },
          { id: 'reminder', label: 'Reminder Harian', icon: Bell },
          { id: 'categories', label: 'Kelola Kategori', icon: Tag },
          { id: 'profile', label: 'Profil Saya', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: TELEGRAM BOT (PART 5 TEKNIS DETAIL) */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="card-premium p-6 rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Status Koneksi Telegram Bot</h3>
                <p className="text-xs text-slate-500">Menerima chat dan foto struk via webhook realtime</p>
              </div>

              {connectionStatus === 'connected' ? (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>🟢 Terhubung</span>
                </span>
              ) : connectionStatus === 'testing' ? (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>⏳ Testing...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>🔴 Tidak Terhubung</span>
                </span>
              )}
            </div>

            {/* Inline Step-by-Step Guide from @BotFather */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6">
              <h4 className="text-xs font-extrabold text-slate-800 mb-2 flex items-center space-x-1.5">
                <span>📖 Panduan Buat Token di @BotFather:</span>
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <li>Buka aplikasi Telegram dan cari akun resmi <strong>@BotFather</strong>.</li>
                <li>Ketik <code>/newbot</code> dan ikuti instruksi memberi nama bot keuanganmu.</li>
                <li>Salin token HTTP API yang diberikan (format: <code>123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ</code>).</li>
                <li>Tempel token di kolom input di bawah, lalu klik <strong>&quot;Test Koneksi&quot;</strong>.</li>
              </ol>
            </div>

            {/* Input & Test Connection Form */}
            <div className="space-y-4 max-w-xl text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Telegram Bot Token
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    className="flex-1 px-4 py-2.5 font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all whitespace-nowrap"
                  >
                    {isTesting ? '⏳ Testing...' : 'Test Koneksi'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem otomatis mendaftarkan webhook URL ke Telegram saat token diuji.
                </p>
              </div>

              {connectionMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {connectionMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: REMINDER HARIAN (PART 4.8) */}
      {activeTab === 'reminder' && (
        <div className="card-premium p-6 rounded-2xl max-w-xl text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm mb-1">Pengingat Keuangan Harian</h3>
          <p className="text-slate-500 mb-6">
            Kirimkan notifikasi ramah ke Telegram agar kamu tidak lupa mencatat pengeluaran (Maks 2x/hari).
          </p>

          <form onSubmit={handleSaveReminder} className="space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Aktifkan Pengingat Harian</p>
                <p className="text-[11px] text-slate-400">Pesan dikirim langsung via chat bot Telegram</p>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-orange-500 rounded"
              />
            </div>

            {/* Frequency (1x or 2x) */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Frekuensi Pengingat
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderFreq(1)}
                  className={`py-2.5 rounded-xl font-bold border transition-all ${
                    reminderFreq === 1
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  1x Sehari (Malam)
                </button>
                <button
                  type="button"
                  onClick={() => setReminderFreq(2)}
                  className={`py-2.5 rounded-xl font-bold border transition-all ${
                    reminderFreq === 2
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  2x Sehari (Pagi & Malam)
                </button>
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Jam Pengingat 1 (WIB)
                </label>
                <input
                  type="time"
                  value={time1}
                  onChange={(e) => setTime1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              {reminderFreq === 2 && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jam Pengingat 2 (WIB)
                  </label>
                  <input
                    type="time"
                    value={time2}
                    onChange={(e) => setTime2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Preview Pesan Reminder */}
            <div className="bg-[#17212B] text-white p-4 rounded-xl border border-slate-700 font-mono text-[11px]">
              <p className="text-orange-400 font-bold mb-1">Preview Pesan di Telegram:</p>
              <p className="text-slate-200 leading-relaxed">
                ⏰ Reminder Keuangan!<br />
                Jangan lupa catat pengeluaran hari ini ya 📝<br />
                Pencatatan rutin = keuangan lebih terkontrol 💪<br />
                Ketik transaksimu sekarang!
              </p>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
            >
              Simpan Pengaturan Reminder
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: KELOLA KATEGORI */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="card-premium p-6 rounded-2xl max-w-xl text-xs">
            <h3 className="font-extrabold text-slate-900 text-sm mb-4">Tambah Kategori Custom</h3>
            <form onSubmit={handleAddCategory} className="flex items-center space-x-2">
              <input
                type="text"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                maxLength={2}
                className="w-12 text-center text-lg py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru (contoh: Kucing & Pet)"
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                Tambah
              </button>
            </form>
          </div>

          <div className="card-premium p-6 rounded-2xl">
            <h3 className="font-extrabold text-slate-900 text-sm mb-4">Daftar Kategori Aktif</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {categories.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2">
                  <span className="text-xl">{c.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{c.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFIL SAYA */}
      {activeTab === 'profile' && (
        <div className="card-premium p-6 rounded-2xl max-w-xl text-xs">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4">Profil & Preferensi</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor HP Terverifikasi
              </label>
              <input
                type="text"
                value={profile?.phone_number || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Kunci verifikasi autentikasi Telegram Bot.</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mata Uang Default
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                <option value="USD">USD — US Dollar ($)</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
            >
              Simpan Profil
            </button>
          </form>
        </div>
      )}

      {/* UPGRADE MODAL TO PRO (PART 6) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-xs">
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-[10px] uppercase">
              Upgrade Akun
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-2">TataDana Pro Lifetime</h3>
            <p className="text-slate-500 mt-1">
              Hanya <strong>Rp99.000 Sekali Bayar</strong> untuk akses penuh selamanya tanpa biaya bulanan.
            </p>

            <div className="my-5 p-3.5 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <span>Unlimited transaksi, dompet & kategori</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <span>Input via foto struk AI Vision OCR</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-orange-500" />
                <span>AI Financial Advisor & Export PDF/Excel</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 mb-6">
              <label className="block font-bold text-slate-700 uppercase tracking-wider">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('midtrans')}
                  className={`p-3 rounded-xl border text-left font-bold ${
                    paymentMethod === 'midtrans'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <p>Midtrans (Otomatis)</p>
                  <p className="text-[10px] text-slate-400 font-normal">QRIS, GoPay, VA BCA/Mandiri</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('manual')}
                  className={`p-3 rounded-xl border text-left font-bold ${
                    paymentMethod === 'manual'
                      ? 'border-orange-500 bg-orange-50/50 text-orange-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <p>Transfer Manual</p>
                  <p className="text-[10px] text-slate-400 font-normal">Verifikasi oleh Admin</p>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (profile) {
                    db.updateProfile(profile.id, { plan: 'pro' });
                    alert('Pembayaran sukses diverifikasi! Akun Anda kini aktif sebagai TataDana Pro.');
                    setShowUpgradeModal(false);
                    loadSettings();
                  }
                }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
              >
                Bayar Rp99.000
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
