'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  ArrowUpDown,
  Inbox,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatWIBDateTime } from '@/lib/utils/date';
import { getClientUserId } from '@/lib/auth/session';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Export generating state
  const [isExporting, setIsExporting] = useState<string | null>(null);

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
        setExportHistory(data.reports || []);
      } else {
        setError(data.error || 'Gagal memuat laporan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Filtering Logic
  const filteredTransactions = transactions.filter((t) => {
    if (searchTerm && !t.notes?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false;
    if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet) return false;
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (startDate && new Date(t.date) < new Date(startDate)) return false;
    if (endDate && new Date(t.date) > new Date(endDate)) return false;
    return true;
  });

  // Sorting Logic
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortField === 'date') {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    }
    if (sortField === 'amount') {
      return sortOrder === 'desc' ? Number(b.amount) - Number(a.amount) : Number(a.amount) - Number(b.amount);
    }
    return 0;
  });

  // Summary Metrics (Strictly Real Data, Rp0 if empty)
  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  const netCashflow = totalIncome - totalExpense;

  // Top 5 Expense Categories
  const categorySpendingMap: { [key: string]: { name: string; emoji: string; amount: number } } = {};
  filteredTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
      const catName = cat?.name || 'Lain-lain';
      const catEmoji = cat?.emoji || '🏷️';
      if (!categorySpendingMap[catName]) {
        categorySpendingMap[catName] = { name: catName, emoji: catEmoji, amount: 0 };
      }
      categorySpendingMap[catName].amount += Number(t.amount);
    });

  const top5Categories = Object.values(categorySpendingMap)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    setIsExporting(format);
    try {
      const userId = getClientUserId();
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          format,
          startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: endDate || new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal generate export');
        setIsExporting(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TataDana_Laporan_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      loadData();
    } catch (e: any) {
      alert('Error saat export: ' + e.message);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">📊 Laporan Finansial</h1>
          <p className="text-xs text-slate-500 mt-1">
            Analisis lengkap, ringkasan per periode, dan ekspor instan PDF/Excel
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={isExporting !== null}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExporting === 'xlsx' ? 'Menyiapkan...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>{isExporting === 'pdf' ? 'Menyiapkan...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
          <div className="h-24 bg-slate-200 rounded-2xl"></div>
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

      {!loading && !error && (
        <>
          {/* RINGKASAN METRIK PERIODE INI (All Actual, Rp0 if empty) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-premium p-5 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">+{formatRupiah(totalIncome)}</p>
              <p className="text-xs text-slate-400 mt-1">Periode terpilih</p>
            </div>

            <div className="card-premium p-5 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
              <p className="text-2xl font-extrabold text-red-600 mt-2">-{formatRupiah(totalExpense)}</p>
              <p className="text-xs text-slate-400 mt-1">Periode terpilih</p>
            </div>

            <div className="card-premium p-5 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arus Kas Bersih (Net)</p>
              <p className={`text-2xl font-extrabold mt-2 ${netCashflow >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {formatRupiah(netCashflow)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Surplus / Defisit</p>
            </div>
          </div>

          {/* TOP 5 KATEGORI PENGELUARAN */}
          <div className="card-premium p-6 rounded-2xl">
            <h3 className="font-extrabold text-slate-900 text-sm mb-4">🏆 Top 5 Kategori Pengeluaran</h3>
            {top5Categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {top5Categories.map((cat, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{cat.name}</span>
                    </div>
                    <p className="text-sm font-extrabold text-red-600 mt-1">{formatRupiah(cat.amount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {totalExpense > 0 ? `${Math.round((cat.amount / totalExpense) * 100)}% dari total` : '0%'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Belum ada data pengeluaran pada periode ini.
              </div>
            )}
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="card-premium p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari catatan transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Jenis</option>
                <option value="income">Pemasukan Saja</option>
                <option value="expense">Pengeluaran Saja</option>
              </select>
            </div>
          </div>

          {/* TABEL TRANSAKSI LENGKAP */}
          <div className="card-premium rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Daftar Transaksi Rinci</h3>
                <p className="text-xs text-slate-500">
                  Menampilkan {sortedTransactions.length} transaksi sesuai filter
                </p>
              </div>
            </div>

            {sortedTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th
                        onClick={() => {
                          setSortField('date');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 cursor-pointer hover:text-orange-600"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Tanggal (WIB)</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Dompet</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th
                        onClick={() => {
                          setSortField('amount');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                        className="py-3 px-4 text-right cursor-pointer hover:text-orange-600"
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Nominal</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTransactions.map((t) => {
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
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                              <span>{cat?.emoji || (isIncome ? '💰' : '💸')}</span>
                              <span>{cat?.name || 'Tanpa Kategori'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">{walName}</td>
                          <td className="py-3.5 px-4 text-slate-800 font-medium max-w-xs truncate">
                            {t.notes || '-'}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-extrabold ${
                              isIncome ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
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
                <a
                  href="/dashboard/transactions"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Transaksi</span>
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
