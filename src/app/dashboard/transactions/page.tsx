'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, ArrowUpDown, Inbox, AlertCircle, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatWIBDateTime } from '@/lib/utils/date';
import { getClientUserId } from '@/lib/auth/session';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [trxType, setTrxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [transferToWalletId, setTransferToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getClientUserId();
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();

      if (data.ok) {
        setTransactions(data.transactions || []);
        setWallets(data.wallets || []);
        setCategories(data.categories || []);

        if (data.wallets?.length > 0 && !walletId) {
          setWalletId(data.wallets[0].id);
        }
        if (data.wallets?.length > 1 && !transferToWalletId) {
          setTransferToWalletId(data.wallets[1].id);
        }
        if (data.categories?.length > 0 && !categoryId) {
          setCategoryId(data.categories[0].id);
        }
      } else {
        setError(data.error || 'Gagal memuat transaksi');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setTrxType('expense');
    setAmount('');
    setNotes('');
    if (wallets.length > 0) setWalletId(wallets[0].id);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setShowModal(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingId(t.id);
    setTrxType(t.type);
    setAmount(t.amount.toString());
    setNotes(t.notes || '');
    setWalletId(t.wallet_id);
    setTransferToWalletId(t.transfer_to_wallet_id || '');
    setCategoryId(t.category_id || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      const userId = getClientUserId();
      const method = editingId ? 'PUT' : 'POST';
      const bodyPayload: any = {
        userId,
        wallet_id: walletId,
        category_id: trxType === 'transfer' ? undefined : categoryId,
        transfer_to_wallet_id: trxType === 'transfer' ? transferToWalletId : undefined,
        type: trxType,
        amount: Number(amount),
        notes: notes || (trxType === 'transfer' ? 'Transfer Antar Dompet' : 'Catatan'),
        source: 'web',
      };

      if (editingId) {
        bodyPayload.id = editingId;
      }

      const res = await fetch('/api/transactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const resData = await res.json();
      if (resData.ok) {
        setShowModal(false);
        loadData();
      } else {
        alert(resData.error || 'Gagal menyimpan transaksi');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) {
      try {
        const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
        const resData = await res.json();
        if (resData.ok) {
          loadData();
        } else {
          alert(resData.error || 'Gagal menghapus');
        }
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">💳 Transaksi Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola riwayat pemasukan, pengeluaran, dan transfer antar dompet
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi Baru</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card-premium rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Data Table or Friendly Empty State */}
      {!loading && !error && (
        <div className="card-premium rounded-2xl overflow-hidden">
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tanggal (WIB)</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Dompet</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
                    const walName = walletMap.get(t.wallet_id) || '-';
                    const { dateStr, timeStr } = formatWIBDateTime(new Date(t.date));
                    const isIncome = t.type === 'income';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          <div>{dateStr}</div>
                          <div className="text-[10px] text-slate-400">{timeStr}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.type === 'income'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.type === 'expense'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">
                            {cat ? `${cat.emoji} ${cat.name}` : '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">{walName}</td>
                        <td className="py-3.5 px-4 text-slate-800 max-w-xs truncate">{t.notes || '-'}</td>
                        <td
                          className={`py-3.5 px-4 text-right font-extrabold ${
                            isIncome ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => handleOpenEdit(t)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Edit Transaksi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Belum ada transaksi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Transaksi pemasukan dan pengeluaranmu akan muncul di sini setelah kamu mulai mencatat keuangan.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Transaksi</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL CATAT / EDIT TRANSAKSI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">
              {editingId ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                {(['expense', 'income', 'transfer'] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setTrxType(tp)}
                    className={`py-2 rounded-lg font-bold capitalize transition-all ${
                      trxType === tp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {tp === 'expense' ? 'Pengeluaran' : tp === 'income' ? 'Pemasukan' : 'Transfer'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full px-4 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {trxType === 'transfer' ? 'Dari Dompet' : 'Pilih Dompet'}
                </label>
                <select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {trxType === 'transfer' ? (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ke Dompet Tujuan
                  </label>
                  <select
                    value={transferToWalletId}
                    onChange={(e) => setTransferToWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  >
                    {categories
                      .filter((c) => (trxType === 'income' ? c.type === 'income' : c.type === 'expense'))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan Transaksi
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan singkat..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
