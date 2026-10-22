import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';
import { getServerSession } from '@/lib/auth/server';
import { parseTransactionWithAI } from '@/lib/ai/parser';
import { formatRupiah } from '@/lib/utils/currency';
import { renderProgressBar } from '@/lib/telegram/formatter';

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession(req);
    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ ok: false, error: 'Sesi tidak valid' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ ok: false, error: 'Akun Anda belum disetujui admin.' }, { status: 403 });
    }

    const userId = session.effectiveUser.id;
    const profile = session.effectiveUser;
    const body = await req.json();
    const message = body.message?.trim() || '';

    if (!message) {
      return NextResponse.json({ ok: false, error: 'Pesan tidak boleh kosong' }, { status: 400 });
    }

    const lower = message.toLowerCase();
    const wallets = db.getWallets(userId);
    const categories = db.getCategories(userId);
    const transactions = db.getTransactions(userId);
    const defaultWallet = db.getDefaultWallet(userId) || wallets[0];

    // Total saldo
    const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

    // 1. INTENT: CEK SALDO / WALLET
    if (
      lower.includes('saldo') ||
      lower.includes('cek saldo') ||
      lower.includes('dompet') ||
      lower.includes('uang saya') ||
      lower.includes('uangku') ||
      lower === '/saldo'
    ) {
      let walletListText = '';
      wallets.forEach((w) => {
        const icon = w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💵';
        walletListText += `• ${icon} **${w.name}**: ${formatRupiah(w.balance)}${w.is_default ? ' *(Default)*' : ''}\n`;
      });

      return NextResponse.json({
        ok: true,
        reply: {
          text: `👛 **Rincian Saldo Dompet Anda:**\n\n${walletListText}\n💰 **Total Saldo Keseluruhan: ${formatRupiah(totalBalance)}**\n\nAnda dapat mengelola atau menambah dompet di menu **Multi Dompet** atau melakukan transfer lewat menu **Transfer & QRIS**.`,
          cardType: 'balance_overview',
          data: {
            totalBalance,
            wallets,
          },
          quickReplies: ['Catat pengeluaran', 'Transfer DANA', 'Bayar QRIS', 'Cek Budget'],
        },
      });
    }

    // 2. INTENT: CEK BUDGET / ANGGARAN
    if (
      lower.includes('budget') ||
      lower.includes('anggaran') ||
      lower.includes('kuota belanja') ||
      lower === '/budget'
    ) {
      const budgeted = categories.filter((c) => c.monthly_budget && Number(c.monthly_budget) > 0);
      const now = new Date();

      if (budgeted.length === 0) {
        return NextResponse.json({
          ok: true,
          reply: {
            text: `🎯 **Status Anggaran Bulanan:**\n\nAnda belum menyetel batas budget kategori untuk bulan ini.\n\nAtur target pagu pengeluaran Anda di menu **Budget** agar saya bisa membantu memantau pengeluaran Anda!`,
            cardType: 'info',
            quickReplies: ['Atur Budget', 'Cek Saldo', 'Catat Pengeluaran'],
          },
        });
      }

      let budgetText = `🎯 **Status Pagu Budget Bulan Ini:**\n\n`;
      const budgetItems: any[] = [];

      budgeted.forEach((c) => {
        const spent = transactions
          .filter((t) => {
            const d = new Date(t.date);
            return (
              t.category_id === c.id &&
              t.type === 'expense' &&
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const pct = Math.min(100, Math.round((spent / (c.monthly_budget || 1)) * 100));
        const bar = renderProgressBar(pct, 8);
        const sisa = Math.max(0, (c.monthly_budget || 0) - spent);

        budgetText += `${c.emoji} **${c.name}**\n\`${bar}\` **${pct}%** — Sisa: **${formatRupiah(sisa)}**\n\n`;
        budgetItems.push({
          categoryName: c.name,
          emoji: c.emoji,
          budget: c.monthly_budget,
          spent,
          remaining: sisa,
          percentage: pct,
        });
      });

      return NextResponse.json({
        ok: true,
        reply: {
          text: budgetText.trim(),
          cardType: 'budget_list',
          data: { items: budgetItems },
          quickReplies: ['Cek Saldo', 'Beli Kopi 25rb', 'Transfer DANA', 'Tips Hemat'],
        },
      });
    }

    // 3. INTENT: TRANSFER / PEMBAYARAN QRIS / DANA / OVO
    if (
      lower.includes('transfer') ||
      lower.includes('qris') ||
      lower.includes('dana') ||
      lower.includes('ovo') ||
      lower.includes('bayar qris') ||
      lower.includes('kirim uang')
    ) {
      // Deteksi nominal jika user mengetik "transfer dana 50rb"
      let detectedAmount = 0;
      const nominalMatch = message.match(/(\d+[\.,]?\d*)\s*(rb|ribu|k|jt|juta)?/i);
      if (nominalMatch) {
        let val = parseFloat(nominalMatch[1].replace(',', '.'));
        const unit = (nominalMatch[2] || '').toLowerCase();
        if (unit === 'rb' || unit === 'ribu' || unit === 'k') val *= 1000;
        else if (unit === 'jt' || unit === 'juta') val *= 1000000;
        detectedAmount = Math.round(val);
      }

      const method = lower.includes('qris') ? 'QRIS' : lower.includes('ovo') ? 'OVO' : 'DANA';

      return NextResponse.json({
        ok: true,
        reply: {
          text: `🚀 **Layanan Transfer & Pembayaran ${method} TataDana**\n\nSaya mendeteksi Anda ingin melakukan transaksi via **${method}**${detectedAmount > 0 ? ` senilai **${formatRupiah(detectedAmount)}**` : ''}.\n\nAnda dapat langsung membuka fitur transfer instan dengan tombol aksi di bawah:`,
          cardType: 'transfer_action',
          data: {
            method,
            detectedAmount,
            sourceWallet: defaultWallet?.name,
            wallets,
          },
          quickReplies: ['Buka Layanan Transfer', 'Bayar QRIS', 'Transfer DANA', 'Transfer OVO'],
        },
      });
    }

    // 4. INTENT: REKAP / TIPS HEMAT
    if (
      lower.includes('tips') ||
      lower.includes('hemat') ||
      lower.includes('rekap') ||
      lower.includes('keuangan saya') ||
      lower.includes('analisis')
    ) {
      const now = new Date();
      const thisMonthTrxs = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const income = thisMonthTrxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = thisMonthTrxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const net = income - expense;

      let tips = '';
      if (expense > income && income > 0) {
        tips = '⚠️ **Perhatian Pengeluaran:** Pengeluaran Anda melebihi pemasukan bulan ini! Disarankan menunda belanja non-primer dan fokus pada kebutuhan pokok.';
      } else if (income === 0 && expense > 0) {
        tips = '💡 **Catatan Pemasukan:** Belum ada pemasukan yang tercatat bulan ini. Jangan lupa mencatat gaji atau pendapatan usaha Anda.';
      } else if (net > 0) {
        tips = `🎉 **Arus Kas Positif:** Selamat! Anda memiliki surplus tabungan sebesar **${formatRupiah(net)}**. Simpan ke instrumen tabungan atau dana darurat!`;
      } else {
        tips = '✨ **Mulai Berhemat:** Catat setiap pengeluaran kecil harian seperti kopi atau parkir, karena kebocoran halus sering terjadi dari nominal kecil.';
      }

      return NextResponse.json({
        ok: true,
        reply: {
          text: `📊 **Ringkasan Keuangan Anda Bulan Ini:**\n\n• 💰 Total Pemasukan: **${formatRupiah(income)}**\n• 💸 Total Pengeluaran: **${formatRupiah(expense)}**\n• 📈 Arus Kas Bersih: **${formatRupiah(net)}**\n\n${tips}`,
          cardType: 'financial_summary',
          data: { income, expense, net, totalBalance },
          quickReplies: ['Cek Saldo', 'Catat Pemasukan', 'Transfer DANA', 'Cek Budget'],
        },
      });
    }

    // 5. INTENT: NATURAL LANGUAGE TRANSACTION PARSING (e.g. "beli bakso 15rb", "kopi 25k", "gaji 5jt")
    const parsed = await parseTransactionWithAI(message);

    if (parsed.success && parsed.data && parsed.data.nominal > 0) {
      const { jenis, nominal, kategori, catatan } = parsed.data;

      // Cari kategori yang cocok
      let matchedCat = categories.find(
        (c) => c.name.toLowerCase().includes(kategori.toLowerCase()) || kategori.toLowerCase().includes(c.name.toLowerCase())
      );
      if (!matchedCat) {
        matchedCat = categories.find((c) => (jenis === 'pemasukan' ? c.type === 'income' : c.type === 'expense')) || categories[0];
      }

      if (!defaultWallet) {
        return NextResponse.json({
          ok: true,
          reply: {
            text: `⚠️ Anda belum memiliki dompet aktif untuk mencatat transaksi ini. Silakan buat dompet di menu **Multi Dompet**.`,
            cardType: 'error',
          },
        });
      }

      // Simpan transaksi otomatis
      const newTrx = db.createTransaction({
        user_id: userId,
        wallet_id: defaultWallet.id,
        category_id: matchedCat?.id,
        type: jenis === 'pemasukan' ? 'income' : 'expense',
        amount: nominal,
        date: new Date().toISOString(),
        notes: catatan,
        source: 'web_chat_bot',
      });

      const updatedWallet = db.getWallet(defaultWallet.id);

      const replyText =
        jenis === 'pengeluaran'
          ? `💸 **Pengeluaran Berhasil Dicatat!**\n\n` +
            `• 🏷️ **Kategori**: ${matchedCat?.emoji || '🏷️'} ${matchedCat?.name || kategori}\n` +
            `• 💵 **Nominal**: ${formatRupiah(nominal)}\n` +
            `• 👛 **Dompet**: ${defaultWallet.name}\n` +
            `• 📝 **Catatan**: "${catatan}"\n` +
            `• 💰 **Sisa Saldo ${defaultWallet.name}**: ${formatRupiah(updatedWallet?.balance || 0)}`
          : `💰 **Pemasukan Berhasil Ditambahkan!**\n\n` +
            `• 🏷️ **Kategori**: ${matchedCat?.emoji || '💰'} ${matchedCat?.name || kategori}\n` +
            `• 💵 **Nominal**: +${formatRupiah(nominal)}\n` +
            `• 👛 **Dompet**: ${defaultWallet.name}\n` +
            `• 📝 **Catatan**: "${catatan}"\n` +
            `• 💰 **Saldo Baru ${defaultWallet.name}**: ${formatRupiah(updatedWallet?.balance || 0)}`;

      return NextResponse.json({
        ok: true,
        reply: {
          text: replyText,
          cardType: 'transaction_success',
          data: {
            transaction: newTrx,
            nominal,
            jenis,
            categoryName: matchedCat?.name,
            walletName: defaultWallet.name,
            newBalance: updatedWallet?.balance || 0,
          },
          quickReplies: ['Cek Saldo', 'Transfer DANA', 'Bayar QRIS', 'Budget Bulan Ini'],
        },
      });
    }

    // 6. DEFAULT FRIENDLY RESPONSE
    return NextResponse.json({
      ok: true,
      reply: {
        text: `Halo ${profile.full_name.split(' ')[0]}! 😊 Saya adalah **Asisten AI TataDana** yang siap membantu mengelola keuanganmu.\n\nKamu bisa mengetik:\n• **Pencatatan Instan**: *"beli boba 25rb"*, *"makan siang 35k"*, *"gaji 7jt"*\n• **Transfer & QRIS**: *"transfer ke DANA 50rb"*, *"transfer OVO"*, *"bayar QRIS 30rb"*\n• **Cek Status**: *"cek saldo"*, *"status budget"*, *"tips hemat"*\n\nAda yang bisa saya bantu sekarang?`,
        cardType: 'greeting',
        quickReplies: ['Cek Saldo', 'Transfer DANA', 'Bayar QRIS', 'Budget Bulan Ini', 'Tips Hemat'],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
