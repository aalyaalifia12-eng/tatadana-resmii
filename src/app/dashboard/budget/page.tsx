'use client';

import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, Edit3, AlertCircle, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { isSameMonthWIB } from '@/lib/utils/date';
import { getClientUserId } from '@/lib/auth/session';

export default function BudgetPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = getClientUserId();
      const res = await fetch(`/api/transactions?userId=${userId}`);
      const data = await res.json();
      if (data.ok) {
        setCategories((data.categories || []).filter((c: any) => c.type === 'expense'));
        setTransactions(data.transactions || []);
      } else {
        setError(data.error || 'Gagal memuat budget');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat budget');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const currentMonthTrxs = transactions.filter((t) => t.type === 'expense' && isSameMonthWIB(t.date, now));

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          monthly_budget: Number(newBudgetAmount) || 0,
        }),
      });

      if (res.ok) {
        setEditingCategory(null);
        setNewBudgetAmount('');
        loadData();
      }
    } catch (err) {
      alert('Gagal menyimpan budget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">🎯 Budget per Kategori</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau alokasi bulanan dan dapatkan alert otomatis di Telegram saat mencapai 80% dan 100%
          </p>
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
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const spent = currentMonthTrxs
              .filter((t) => t.category_id === cat.id)
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const budget = Number(cat.monthly_budget) || 0;
            const percentage = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
            const remaining = Math.max(0, budget - spent);
            const isOver80 = percentage >= 80 && percentage < 100;
            const isOver100 = percentage >= 100 && budget > 0;

            return (
              <div key={cat.id} className="card-premium p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{cat.emoji}</span>
                      <h3 className="font-extrabold text-slate-900 text-sm">{cat.name}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewBudgetAmount(cat.monthly_budget ? cat.monthly_budget.toString() : '');
                      }}
                      className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Atur Budget"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{formatRupiah(spent)}</span>
                      <span className="text-slate-400">
                        {budget > 0 ? `Pagu: ${formatRupiah(budget)}` : 'Belum ada budget'}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isOver100 ? 'bg-red-500' : isOver80 ? 'bg-amber-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-semibold text-slate-500">{percentage}% terpakai</span>
                      <span className={`font-bold ${isOver100 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {budget > 0 ? `Sisa ${formatRupiah(remaining)}` : 'Rp0'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  {budget === 0 ? (
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setNewBudgetAmount('');
                      }}
                      className="text-xs text-orange-600 font-bold hover:underline"
                    >
                      + Atur batas budget bulanan
                    </button>
                  ) : isOver100 ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Budget Habis!</span>
                    </div>
                  ) : isOver80 ? (
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Waspada &gt;80%</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Budget Aman</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT BUDGET MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Set Budget {editingCategory.emoji} {editingCategory.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tentukan batas pengeluaran bulanan maksimum untuk kategori ini.</p>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nominal Budget Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-4 py-2.5 text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-md shadow-orange-500/20"
                >
                  Simpan Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
