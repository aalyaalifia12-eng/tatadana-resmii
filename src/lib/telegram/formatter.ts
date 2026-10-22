/**
 * Telegram Bot Reply Formatting Templates for TataDana
 * Strictly adheres to PART 4 specifications
 */

import { formatRupiah } from '../utils/currency';
import { formatWIBDateTime } from '../utils/date';

export function renderProgressBar(percentage: number, length: number = 10): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledCount = Math.round((clamped / 100) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

export interface ExpenseFormatParams {
  amount: number;
  categoryName: string;
  categoryEmoji?: string;
  walletName: string;
  notes: string;
  currentBalance: number;
  monthlyBudget?: number | null;
  currentCategorySpent?: number;
  voiceTranscript?: string;
  timestamp?: Date;
}

export function formatExpenseReply(params: ExpenseFormatParams): string {
  const { day, dateStr, timeStr } = formatWIBDateTime(params.timestamp || new Date());
  const emoji = params.categoryEmoji || '🏷️';
  const notesText = params.notes || '-';

  let text = '';
  if (params.voiceTranscript) {
    text += `🎙️ Transkrip: "${params.voiceTranscript}"\n\n`;
  }

  text += `📅 ${day}, ${dateStr} — ${timeStr}\n`;
  text += `💸 Pengeluaran tercatat!\n`;
  text += `├ Nominal : ${formatRupiah(params.amount)}\n`;
  text += `├ Kategori : ${emoji} ${params.categoryName}\n`;
  text += `├ Dompet : 👛 ${params.walletName}\n`;
  text += `├ Catatan : ${notesText}\n`;
  text += `└ Saldo : ${formatRupiah(params.currentBalance)}\n\n`;

  if (params.monthlyBudget && params.monthlyBudget > 0) {
    const totalSpent = (params.currentCategorySpent || 0) + params.amount;
    const remaining = Math.max(0, params.monthlyBudget - totalSpent);
    const percentage = Math.min(100, Math.round((totalSpent / params.monthlyBudget) * 100));
    const progressBar = renderProgressBar(percentage);

    text += `📊 Budget ${params.categoryName} bulan ini:\n`;
    text += `${progressBar} ${percentage}% — sisa ${formatRupiah(remaining)}\n`;

    if (percentage >= 100) {
      text += `⚠️ Perhatian: Budget kategori ini sudah mencapai batas 100%! Rem pengeluaran ya.\n`;
    } else if (percentage >= 80) {
      text += `⚠️ Peringatan: Budget sudah mencapai 80%, lebih hemat lagi ya!\n`;
    } else {
      text += `💡 Budget masih aman, tetap pertahankan gaya hidup hematmu!\n`;
    }
  }

  return text.trim();
}

export interface IncomeFormatParams {
  amount: number;
  walletName: string;
  currentBalance: number;
  voiceTranscript?: string;
  timestamp?: Date;
}

export function formatIncomeReply(params: IncomeFormatParams): string {
  const { day, dateStr, timeStr } = formatWIBDateTime(params.timestamp || new Date());

  let text = '';
  if (params.voiceTranscript) {
    text += `🎙️ Transkrip: "${params.voiceTranscript}"\n\n`;
  }

  text += `📅 ${day}, ${dateStr} — ${timeStr}\n`;
  text += `💰 Pemasukan tercatat!\n`;
  text += `├ Nominal : ${formatRupiah(params.amount)}\n`;
  text += `├ Kategori : 💼 Pemasukan\n`;
  text += `├ Dompet : 👛 ${params.walletName}\n`;
  text += `└ Saldo baru : ${formatRupiah(params.currentBalance)}\n\n`;
  text += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  return text.trim();
}

export function formatFinancialAdvisor(userName: string, analysis: string, advice: string): string {
  return `🤖 Financial Advisor\nHei ${userName}! ${analysis}\n\n💡 Saran: ${advice}`;
}

export function formatDailyReminder(): string {
  return `⏰ Reminder Keuangan!\nJangan lupa catat pengeluaran hari ini ya 📝\nPencatatan rutin = keuangan lebih terkontrol 💪\nKetik transaksimu sekarang!`;
}

export function formatStarterLimitReached(limit: number = 50): string {
  return `⚠️ Batas Transaksi Tercapai!\n\nKamu sudah mencapai limit ${limit} transaksi untuk paket Starter bulan ini.\n\n✨ Upgrade ke TataDana Pro (Rp99.000 Sekali Bayar) untuk:\n- Unlimited Transaksi & Dompet\n- Input via Foto Struk AI OCR\n- AI Financial Advisor\n- Laporan Lengkap & Export PDF/Excel\n\n👉 Upgrade sekarang di https://tatadana.id/dashboard/settings`;
}

export function formatProOnlyFeature(featureName: string): string {
  return `🔒 Fitur Khusus Pro\n\nFitur ${featureName} hanya tersedia untuk pengguna TataDana Pro.\n\nDengan Pro, nikmati kemudahan foto struk belanjaan, AI Financial Advisor, dan Export Laporan tanpa batas.\n\n👉 Upgrade sekarang di https://tatadana.id/dashboard/settings`;
}

export function formatHelpCommand(): string {
  return `✨ Panduan TataDana Bot ✨\nCatat keuangan semudah chat langsung dari sini!\n\n📝 Format Ketik Langsung:\n• "beli bakso 15rb"\n• "gajian 5jt"\n• "kopi kenangan 25k"\n• "bensin 50ribu"\n• "bayar listrik 350.000"\n\n📸 Foto Struk (Paket Pro):\n• Langsung kirim foto struk belanjaan kamu\n\n🎙️ Voice Note:\n• Tekan rekam dan ucapkan transaksi kamu (maks 60 detik)\n\n📌 Perintah Bot:\n/saldo — Cek saldo semua dompet\n/hari_ini — Rekap transaksi hari ini\n/minggu_ini — Rekap transaksi 7 hari terakhir\n/bulan_ini — Rekap transaksi bulan berjalan\n/budget — Status budget semua kategori\n/bantuan — Panduan penggunaan bot`;
}
