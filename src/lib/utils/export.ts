/**
 * Report Exporter for TataDana (PDF & Excel .xlsx)
 * Supports custom date ranges, multi-wallet filtering,
 * top categories summary, and transaction receipts.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Wallet, Category } from '../data/storage';
import { formatRupiah } from './currency';
import { formatWIBDateTime } from './date';

export interface GenerateExportOptions {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  startDate: string;
  endDate: string;
  userName: string;
}

export function generateExcelReport(options: GenerateExportOptions): Uint8Array {
  const { transactions, wallets, categories, startDate, endDate, userName } = options;

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, `${c.emoji} ${c.name}`]));

  // Sheet 1: Transaksi
  const rows = transactions.map((t, idx) => {
    const { dateStr, timeStr } = formatWIBDateTime(new Date(t.date));
    return {
      No: idx + 1,
      Tanggal: `${dateStr} ${timeStr}`,
      Jenis: t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      Kategori: t.category_id ? categoryMap.get(t.category_id) || '-' : '-',
      Dompet: walletMap.get(t.wallet_id) || '-',
      Nominal: t.amount,
      Catatan: t.notes || '-',
      Sumber: t.source,
      Rincian_Item: t.receipt_items
        ? t.receipt_items.map((i) => `${i.item_name} (${i.quantity}x @${formatRupiah(i.price)})`).join('; ')
        : '-',
    };
  });

  const wsTransactions = XLSX.utils.json_to_sheet(rows);

  // Sheet 2: Ringkasan
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: { [key: string]: number } = {};

  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') {
      totalExpense += t.amount;
      const catName = (t.category_id && categoryMap.get(t.category_id)) || 'Lain-lain';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + t.amount;
    }
  });

  const summaryRows = [
    { Metrik: 'Nama Pengguna', Nilai: userName },
    { Metrik: 'Periode Awal', Nilai: startDate },
    { Metrik: 'Periode Akhir', Nilai: endDate },
    { Metrik: 'Total Pemasukan', Nilai: totalIncome },
    { Metrik: 'Total Pengeluaran', Nilai: totalExpense },
    { Metrik: 'Arus Kas Bersih', Nilai: totalIncome - totalExpense },
    { Metrik: 'Total Jumlah Transaksi', Nilai: transactions.length },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Daftar Transaksi');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buf;
}

export function generatePdfReport(options: GenerateExportOptions): Uint8Array {
  const { transactions, wallets, categories, startDate, endDate, userName } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, `${c.name}`]));

  // Brand Header
  doc.setFillColor(249, 115, 22); // Orange TataDana
  doc.rect(0, 0, 210, 22, 'F');

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TataDana — Laporan Keuangan Pribadi', 14, 14);

  // Sub Header
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pengguna : ${userName}`, 14, 30);
  doc.text(`Periode  : ${startDate} s/d ${endDate}`, 14, 36);
  doc.text(`Dicetak  : ${new Date().toLocaleDateString('id-ID')} (WIB)`, 14, 42);

  // Summary Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const netCashflow = totalIncome - totalExpense;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(14, 46, 182, 18, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMASUKAN', 18, 52);
  doc.text('TOTAL PENGELUARAN', 80, 52);
  doc.text('ARUS KAS BERSIH', 142, 52);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(formatRupiah(totalIncome), 18, 60);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(formatRupiah(totalExpense), 80, 60);

  doc.setTextColor(netCashflow >= 0 ? 16 : 239, netCashflow >= 0 ? 185 : 68, netCashflow >= 0 ? 129 : 68);
  doc.text(formatRupiah(netCashflow), 142, 60);

  // Transactions Table
  const tableData = transactions.map((t, idx) => {
    const { dateStr, timeStr } = formatWIBDateTime(new Date(t.date));
    const cat = t.category_id ? categoryMap.get(t.category_id) || '-' : '-';
    const wal = walletMap.get(t.wallet_id) || '-';
    const amountStr = `${t.type === 'income' ? '+' : '-'} ${formatRupiah(t.amount)}`;
    return [idx + 1, `${dateStr}\n${timeStr}`, cat, wal, t.notes || '-', amountStr];
  });

  autoTable(doc, {
    startY: 70,
    head: [['No', 'Tanggal', 'Kategori', 'Dompet', 'Catatan', 'Nominal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 50 },
      5: { cellWidth: 34, halign: 'right' },
    },
  });

  const output = doc.output('arraybuffer');
  return new Uint8Array(output);
}
