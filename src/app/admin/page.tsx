'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Cpu,
  Key,
  Shield,
  CreditCard,
  CheckCircle2,
  XCircle,
  FileDown,
  Eye,
  LogIn,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldAlert,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { db, Profile, AIProviderConfig, AICallLog, Transaction } from '@/lib/data/storage';
import { formatRupiah } from '@/lib/utils/currency';
import { setImpersonatedUserId } from '@/lib/auth/session';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [aiProviders, setAIProviders] = useState<AIProviderConfig[]>([]);
  const [aiLogs, setAILogs] = useState<AICallLog[]>([]);

  // Inspeksi Transaksi Modal
  const [inspectUser, setInspectUser] = useState<Profile | null>(null);
  const [inspectedTransactions, setInspectedTransactions] = useState<Transaction[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Manual Payment Requests Mock
  const [pendingPayments, setPendingPayments] = useState([
    {
      id: 'pay_01',
      userName: 'Ahmad Fauzi',
      phone: '081399887766',
      plan: 'Pro Lifetime',
      amount: 99000,
      bank: 'BCA Manual Transfer',
      receiptUrl: '#',
      date: '2026-10-20 14:10 WIB',
    },
    {
      id: 'pay_02',
      userName: 'Dewi Anggraini',
      phone: '085711223344',
      plan: 'Starter Monthly',
      amount: 49000,
      bank: 'Mandiri Manual Transfer',
      receiptUrl: '#',
      date: '2026-10-20 15:30 WIB',
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProfiles(db.getAllProfiles());
    setAIProviders(db.getAIProviders());
    setAILogs(db.getAILogs());
  };

  const handleApproveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action: 'approve' }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({ text: `Akun ${data.user.full_name} berhasil disetujui!`, type: 'success' });
        loadData();
      } else {
        setFeedbackMsg({ text: data.error || 'Gagal menyetujui akun', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectUser = async (userId: string) => {
    const reason = prompt('Masukkan alasan penolakan (opsional):', 'Data registrasi tidak memenuhi kriteria verifikasi.');
    if (reason === null) return; // cancelled

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action: 'reject', reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({ text: `Permintaan akun ${data.user.full_name} telah ditolak.`, type: 'success' });
        loadData();
      } else {
        setFeedbackMsg({ text: data.error || 'Gagal menolak akun', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin menangguhkan (suspend) akun pengguna ini? Akses pengguna akan langsung dicabut.')) return;

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action: 'suspend' }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({ text: `Akun ${data.user.full_name} telah dinonaktifkan (suspended).`, type: 'success' });
        loadData();
      } else {
        setFeedbackMsg({ text: data.error || 'Gagal menangguhkan akun', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action: 'reactivate' }),
      });
      const data = await res.json();
      if (data.ok) {
        setFeedbackMsg({ text: `Akun ${data.user.full_name} berhasil diaktifkan kembali.`, type: 'success' });
        loadData();
      } else {
        setFeedbackMsg({ text: data.error || 'Gagal mengaktifkan akun', type: 'error' });
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setImpersonatedUserId(userId);
        router.push('/dashboard');
      } else {
        alert(data.error || 'Gagal memulai mode impersonation');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memulai mode impersonation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleProvider = (id: string, current: boolean) => {
    db.updateAIProvider(id, { is_active: !current });
    loadData();
  };

  const handleChangeMode = (id: string, mode: 'single' | 'failover') => {
    db.updateAIProvider(id, { mode });
    loadData();
  };

  const handleInspectUserTransactions = (user: Profile) => {
    db.logAdminAudit('admin', user.id, 'INSPECT_TRANSACTIONS', {
      user_name: user.full_name,
      user_email: user.email,
    });
    setInspectUser(user);
    setInspectedTransactions(db.getTransactions(user.id));
  };

  const handleExportAllUsers = () => {
    const data = JSON.stringify(
      {
        profiles: db.getAllProfiles(),
        totalUsers: db.getAllProfiles().length,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TataDana_All_Users_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleApprovePayment = (id: string) => {
    setPendingPayments(pendingPayments.filter((p) => p.id !== id));
    alert('Pembayaran telah disetujui! Status langganan pengguna otomatis aktif.');
  };

  const handleRejectPayment = (id: string) => {
    setPendingPayments(pendingPayments.filter((p) => p.id !== id));
    alert('Pembayaran ditolak.');
  };

  const pendingUsers = profiles.filter((p) => p.approval_status === 'pending');
  const activeUsers = profiles.filter((p) => p.approval_status !== 'pending');

  return (
    <div className="space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <span>Control Panel Superadmin</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Live Production
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sistem Persetujuan Akun, Pemisahan Role, Engine Multi-AI, & Audit Trail
          </p>
        </div>

        <button
          onClick={handleExportAllUsers}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
        >
          <FileDown className="w-4 h-4 text-orange-400" />
          <span>Export Data Semua User (.json)</span>
        </button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* 1. PERMINTAAN AKUN (USERS PENDING VERIFIKASI) */}
      <div id="account-requests" className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-white mb-1 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Permintaan Akun ({pendingUsers.length} Menunggu Persetujuan)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Pengguna di bawah ini baru mendaftar dan belum dapat mengakses dashboard sebelum disetujui.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
            {pendingUsers.length} Permintaan
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-300">Semua Permintaan Akun Telah Diproses</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tidak ada pengguna baru dengan status pending saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Nomor HP</th>
                  <th className="py-3 px-4">Tanggal Registrasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white">{u.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{u.email || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.phone_number || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1 w-max">
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApproveUser(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                        <button
                          onClick={() => handleRejectUser(u.id)}
                          disabled={actionLoading === u.id}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. KELOLA PENGGUNA TERDAFTAR (APPROVED, REJECTED, SUSPENDED) */}
      <div id="users-list" className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-extrabold text-white mb-1 flex items-center space-x-2">
          <Users className="w-4 h-4 text-orange-400" />
          <span>Kelola Seluruh Pengguna ({profiles.length} Total Terdaftar)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Pemisahan role, status approval, audit transaksi, dan impersonasi tersinkronisasi server.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status Akses</th>
                <th className="py-3 px-4">Paket</th>
                <th className="py-3 px-4">Telegram Bot</th>
                <th className="py-3 px-4 text-center">Aksi Administrator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {profiles.map((u) => {
                const trxsCount = db.getTransactions(u.id).length;
                return (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-medium">
                      <p className="font-bold text-white">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email || u.phone_number}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          u.role === 'superadmin' || u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.approval_status === 'approved' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Approved
                        </span>
                      )}
                      {u.approval_status === 'pending' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pending
                        </span>
                      )}
                      {u.approval_status === 'rejected' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          Rejected
                        </span>
                      )}
                      {u.approval_status === 'suspended' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.plan === 'pro'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.plan === 'pro' ? 'Pro Lifetime' : 'Starter'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.telegram_connected ? (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terhubung</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Belum dihubungkan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleInspectUserTransactions(u)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center space-x-1"
                          title="Inspeksi Transaksi (Audit Log)"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inspeksi</span>
                        </button>

                        {/* Impersonation available only for non-admin approved users */}
                        {u.role === 'user' && u.approval_status === 'approved' && (
                          <button
                            onClick={() => handleImpersonate(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm"
                            title="Impersonate Dashboard Pengguna"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Impersonate</span>
                          </button>
                        )}

                        {/* Suspend or Reactivate buttons */}
                        {u.role === 'user' && u.approval_status === 'approved' && (
                          <button
                            onClick={() => handleSuspendUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 rounded-lg text-[11px] font-bold flex items-center space-x-1 border border-slate-700"
                            title="Tangguhkan (Suspend) Akun"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            <span>Suspend</span>
                          </button>
                        )}

                        {u.approval_status === 'suspended' && (
                          <button
                            onClick={() => handleReactivateUser(u.id)}
                            disabled={actionLoading === u.id}
                            className="px-2 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1"
                            title="Aktifkan Kembali Akun"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. KELOLA API PROVIDER AI (MULTI-PROVIDER: GEMINI, OPENAI, DEEPSEEK) */}
      <div id="ai-providers" className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-extrabold text-white mb-1 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-orange-400" />
          <span>Konfigurasi Engine Multi-AI (Failover & Mode Paralel)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Admin dapat mengaktifkan/menonaktifkan provider, menyetel mode failover jika provider utama downtime, serta memperbarui API key.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {aiProviders.map((ai) => (
            <div
              key={ai.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                ai.is_active ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/30 border-slate-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-extrabold text-white text-sm">{ai.display_name}</p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ai.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {ai.is_active ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mb-2">Model: {ai.model_name}</p>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 mb-3">
                  <span className="text-[10px] text-slate-500 block mb-1">API Key Terenkripsi:</span>
                  <p className="font-mono text-[10px] text-slate-300 truncate">{ai.api_key}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleProvider(ai.id, ai.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    ai.is_active
                      ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {ai.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>

                <select
                  value={ai.mode}
                  onChange={(e) => handleChangeMode(ai.id, e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="failover">Mode Failover</option>
                  <option value="single">Mode Tunggal</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AUDIT & LOG AI */}
      <div id="ai-logs" className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-extrabold text-white mb-1 flex items-center space-x-2">
          <Key className="w-4 h-4 text-orange-400" />
          <span>Log AI & Audit Biaya Token (Transparansi Finansial)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Pemantauan latency model, kegagalan request, dan estimasi biaya token Telegram Bot.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Provider / Model</th>
                <th className="py-3 px-4">Tipe Aksi</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {aiLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{log.created_at.replace('T', ' ').slice(0, 19)}</td>
                  <td className="py-3 px-4 font-bold text-white capitalize">{log.provider}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{log.action}</td>
                  <td className="py-3 px-4 text-slate-400">{log.latency_ms} ms</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. VERIFIKASI PEMBAYARAN MANUAL */}
      <div id="payments" className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-extrabold text-white mb-1 flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-orange-400" />
          <span>Verifikasi Pembayaran Manual Midtrans / Transfer ({pendingPayments.length} Permintaan)</span>
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Admin dapat menyetujui atau menolak bukti transfer bank pengguna untuk paket Pro Lifetime.
        </p>

        {pendingPayments.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Tidak ada pembayaran manual yang pending.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <p>{p.userName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{p.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-orange-400 font-bold">{p.plan}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{formatRupiah(p.amount)}</td>
                    <td className="py-3.5 px-4 text-slate-300">{p.bank}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApprovePayment(p.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectPayment(p.id)}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL INSPEKSI TRANSAKSI USER */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                  <span>Inspeksi Transaksi: {inspectUser.full_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-orange-400">
                    Audit Log Recorded
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">{inspectUser.phone_number || inspectUser.email}</p>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                Tutup
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {inspectedTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Pengguna belum memiliki catatan transaksi.</p>
              ) : (
                inspectedTransactions.map((trx) => (
                  <div
                    key={trx.id}
                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{trx.notes || 'Transaksi'}</p>
                      <p className="text-[10px] text-slate-500">{trx.date.slice(0, 10)} &bull; Source: {trx.source}</p>
                    </div>
                    <span
                      className={`font-bold font-mono ${
                        trx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {trx.type === 'income' ? '+' : '-'}{formatRupiah(trx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
