'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Smartphone,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Share2,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Building,
  UserCheck,
  ChevronRight,
  FileText,
  Clock,
  Sparkles,
  Printer,
  X,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatWIBDateTime } from '@/lib/utils/date';
import { getClientUserId } from '@/lib/auth/session';

interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  is_default: boolean;
}

interface TransferReceipt {
  refId: string;
  type: 'QRIS' | 'DANA' | 'OVO';
  service?: string;
  method?: string;
  merchantName?: string;
  nmid?: string;
  accountNumber?: string;
  recipientName?: string;
  amount: number;
  adminFee: number;
  total: number;
  sourceWallet: string;
  destWallet?: string;
  date: string;
  status: string;
}

export default function TransferPage() {
  const [activeTab, setActiveTab] = useState<'qris' | 'dana' | 'ovo' | 'history'>('qris');
  const [qrisSubTab, setQrisSubTab] = useState<'pay' | 'receive'>('pay');

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // QRIS Bayar state
  const [qrisPaySourceWallet, setQrisPaySourceWallet] = useState('');
  const [qrisMerchantName, setQrisMerchantName] = useState('');
  const [qrisPayAmount, setQrisPayAmount] = useState('');
  const [qrisPayNotes, setQrisPayNotes] = useState('');

  // QRIS Terima state
  const [qrisReceiveTargetWallet, setQrisReceiveTargetWallet] = useState('');
  const [qrisReceiveAmount, setQrisReceiveAmount] = useState('');
  const [qrisReceiveNotes, setQrisReceiveNotes] = useState('');
  const [generatedQRIS, setGeneratedQRIS] = useState<any | null>(null);

  // DANA state
  const [danaSourceWallet, setDanaSourceWallet] = useState('');
  const [danaPhone, setDanaPhone] = useState('');
  const [danaRecipient, setDanaRecipient] = useState('');
  const [danaAmount, setDanaAmount] = useState('');
  const [danaNotes, setDanaNotes] = useState('');

  // OVO state
  const [ovoSourceWallet, setOvoSourceWallet] = useState('');
  const [ovoPhone, setOvoPhone] = useState('');
  const [ovoRecipient, setOvoRecipient] = useState('');
  const [ovoAmount, setOvoAmount] = useState('');
  const [ovoNotes, setOvoNotes] = useState('');

  // Modal Struk
  const [activeReceipt, setActiveReceipt] = useState<TransferReceipt | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transfer');
      const data = await res.json();
      if (data.ok) {
        setWallets(data.wallets || []);
        setTransferHistory(data.transferHistory || []);

        if (data.wallets?.length > 0) {
          const defaultW = data.wallets.find((w: Wallet) => w.is_default) || data.wallets[0];
          setQrisPaySourceWallet(defaultW.id);
          setQrisReceiveTargetWallet(defaultW.id);
          setDanaSourceWallet(defaultW.id);
          setOvoSourceWallet(defaultW.id);
        }
      }
    } catch (err: any) {
      console.error('Error loading transfer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Eksekusi Bayar QRIS
  const handlePayQRIS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrisPayAmount || Number(qrisPayAmount) <= 0) {
      showNotification('error', 'Nominal QRIS harus lebih dari Rp0');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qris_pay',
          source_wallet_id: qrisPaySourceWallet,
          amount: Number(qrisPayAmount),
          merchant_name: qrisMerchantName || 'Merchant QRIS Standar',
          notes: qrisPayNotes,
        }),
      });

      const data = await res.json();
      if (data.ok && data.receipt) {
        setActiveReceipt(data.receipt);
        setQrisPayAmount('');
        setQrisMerchantName('');
        setQrisPayNotes('');
        loadData();
        showNotification('success', data.message || 'Pembayaran QRIS Berhasil!');
      } else {
        showNotification('error', data.error || 'Gagal memproses pembayaran QRIS');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memproses QRIS');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Generate QRIS Terima Uang
  const handleGenerateQRIS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qris_generate',
          target_wallet_id: qrisReceiveTargetWallet,
          amount: Number(qrisReceiveAmount) || 0,
          notes: qrisReceiveNotes,
        }),
      });

      const data = await res.json();
      if (data.ok && data.qrisData) {
        setGeneratedQRIS(data.qrisData);
        showNotification('success', 'Kode QRIS berhasil dibuat! Siap dipindai.');
      } else {
        showNotification('error', data.error || 'Gagal membuat QRIS');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal membuat QRIS');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulasi Terima Pembayaran QRIS yang telah digenerate
  const handleSimulateQRISReceive = async () => {
    if (!generatedQRIS) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'qris_simulate_receive',
          target_wallet_id: generatedQRIS.targetWalletId,
          amount: generatedQRIS.amount || 50000,
          notes: generatedQRIS.notes,
          sender_name: 'Nasabah Bank BCA / GoPay',
        }),
      });

      const data = await res.json();
      if (data.ok) {
        loadData();
        showNotification('success', data.message || 'Dana QRIS berhasil diterima!');
        setGeneratedQRIS(null);
      } else {
        showNotification('error', data.error || 'Gagal memproses simulasi');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memproses');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Eksekusi Transfer DANA
  const handleTransferDANA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!danaPhone || !danaRecipient || !danaAmount || Number(danaAmount) <= 0) {
      showNotification('error', 'Lengkapi seluruh data transfer DANA dengan benar');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_dana',
          source_wallet_id: danaSourceWallet,
          phone_number: danaPhone,
          recipient_name: danaRecipient,
          amount: Number(danaAmount),
          notes: danaNotes,
        }),
      });

      const data = await res.json();
      if (data.ok && data.receipt) {
        setActiveReceipt(data.receipt);
        setDanaPhone('');
        setDanaRecipient('');
        setDanaAmount('');
        setDanaNotes('');
        loadData();
        showNotification('success', data.message || 'Transfer DANA Berhasil!');
      } else {
        showNotification('error', data.error || 'Gagal transfer DANA');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memproses transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Eksekusi Transfer OVO
  const handleTransferOVO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ovoPhone || !ovoRecipient || !ovoAmount || Number(ovoAmount) <= 0) {
      showNotification('error', 'Lengkapi seluruh data transfer OVO dengan benar');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer_ovo',
          source_wallet_id: ovoSourceWallet,
          phone_number: ovoPhone,
          recipient_name: ovoRecipient,
          amount: Number(ovoAmount),
          notes: ovoNotes,
        }),
      });

      const data = await res.json();
      if (data.ok && data.receipt) {
        setActiveReceipt(data.receipt);
        setOvoPhone('');
        setOvoRecipient('');
        setOvoAmount('');
        setOvoNotes('');
        loadData();
        showNotification('success', data.message || 'Transfer OVO Berhasil!');
      } else {
        showNotification('error', data.error || 'Gagal transfer OVO');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal memproses transfer');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Setup Dompet DANA / OVO
  const handleQuickSetupEwallet = async (provider: 'DANA' | 'OVO') => {
    try {
      setSubmitting(true);
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'quick_setup_ewallet',
          provider,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        showNotification('success', data.message);
        loadData();
      } else {
        showNotification('error', data.error || 'Gagal menambah dompet');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-md ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Layanan Transfer & Pembayaran
            </h1>
            <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Baru
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kirim saldo instan via <strong>QRIS Standar Nasional</strong>, E-Wallet <strong>DANA</strong>, dan <strong>OVO</strong>.
          </p>
        </div>

        {/* Quick Add E-Wallet Badges */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuickSetupEwallet('DANA')}
            disabled={submitting}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#118EEA]/10 hover:bg-[#118EEA]/20 text-[#118EEA] rounded-xl text-xs font-bold border border-[#118EEA]/30 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>+ Dompet DANA</span>
          </button>
          <button
            onClick={() => handleQuickSetupEwallet('OVO')}
            disabled={submitting}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#4C3494]/10 hover:bg-[#4C3494]/20 text-[#4C3494] rounded-xl text-xs font-bold border border-[#4C3494]/30 transition-all"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>+ Dompet OVO</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('qris')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'qris'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-4 h-4 text-red-600" />
          <span>QRIS Indonesia</span>
        </button>

        <button
          onClick={() => setActiveTab('dana')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'dana'
              ? 'bg-white text-[#118EEA] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4 text-[#118EEA]" />
          <span>Transfer DANA</span>
        </button>

        <button
          onClick={() => setActiveTab('ovo')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'ovo'
              ? 'bg-white text-[#4C3494] shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4 text-[#4C3494]" />
          <span>Transfer OVO</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Riwayat Transfer</span>
        </button>
      </div>

      {/* TAB 1: QRIS INDONESIA */}
      {activeTab === 'qris' && (
        <div className="space-y-6">
          {/* Sub-Tabs: Bayar vs Terima */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setQrisSubTab('pay')}
              className={`pb-3 px-4 border-b-2 transition-all ${
                qrisSubTab === 'pay'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              💳 Bayar / Scan Merchant QRIS
            </button>
            <button
              onClick={() => setQrisSubTab('receive')}
              className={`pb-3 px-4 border-b-2 transition-all ${
                qrisSubTab === 'receive'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              📥 Terima Uang (Buat Kode QRIS)
            </button>
          </div>

          {qrisSubTab === 'pay' ? (
            /* SUB-TAB: BAYAR QRIS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card-premium p-6 rounded-3xl space-y-5">
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-black">
                    QR
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pembayaran QRIS Standar Nasional
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Diterima di seluruh merchant QRIS berlogo GPN di Indonesia.
                    </p>
                  </div>
                </div>

                <form onSubmit={handlePayQRIS} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Sumber Dompet Pembayaran
                    </label>
                    <select
                      value={qrisPaySourceWallet}
                      onChange={(e) => setQrisPaySourceWallet(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — Saldo: {formatRupiah(w.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Merchant / Toko QRIS
                    </label>
                    <input
                      type="text"
                      value={qrisMerchantName}
                      onChange={(e) => setQrisMerchantName(e.target.value)}
                      placeholder="Contoh: Kopi Kenangan / Mie Gacoan / Indomaret"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nominal Pembayaran (Rp)
                    </label>
                    <input
                      type="number"
                      value={qrisPayAmount}
                      onChange={(e) => setQrisPayAmount(e.target.value)}
                      placeholder="Contoh: 35000"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                      required
                    />
                    {/* Shortcut Nominal */}
                    <div className="flex gap-2 mt-2">
                      {[15000, 25000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setQrisPayAmount(amt.toString())}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 rounded-lg text-[11px] font-bold"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Catatan Pembelian (Opsional)
                    </label>
                    <input
                      type="text"
                      value={qrisPayNotes}
                      onChange={(e) => setQrisPayNotes(e.target.value)}
                      placeholder="Contoh: Makan siang + es teh"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-extrabold text-sm shadow-md shadow-red-600/20 flex items-center justify-center space-x-2 transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{submitting ? 'Memproses...' : 'Konfirmasi Bayar QRIS'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* SIDEBAR QRIS INFO */}
              <div className="card-premium p-6 rounded-3xl space-y-4 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">
                      QRIS Interoperable
                    </span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-extrabold mt-3">Satu QRIS untuk Semua Aplikasi</h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    Setiap pembayaran QRIS di TataDana otomatis mengurangi saldo dompet yang Anda pilih dan langsung tercatat di laporan pengeluaran.
                  </p>
                </div>

                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Biaya Admin:</span>
                    <span className="font-bold text-emerald-400">Gratis (Rp0)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Waktu Proses:</span>
                    <span className="font-bold text-white">Realtime Instan</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Status Transaksi:</span>
                    <span className="font-bold text-emerald-400">Terverifikasi</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SUB-TAB: TERIMA QRIS (GENERATE) */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-premium p-6 rounded-3xl space-y-5">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Buat QRIS Terima Uang</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tampilkan QR Code untuk menerima pembayaran dari aplikasi perbankan atau e-wallet mana pun.
                  </p>
                </div>

                <form onSubmit={handleGenerateQRIS} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Dompet Tujuan Penerimaan
                    </label>
                    <select
                      value={qrisReceiveTargetWallet}
                      onChange={(e) => setQrisReceiveTargetWallet(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — Saldo: {formatRupiah(w.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nominal yang Diminta (Rp)
                    </label>
                    <input
                      type="number"
                      value={qrisReceiveAmount}
                      onChange={(e) => setQrisReceiveAmount(e.target.value)}
                      placeholder="Kosongkan jika nominal bebas"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Catatan / Keperluan
                    </label>
                    <input
                      type="text"
                      value={qrisReceiveNotes}
                      onChange={(e) => setQrisReceiveNotes(e.target.value)}
                      placeholder="Contoh: Tagihan patungan makan"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white rounded-xl font-extrabold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{submitting ? 'Membuat QR...' : 'Buat Kode QRIS Dinamis'}</span>
                  </button>
                </form>
              </div>

              {/* PREVIEW KODE QRIS */}
              <div className="card-premium p-6 rounded-3xl flex flex-col items-center justify-center text-center bg-white border border-slate-200 relative overflow-hidden">
                {generatedQRIS ? (
                  <div className="space-y-4 w-full max-w-xs animate-in zoom-in-95 duration-200">
                    {/* Header QRIS Resmi */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-black tracking-widest text-red-600">QRIS</span>
                      <span className="text-[10px] font-bold text-slate-400">GPN &bull; Bank Indonesia</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{generatedQRIS.merchantName}</h4>
                      <p className="text-[10px] text-slate-400">NMID: {generatedQRIS.nmid}</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-inner mx-auto w-48 h-48 flex items-center justify-center relative">
                      <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-xs ${
                              (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                                ? 'bg-slate-950'
                                : (i + 1) % 4 === 0
                                ? 'bg-red-600'
                                : 'bg-slate-200'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-300 flex items-center justify-center shadow-md">
                          <span className="text-[9px] font-black text-red-600">QRIS</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Nominal Ditagihkan</p>
                      <p className="text-base font-black text-slate-900">
                        {generatedQRIS.amount > 0 ? formatRupiah(generatedQRIS.amount) : 'Nominal Fleksibel'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tujuan: {generatedQRIS.targetWalletName}</p>
                    </div>

                    {/* Simulation Button */}
                    <button
                      onClick={handleSimulateQRISReceive}
                      disabled={submitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulasi Pembayaran Berhasil</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-12 space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Belum Ada QRIS Dibuat</h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Isi form di samping untuk membuat kode QRIS penerimaan dana instan yang dapat disimpan dan dicetak.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSFER DANA */}
      {activeTab === 'dana' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-premium p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#118EEA] text-white flex items-center justify-center font-black shadow-md shadow-[#118EEA]/20">
                D
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Transfer ke DANA Dompet Digital
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kirim uang ke akun DANA Indonesia secara instan tanpa biaya admin.
                </p>
              </div>
            </div>

            <form onSubmit={handleTransferDANA} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sumber Dompet Pengirim
                </label>
                <select
                  value={danaSourceWallet}
                  onChange={(e) => setDanaSourceWallet(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#118EEA]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — Saldo: {formatRupiah(w.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor HP DANA Tujuan
                  </label>
                  <input
                    type="tel"
                    value={danaPhone}
                    onChange={(e) => setDanaPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#118EEA]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Penerima DANA
                  </label>
                  <input
                    type="text"
                    value={danaRecipient}
                    onChange={(e) => setDanaRecipient(e.target.value)}
                    placeholder="Contoh: Alya Alifia"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#118EEA]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  value={danaAmount}
                  onChange={(e) => setDanaAmount(e.target.value)}
                  placeholder="Contoh: 50000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#118EEA]"
                  required
                />
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[20000, 50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDanaAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#118EEA]/10 text-slate-700 hover:text-[#118EEA] rounded-lg text-[11px] font-bold transition-all"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Transfer (Opsional)
                </label>
                <input
                  type="text"
                  value={danaNotes}
                  onChange={(e) => setDanaNotes(e.target.value)}
                  placeholder="Contoh: Pengembalian uang makan"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#118EEA]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#118EEA] hover:bg-[#0c78c8] disabled:bg-slate-300 text-white rounded-xl font-extrabold text-sm shadow-md shadow-[#118EEA]/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{submitting ? 'Memproses Transfer...' : 'Kirim Saldo ke DANA'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* DANA SIDEBAR CARD */}
          <div className="card-premium p-6 rounded-3xl space-y-4 flex flex-col justify-between bg-gradient-to-br from-[#118EEA] to-[#0b63a4] text-white">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                  DANA Dompet Digital
                </span>
                <ShieldCheck className="w-5 h-5 text-sky-200" />
              </div>
              <h4 className="text-base font-extrabold mt-3">Transfer Instan 24/7</h4>
              <p className="text-xs text-sky-100 mt-2 leading-relaxed">
                Kirim saldo ke nomor handphone mana pun yang terdaftar di DANA. Bebas biaya admin transaksi dan otomatis tercatat dalam mutasi TataDana.
              </p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-sky-100">
                <span>Biaya Admin:</span>
                <span className="font-bold text-white">Rp0 (Gratis)</span>
              </div>
              <div className="flex justify-between text-sky-100">
                <span>Limit Transfer:</span>
                <span className="font-bold text-white">Hingga Rp20.000.000</span>
              </div>
              <div className="flex justify-between text-sky-100">
                <span>Kecepatan:</span>
                <span className="font-bold text-emerald-300">Detik ini juga</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSFER OVO */}
      {activeTab === 'ovo' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-premium p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-[#4C3494] text-white flex items-center justify-center font-black shadow-md shadow-[#4C3494]/20">
                O
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Transfer ke OVO Indonesia
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kirim uang ke akun OVO Club / Premier secara real-time.
                </p>
              </div>
            </div>

            <form onSubmit={handleTransferOVO} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sumber Dompet Pengirim
                </label>
                <select
                  value={ovoSourceWallet}
                  onChange={(e) => setOvoSourceWallet(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#4C3494]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — Saldo: {formatRupiah(w.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor HP OVO Tujuan
                  </label>
                  <input
                    type="tel"
                    value={ovoPhone}
                    onChange={(e) => setOvoPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#4C3494]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Penerima OVO
                  </label>
                  <input
                    type="text"
                    value={ovoRecipient}
                    onChange={(e) => setOvoRecipient(e.target.value)}
                    placeholder="Contoh: Alya Alifia"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#4C3494]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  value={ovoAmount}
                  onChange={(e) => setOvoAmount(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#4C3494]"
                  required
                />
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {[20000, 50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOvoAmount(amt.toString())}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-[#4C3494]/10 text-slate-700 hover:text-[#4C3494] rounded-lg text-[11px] font-bold transition-all"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Transfer (Opsional)
                </label>
                <input
                  type="text"
                  value={ovoNotes}
                  onChange={(e) => setOvoNotes(e.target.value)}
                  placeholder="Contoh: Beli pulsa / belanja"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-[#4C3494]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#4C3494] hover:bg-[#3b2774] disabled:bg-slate-300 text-white rounded-xl font-extrabold text-sm shadow-md shadow-[#4C3494]/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{submitting ? 'Memproses Transfer...' : 'Kirim Saldo ke OVO'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* OVO SIDEBAR CARD */}
          <div className="card-premium p-6 rounded-3xl space-y-4 flex flex-col justify-between bg-gradient-to-br from-[#4C3494] to-[#2b185b] text-white">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-300">
                  OVO Premier
                </span>
                <ShieldCheck className="w-5 h-5 text-purple-300" />
              </div>
              <h4 className="text-base font-extrabold mt-3">Transfer Cepat & Praktis</h4>
              <p className="text-xs text-purple-100 mt-2 leading-relaxed">
                Kemudahan mengirim dana langsung ke aplikasi OVO kapan saja. Verifikasi nomor instan tanpa resiko salah transfer.
              </p>
            </div>

            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-purple-200">
                <span>Biaya Admin:</span>
                <span className="font-bold text-white">Rp0 (Gratis)</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Status Akun:</span>
                <span className="font-bold text-white">OVO Club & Premier</span>
              </div>
              <div className="flex justify-between text-purple-200">
                <span>Notifikasi:</span>
                <span className="font-bold text-emerald-300">Tersinkron Web & Bot</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT TRANSFER */}
      {activeTab === 'history' && (
        <div className="card-premium p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Riwayat Transaksi QRIS, DANA & OVO</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Daftar mutasi transfer yang pernah dilakukan melalui sistem TataDana.
              </p>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-orange-600 rounded-xl hover:bg-slate-50 transition-colors"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {transferHistory.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Belum ada riwayat transfer QRIS, DANA, atau OVO.</p>
              <p className="text-[11px] text-slate-400">Coba lakukan pembayaran QRIS atau transfer saldo di tab atas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-2">Tanggal</th>
                    <th className="pb-3 px-2">Metode</th>
                    <th className="pb-3 px-2">Keterangan</th>
                    <th className="pb-3 px-2">Nominal</th>
                    <th className="pb-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transferHistory.map((t) => {
                    const isDana = t.source === 'dana' || t.notes?.toLowerCase().includes('dana');
                    const isOvo = t.source === 'ovo' || t.notes?.toLowerCase().includes('ovo');
                    const isQris = t.source === 'qris' || t.notes?.toLowerCase().includes('qris');

                    const badgeColor = isDana
                      ? 'bg-[#118EEA]/10 text-[#118EEA]'
                      : isOvo
                      ? 'bg-[#4C3494]/10 text-[#4C3494]'
                      : 'bg-red-50 text-red-600';

                    const badgeLabel = isDana ? 'DANA' : isOvo ? 'OVO' : isQris ? 'QRIS' : 'Transfer';
                    const { dateStr, timeStr } = formatWIBDateTime(new Date(t.date));

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-2 text-slate-500">
                          <div>{dateStr}</div>
                          <div className="text-[10px] text-slate-400">{timeStr}</div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${badgeColor}`}>
                            {badgeLabel}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-800">
                          {t.notes || 'Transaksi Transfer'}
                        </td>
                        <td className="py-3 px-2 font-extrabold text-slate-900">
                          {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => {
                              setActiveReceipt({
                                refId: `TRX-${t.id.slice(-6)}`,
                                type: badgeLabel as any,
                                amount: t.amount,
                                adminFee: 0,
                                total: t.amount,
                                sourceWallet: 'Dompet TataDana',
                                date: t.date,
                                status: 'BERHASIL',
                                notes: t.notes,
                              } as any);
                            }}
                            className="px-2.5 py-1 text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-bold inline-flex items-center space-x-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL STRUK DIGITAL RESMI */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Struk */}
            <div className="text-center space-y-2">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-white font-black text-lg ${
                  activeReceipt.type === 'DANA'
                    ? 'bg-[#118EEA]'
                    : activeReceipt.type === 'OVO'
                    ? 'bg-[#4C3494]'
                    : 'bg-red-600'
                }`}
              >
                {activeReceipt.type === 'DANA' ? 'D' : activeReceipt.type === 'OVO' ? 'O' : 'QR'}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>TRANSAKSI BERHASIL</span>
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(activeReceipt.amount)}
                </h3>
                <p className="text-xs text-slate-400 font-medium">{activeReceipt.refId}</p>
              </div>
            </div>

            {/* Detail Transaksi */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Layanan:</span>
                <span className="font-bold text-slate-900">{activeReceipt.service || activeReceipt.type}</span>
              </div>

              {activeReceipt.merchantName && (
                <div className="flex justify-between text-slate-500">
                  <span>Merchant:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.merchantName}</span>
                </div>
              )}

              {activeReceipt.recipientName && (
                <div className="flex justify-between text-slate-500">
                  <span>Penerima:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.recipientName}</span>
                </div>
              )}

              {activeReceipt.accountNumber && (
                <div className="flex justify-between text-slate-500">
                  <span>Nomor Tujuan:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.accountNumber}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500">
                <span>Sumber Dana:</span>
                <span className="font-bold text-slate-900">{activeReceipt.sourceWallet}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Biaya Admin:</span>
                <span className="font-bold text-emerald-600">Rp0 (Gratis)</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total Bayar:</span>
                <span className="text-orange-600">{formatRupiah(activeReceipt.total)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
