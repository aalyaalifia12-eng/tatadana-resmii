'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CheckCircle2,
  ChevronRight,
  Calendar,
  AlertCircle,
  Inbox,
  Bot,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { formatRupiah } from '@/lib/utils/currency';
import { formatWIBDateTime, isSameMonthWIB, getLastNMonthsWIB } from '@/lib/utils/date';
import { getClientUserId } from '@/lib/auth/session';

export default function DashboardOverviewPage() {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [profile, setProfile] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add Transaction Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'expense' | 'income'>('expense');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickWallet, setQuickWallet] = useState('');
  const [quickNotes, setQuickNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getClientUserId();

      const [userRes, trxRes] = await Promise.all([
        fetch(`/api/auth/me?userId=${userId}`),
        fetch(`/api/transactions?userId=${userId}`),
      ]);

      const userData = await userRes.json();
      const trxData = await trxRes.json();

      if (userData.ok && userData.profile) {
        setProfile(userData.profile);
      }
      if (trxData.ok) {
        setTransactions(trxData.transactions || []);
        setWallets(trxData.wallets || []);
        setCategories(trxData.categories || []);

        if (trxData.wallets?.length > 0 && !quickWallet) {
          setQuickWallet(trxData.wallets[0].id);
        }
        if (trxData.categories?.length > 0 && !quickCategory) {
          setQuickCategory(trxData.categories[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || Number(quickAmount) <= 0) return;

    try {
      const userId = getClientUserId();
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          wallet_id: quickWallet,
          category_id: quickCategory,
          type: quickType,
          amount: Number(quickAmount),
          notes: quickNotes || (quickType === 'income' ? 'Pemasukan' : 'Pengeluaran'),
          source: 'web',
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setQuickAmount('');
        setQuickNotes('');
        loadData();
      }
    } catch (err) {
      alert('Gagal menambah transaksi');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-red-800">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // 1. STATS CARDS: Strictly Real Calculations
  // Saldo Total = jumlah saldo semua wallet
  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  const now = new Date();
  const currentMonthTrxs = transactions.filter((t) => isSameMonthWIB(t.date, now));

  const monthIncome = currentMonthTrxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);

  const monthExpense = currentMonthTrxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  // Budget Tersisa: Rp0 jika belum ada budget yang dibuat
  const budgetedCategories = categories.filter((c) => c.monthly_budget && Number(c.monthly_budget) > 0);
  const totalMonthlyBudget = budgetedCategories.reduce((s, c) => s + Number(c.monthly_budget), 0);
  const remainingBudget = totalMonthlyBudget > 0 ? Math.max(0, totalMonthlyBudget - monthExpense) : 0;

  // 2. PIE CHART DATA: Strictly Real Categories
  const categorySpendingMap: { [key: string]: { name: string; amount: number; color: string } } = {};
  currentMonthTrxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const catName = cat?.name || 'Lain-lain';
      const catColor = cat?.color || '#F97316';
      if (!categorySpendingMap[catName]) {
        categorySpendingMap[catName] = { name: catName, amount: 0, color: catColor };
      }
      categorySpendingMap[catName].amount += Number(t.amount);
    });

  const pieChartData = Object.values(categorySpendingMap);

  // 3. BAR CHART: Strictly Computed from Actual Data for Last 6 Months (Zero if no transactions)
  const last6Months = getLastNMonthsWIB(6);
  const monthlyComparisonData = last6Months.map((m) => {
    const monthTrxs = transactions.filter((t) => {
      const d = new Date(t.date);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Jakarta',
        month: 'numeric',
        year: 'numeric',
      }).formatToParts(d);
      const tMonth = parseInt(parts.find((p) => p.type === 'month')?.value || '0', 10);
      const tYear = parseInt(parts.find((p) => p.type === 'year')?.value || '0', 10);
      return tMonth === m.month && tYear === m.year;
    });

    const inc = monthTrxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = monthTrxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    return {
      bulan: m.label,
      pemasukan: inc,
      pengeluaran: exp,
    };
  });

  // 4. DAILY TREND: Strictly Real Daily Calculation for Current Month
  const dailyMap: { [key: string]: number } = {};
  currentMonthTrxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const dayNum = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
      }).format(new Date(t.date));
      const key = `Tgl ${dayNum}`;
      dailyMap[key] = (dailyMap[key] || 0) + Number(t.amount);
    });

  const dailyTrendData = Object.keys(dailyMap).map((k) => ({
    hari: k,
    pengeluaran: dailyMap[k],
  }));

  const recentTransactions = transactions.slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Selamat Datang, {profile?.full_name || 'Teman TataDana'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Status Keuangan Pribadi &bull; Waktu Indonesia Barat (WIB)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/chat"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>Chat Bot AI</span>
          </Link>

          <Link
            href="/dashboard/transfer"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/80 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4 text-orange-500" />
            <span>Transfer & QRIS</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 4 STATS CARDS: All Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <div className="card-premium p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Total</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-3">{formatRupiah(totalBalance)}</p>
          <p className="text-xs text-slate-400 mt-1">{wallets.length} Dompet aktif</p>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="card-premium p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-3">+{formatRupiah(monthIncome)}</p>
          <p className="text-xs text-slate-400 mt-1">Bulan berjalan</p>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="card-premium p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-3">-{formatRupiah(monthExpense)}</p>
          <p className="text-xs text-slate-400 mt-1">Bulan berjalan</p>
        </div>

        {/* Card 4: Budget Tersisa */}
        <div className="card-premium p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Budget Tersisa</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-3">{formatRupiah(remainingBudget)}</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalMonthlyBudget > 0 ? `Dari pagu ${formatRupiah(totalMonthlyBudget)}` : 'Belum ada budget diset'}
          </p>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart: Pengeluaran per Kategori */}
        <div className="lg:col-span-5 card-premium p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Pengeluaran per Kategori</h3>
            <p className="text-xs text-slate-500">Breakdown alokasi belanja bulan ini</p>
          </div>

          <div className="h-64 my-4 flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatRupiah(Number(value))} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Belum ada pengeluaran bulan ini</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Grafik akan muncul otomatis setelah kamu mencatat transaksi.</p>
              </div>
            )}
          </div>

          {pieChartData.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-3 max-h-36 overflow-y-auto">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bar Chart: Pemasukan vs Pengeluaran 6 Bulan */}
        <div className="lg:col-span-7 card-premium p-6 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Pemasukan vs Pengeluaran</h3>
              <p className="text-xs text-slate-500">Perbandingan 6 bulan terakhir</p>
            </div>
            {monthIncome > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                Aktif
              </span>
            )}
          </div>

          <div className="h-72 my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData}>
                <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v === 0 ? '0' : `${v / 1000}k`)} />
                <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            {transactions.length === 0
              ? 'Mulai catat transaksi untuk melihat tren keuangan bulananmu.'
              : 'Data diperbarui otomatis dari setiap catatan transaksi.'}
          </p>
        </div>
      </div>

      {/* TREND LINE & 10 TRANSAKSI TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Line: Pengeluaran Harian */}
        <div className="lg:col-span-5 card-premium p-6 rounded-2xl">
          <h3 className="font-extrabold text-slate-900 text-sm">Tren Pengeluaran Harian</h3>
          <p className="text-xs text-slate-500 mb-4">Grafik pengeluaran bulan berjalan</p>

          <div className="h-56 flex items-center justify-center">
            {dailyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData}>
                  <XAxis dataKey="hari" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip formatter={(v: any) => formatRupiah(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="pengeluaran"
                    name="Pengeluaran"
                    stroke="#F97316"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">Belum ada pengeluaran harian</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Grafik tren akan terisi saat ada transaksi baru.</p>
              </div>
            )}
          </div>
        </div>

        {/* 10 Transaksi Terbaru: With Friendly Empty State */}
        <div className="lg:col-span-7 card-premium p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">10 Transaksi Terbaru</h3>
              <p className="text-xs text-slate-500">Catatan terbaru masuk</p>
            </div>
            {recentTransactions.length > 0 && (
              <Link
                href="/dashboard/transactions"
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                const wal = wallets.find((w) => w.id === t.wallet_id);
                const { dateStr, timeStr } = formatWIBDateTime(new Date(t.date));
                const isIncome = t.type === 'income';

                return (
                  <div key={t.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{cat?.emoji || (isIncome ? '💰' : '💸')}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{t.notes || cat?.name || 'Transaksi'}</p>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{wal?.name || 'Dompet'}</span>
                          <span>&bull;</span>
                          <span>{dateStr} {timeStr}</span>
                          <span>&bull;</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{t.source}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Inbox className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">Belum ada transaksi</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Transaksi pemasukan dan pengeluaranmu akan muncul di sini setelah kamu mulai mencatat keuangan.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Transaksi Pertama</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ADD TRANSACTION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Catat Transaksi Cepat</h3>

            <form onSubmit={handleQuickAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuickType('expense')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    quickType === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('income')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    quickType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="Contoh: 100000"
                  className="w-full px-4 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dompet
                </label>
                <select
                  value={quickWallet}
                  onChange={(e) => setQuickWallet(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                >
                  {categories
                    .filter((c) => (quickType === 'income' ? c.type === 'income' : c.type === 'expense'))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Catatan
                </label>
                <input
                  type="text"
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="Keterangan transaksi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
