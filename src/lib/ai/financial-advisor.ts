/**
 * AI Financial Advisor Engine for TataDana Pro
 * Automatic trigger conditions & actionable Indonesian financial guidance
 */

import { formatRupiah } from '../utils/currency';
import { formatFinancialAdvisor } from '../telegram/formatter';

export interface AdvisorContext {
  userName: string;
  categoryName: string;
  transactionAmount: number;
  categoryWeeklyCurrent: number;
  categoryWeeklyPrevious: number;
  monthTotalIncome: number;
  monthTotalExpense: number;
  categoryBudget?: number | null;
}

export function evaluateFinancialAdvisor(ctx: AdvisorContext): { shouldTrigger: boolean; message?: string } {
  const {
    userName,
    categoryName,
    transactionAmount,
    categoryWeeklyCurrent,
    categoryWeeklyPrevious,
    monthTotalIncome,
    monthTotalExpense,
    categoryBudget,
  } = ctx;

  // Trigger 1: Single large transaction >20% of category monthly budget
  if (categoryBudget && categoryBudget > 0 && transactionAmount >= categoryBudget * 0.2) {
    const percentage = Math.round((transactionAmount / categoryBudget) * 100);
    const analysis = `Transaksi barusan sebesar ${formatRupiah(transactionAmount)} menghabiskan ${percentage}% dari total alokasi budget bulanan ${categoryName} kamu!`;
    const advice = `Coba tahan dulu pengeluaran non-primer di kategori ini untuk 7 hari ke depan agar budgetmu tetap bertahan sampai akhir bulan.`;
    return {
      shouldTrigger: true,
      message: formatFinancialAdvisor(userName, analysis, advice),
    };
  }

  // Trigger 2: Category weekly surge > 50% compared to previous week
  if (categoryWeeklyPrevious > 0 && categoryWeeklyCurrent >= categoryWeeklyPrevious * 1.5) {
    const surgePercent = Math.round(((categoryWeeklyCurrent - categoryWeeklyPrevious) / categoryWeeklyPrevious) * 100);
    const analysis = `Pengeluaranmu di kategori ${categoryName} minggu ini naik ${surgePercent}% dibanding minggu lalu (Total minggu ini: ${formatRupiah(categoryWeeklyCurrent)}).`;
    const advice = `Periksa kembali detail transaksi ${categoryName}. Jika ada yang impulsif, jadwalkan ulang kebutuhan serupa untuk bulan depan.`;
    return {
      shouldTrigger: true,
      message: formatFinancialAdvisor(userName, analysis, advice),
    };
  }

  // Trigger 3: Month total expense > 80% of total income
  if (monthTotalIncome > 0 && monthTotalExpense >= monthTotalIncome * 0.8) {
    const ratio = Math.round((monthTotalExpense / monthTotalIncome) * 100);
    const analysis = `Total pengeluaranmu bulan ini sudah mencapai ${ratio}% dari total pemasukan (${formatRupiah(monthTotalExpense)} dari ${formatRupiah(monthTotalIncome)}).`;
    const advice = `Saatnya mengaktifkan mode hemat ekstra! Alihkan sisa dana ke pos darurat dan prioritaskan hanya kebutuhan pokok sampai gajian berikutnya.`;
    return {
      shouldTrigger: true,
      message: formatFinancialAdvisor(userName, analysis, advice),
    };
  }

  return { shouldTrigger: false };
}
