'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, Star, CreditCard, Smartphone, Banknote, AlertCircle, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { getClientUserId } from '@/lib/auth/session';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'bank' | 'ewallet' | 'cash'>('bank');
  const [initialBalance, setInitialBalance] = useState('0');

  const loadWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getClientUserId();
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();
      if (data.ok) {
        setWallets(data.wallets || []);
      } else {
        setError(data.error || 'Gagal memuat dompet');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat dompet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true }),
      });
      if (res.ok) loadWallets();
    } catch (err) {
      alert('Gagal menyetel default');
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName) return;

    try {
      const userId = getClientUserId();
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: walletName,
          type: walletType,
          balance: Number(initialBalance) || 0,
          initial_balance: Number(initialBalance) || 0,
          is_default: wallets.length === 0,
          color: walletType === 'bank' ? '#0066AE' : walletType === 'ewallet' ? '#00AED6' : '#10B981',
          icon: walletType === 'bank' ? 'CreditCard' : walletType === 'ewallet' ? 'Smartphone' : 'Banknote',
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setWalletName('');
        setInitialBalance('0');
        loadWallets();
      }
    } catch (err) {
      alert('Gagal membuat dompet baru');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">👛 Multi Dompet</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola saldo bank, e-wallet, dan tunai. Set 1 dompet default untuk transaksi cepat via Telegram Bot.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/transfer"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4 text-orange-500" />
            <span>Transfer QRIS / DANA / OVO</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Dompet Baru</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-2xl"></div>
          <div className="h-44 bg-slate-200 rounded-2xl"></div>
        </div>
      )}

      {!loading && error && (
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            onClick={loadWallets}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wallets.map((w) => (
            <div
              key={w.id}
              className={`card-premium p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden ${
                w.is_default ? 'border-2 border-orange-500 shadow-orange-500/10' : ''
              }`}
            >
              {w.is_default && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span>Default Telegram</span>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.type === 'bank' ? (
                      <CreditCard className="w-5 h-5" />
                    ) : w.type === 'ewallet' ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Banknote className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{w.name}</h3>
                    <p className="text-[11px] text-slate-400 capitalize">{w.type}</p>
                  </div>
                </div>

                <div className="my-4">
                  <p className="text-xs text-slate-400 font-medium">Saldo Saat Ini</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatRupiah(w.balance || 0)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {w.is_default ? (
                  <span className="text-xs font-bold text-orange-600 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-orange-500" />
                    <span>Dipakai untuk chat Telegram</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors"
                  >
                    Jadikan Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TAMBAH WALLET */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Tambah Dompet Baru</h3>
            <p className="text-xs text-slate-500 mb-4">Buat rekening bank, e-wallet, atau pos uang tunai.</p>

            <form onSubmit={handleCreateWallet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Dompet
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="Contoh: Mandiri / OVO"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Dompet
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                  {(['bank', 'ewallet', 'cash'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWalletType(t)}
                      className={`py-2 rounded-lg font-bold capitalize transition-all ${
                        walletType === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-sm font-semibold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Saldo awal dimulai dari Rp0 jika dompet baru.</p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
