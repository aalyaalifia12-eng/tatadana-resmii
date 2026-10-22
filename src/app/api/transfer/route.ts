import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';
import { getServerSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const session = getServerSession(req);
    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ ok: false, error: 'Sesi tidak valid' }, { status: 401 });
    }

    const userId = session.effectiveUser.id;
    const transactions = db.getTransactions(userId);
    const wallets = db.getWallets(userId);

    // Filter transactions related to QRIS, DANA, OVO
    const transferHistory = transactions.filter(
      (t) =>
        t.source === 'qris' ||
        t.source === 'dana' ||
        t.source === 'ovo' ||
        t.notes?.toLowerCase().includes('qris') ||
        t.notes?.toLowerCase().includes('dana') ||
        t.notes?.toLowerCase().includes('ovo') ||
        t.type === 'transfer'
    );

    return NextResponse.json({
      ok: true,
      transferHistory,
      wallets,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

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
    const userWallets = db.getWallets(userId);
    const body = await req.json();
    const { action } = body;

    // 1. BAYAR VIA QRIS
    if (action === 'qris_pay') {
      const { source_wallet_id, amount, merchant_name, nmid, notes } = body;
      const parsedAmount = Number(amount);

      if (!source_wallet_id || isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'Nominal dan dompet sumber wajib diisi' }, { status: 400 });
      }

      const wallet = userWallets.find((w) => w.id === source_wallet_id);
      if (!wallet) {
        return NextResponse.json({ ok: false, error: 'Dompet sumber tidak ditemukan' }, { status: 404 });
      }

      if (wallet.balance < parsedAmount) {
        return NextResponse.json(
          { ok: false, error: `Saldo ${wallet.name} tidak mencukupi (Tersedia: Rp${wallet.balance.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }

      const cleanMerchant = merchant_name?.trim() || 'Merchant QRIS Standar';
      const cleanNMID = nmid?.trim() || `ID102026${Math.floor(100000000 + Math.random() * 900000000)}`;
      const refId = `QRIS-${Date.now().toString().slice(-8)}`;

      // Cari atau gunakan kategori Belanja / Tagihan
      const categories = db.getCategories(userId);
      const category = categories.find((c) => c.name.toLowerCase().includes('belanja') || c.name.toLowerCase().includes('makanan')) || categories[0];

      const createdTrx = db.createTransaction({
        user_id: userId,
        wallet_id: source_wallet_id,
        category_id: category?.id,
        type: 'expense',
        amount: parsedAmount,
        date: new Date().toISOString(),
        notes: `Pembayaran QRIS: ${cleanMerchant}${notes ? ` (${notes})` : ''}`,
        source: 'qris',
        receipt_items: [
          {
            id: `rcp_${Date.now()}`,
            transaction_id: '',
            item_name: `Pembayaran QRIS ${cleanMerchant}`,
            price: parsedAmount,
            quantity: 1,
            category_name: category?.name || 'QRIS Payment',
          },
        ],
      });

      return NextResponse.json({
        ok: true,
        message: `Pembayaran QRIS Rp${parsedAmount.toLocaleString('id-ID')} ke ${cleanMerchant} BERHASIL!`,
        receipt: {
          refId,
          type: 'QRIS',
          method: 'QRIS Standar Nasional',
          merchantName: cleanMerchant,
          nmid: cleanNMID,
          amount: parsedAmount,
          adminFee: 0,
          total: parsedAmount,
          sourceWallet: wallet.name,
          date: new Date().toISOString(),
          status: 'BERHASIL',
        },
        transaction: createdTrx,
      });
    }

    // 2. GENERATE QRIS TERIMA UANG
    if (action === 'qris_generate') {
      const { target_wallet_id, amount, notes } = body;
      const parsedAmount = Number(amount) || 0;

      const wallet = userWallets.find((w) => w.id === target_wallet_id) || db.getDefaultWallet(userId) || userWallets[0];
      const merchantName = `TataDana - ${session.effectiveUser.full_name}`;
      const nmid = `ID102026${Math.floor(100000000 + Math.random() * 900000000)}`;
      const qrId = `QRIS-GEN-${Date.now()}`;
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      return NextResponse.json({
        ok: true,
        qrisData: {
          qrId,
          merchantName,
          nmid,
          amount: parsedAmount,
          targetWalletId: wallet?.id,
          targetWalletName: wallet?.name,
          notes: notes || 'Pembayaran QRIS TataDana',
          expiresAt: expiryTime,
          // Simulated EMVCo payload for QRIS Indonesia
          qrString: `00020101021226670014ID.LINKAJA.WWW01189360000201102026889520458125303360540${parsedAmount}5802ID59${merchantName.length}${merchantName}6007JAKARTA6304ABCD`,
        },
      });
    }

    // 3. SIMULASI TERIMA PEMBAYARAN QRIS
    if (action === 'qris_simulate_receive') {
      const { target_wallet_id, amount, notes, sender_name } = body;
      const parsedAmount = Number(amount);
      if (!target_wallet_id || !parsedAmount || parsedAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'Data pembayaran tidak lengkap' }, { status: 400 });
      }

      const wallet = userWallets.find((w) => w.id === target_wallet_id);
      if (!wallet) {
        return NextResponse.json({ ok: false, error: 'Dompet tujuan tidak ditemukan' }, { status: 404 });
      }

      const categories = db.getCategories(userId);
      const incCategory = categories.find((c) => c.type === 'income') || categories[0];

      const createdTrx = db.createTransaction({
        user_id: userId,
        wallet_id: target_wallet_id,
        category_id: incCategory?.id,
        type: 'income',
        amount: parsedAmount,
        date: new Date().toISOString(),
        notes: `Terima QRIS dari ${sender_name || 'Pelanggan / Donatur'}${notes ? ` - ${notes}` : ''}`,
        source: 'qris',
      });

      return NextResponse.json({
        ok: true,
        message: `Dana masuk sebesar Rp${parsedAmount.toLocaleString('id-ID')} ke ${wallet.name} berhasil diterima via QRIS!`,
        transaction: createdTrx,
      });
    }

    // 4. TRANSFER DANA (E-WALLET DANA)
    if (action === 'transfer_dana') {
      const { source_wallet_id, phone_number, recipient_name, amount, notes, internal_wallet_id } = body;
      const parsedAmount = Number(amount);

      if (!phone_number || !recipient_name || !source_wallet_id || isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'Semua kolom transfer DANA wajib diisi dengan benar' }, { status: 400 });
      }

      const sourceWallet = userWallets.find((w) => w.id === source_wallet_id);
      if (!sourceWallet) {
        return NextResponse.json({ ok: false, error: 'Dompet sumber tidak ditemukan' }, { status: 404 });
      }

      if (sourceWallet.balance < parsedAmount) {
        return NextResponse.json(
          { ok: false, error: `Saldo ${sourceWallet.name} tidak cukup (Tersedia: Rp${sourceWallet.balance.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }

      const refId = `DANA-${Date.now().toString().slice(-8)}`;

      // Jika mentransfer ke dompet DANA milik akun sendiri di TataDana
      if (internal_wallet_id) {
        const destWallet = userWallets.find((w) => w.id === internal_wallet_id);
        const createdTrx = db.createTransaction({
          user_id: userId,
          wallet_id: source_wallet_id,
          transfer_to_wallet_id: internal_wallet_id,
          type: 'transfer',
          amount: parsedAmount,
          date: new Date().toISOString(),
          notes: `Top-up DANA (${phone_number} - ${recipient_name})${notes ? `: ${notes}` : ''}`,
          source: 'dana',
        });

        return NextResponse.json({
          ok: true,
          message: `Transfer ke DANA (${recipient_name}) sebesar Rp${parsedAmount.toLocaleString('id-ID')} berhasil!`,
          receipt: {
            refId,
            type: 'DANA',
            service: 'DANA Dompet Digital Indonesia',
            accountNumber: phone_number,
            recipientName: recipient_name,
            amount: parsedAmount,
            adminFee: 0,
            total: parsedAmount,
            sourceWallet: sourceWallet.name,
            destWallet: destWallet?.name || 'DANA',
            date: new Date().toISOString(),
            status: 'BERHASIL',
          },
          transaction: createdTrx,
        });
      }

      // Transfer eksternal ke nomor DANA tujuan
      const categories = db.getCategories(userId);
      const category = categories.find((c) => c.name.toLowerCase().includes('transfer') || c.name.toLowerCase().includes('kebutuhan')) || categories[0];

      const createdTrx = db.createTransaction({
        user_id: userId,
        wallet_id: source_wallet_id,
        category_id: category?.id,
        type: 'expense',
        amount: parsedAmount,
        date: new Date().toISOString(),
        notes: `Transfer DANA ke ${recipient_name} (${phone_number})${notes ? ` - ${notes}` : ''}`,
        source: 'dana',
        receipt_items: [
          {
            id: `rcp_${Date.now()}`,
            transaction_id: '',
            item_name: `Transfer DANA ke ${recipient_name} (${phone_number})`,
            price: parsedAmount,
            quantity: 1,
            category_name: 'DANA Transfer',
          },
        ],
      });

      return NextResponse.json({
        ok: true,
        message: `Transfer DANA Rp${parsedAmount.toLocaleString('id-ID')} ke ${recipient_name} (${phone_number}) BERHASIL!`,
        receipt: {
          refId,
          type: 'DANA',
          service: 'DANA Transfer Instan',
          accountNumber: phone_number,
          recipientName: recipient_name,
          amount: parsedAmount,
          adminFee: 0,
          total: parsedAmount,
          sourceWallet: sourceWallet.name,
          date: new Date().toISOString(),
          status: 'BERHASIL',
        },
        transaction: createdTrx,
      });
    }

    // 5. TRANSFER OVO (E-WALLET OVO)
    if (action === 'transfer_ovo') {
      const { source_wallet_id, phone_number, recipient_name, amount, notes, internal_wallet_id } = body;
      const parsedAmount = Number(amount);

      if (!phone_number || !recipient_name || !source_wallet_id || isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ ok: false, error: 'Semua kolom transfer OVO wajib diisi dengan benar' }, { status: 400 });
      }

      const sourceWallet = userWallets.find((w) => w.id === source_wallet_id);
      if (!sourceWallet) {
        return NextResponse.json({ ok: false, error: 'Dompet sumber tidak ditemukan' }, { status: 404 });
      }

      if (sourceWallet.balance < parsedAmount) {
        return NextResponse.json(
          { ok: false, error: `Saldo ${sourceWallet.name} tidak cukup (Tersedia: Rp${sourceWallet.balance.toLocaleString('id-ID')})` },
          { status: 400 }
        );
      }

      const refId = `OVO-${Date.now().toString().slice(-8)}`;

      // Jika mentransfer ke dompet OVO milik sendiri di TataDana
      if (internal_wallet_id) {
        const destWallet = userWallets.find((w) => w.id === internal_wallet_id);
        const createdTrx = db.createTransaction({
          user_id: userId,
          wallet_id: source_wallet_id,
          transfer_to_wallet_id: internal_wallet_id,
          type: 'transfer',
          amount: parsedAmount,
          date: new Date().toISOString(),
          notes: `Top-up OVO (${phone_number} - ${recipient_name})${notes ? `: ${notes}` : ''}`,
          source: 'ovo',
        });

        return NextResponse.json({
          ok: true,
          message: `Transfer ke OVO (${recipient_name}) sebesar Rp${parsedAmount.toLocaleString('id-ID')} berhasil!`,
          receipt: {
            refId,
            type: 'OVO',
            service: 'OVO Premier Indonesia',
            accountNumber: phone_number,
            recipientName: recipient_name,
            amount: parsedAmount,
            adminFee: 0,
            total: parsedAmount,
            sourceWallet: sourceWallet.name,
            destWallet: destWallet?.name || 'OVO',
            date: new Date().toISOString(),
            status: 'BERHASIL',
          },
          transaction: createdTrx,
        });
      }

      // Transfer eksternal ke nomor OVO tujuan
      const categories = db.getCategories(userId);
      const category = categories.find((c) => c.name.toLowerCase().includes('transfer') || c.name.toLowerCase().includes('kebutuhan')) || categories[0];

      const createdTrx = db.createTransaction({
        user_id: userId,
        wallet_id: source_wallet_id,
        category_id: category?.id,
        type: 'expense',
        amount: parsedAmount,
        date: new Date().toISOString(),
        notes: `Transfer OVO ke ${recipient_name} (${phone_number})${notes ? ` - ${notes}` : ''}`,
        source: 'ovo',
        receipt_items: [
          {
            id: `rcp_${Date.now()}`,
            transaction_id: '',
            item_name: `Transfer OVO ke ${recipient_name} (${phone_number})`,
            price: parsedAmount,
            quantity: 1,
            category_name: 'OVO Transfer',
          },
        ],
      });

      return NextResponse.json({
        ok: true,
        message: `Transfer OVO Rp${parsedAmount.toLocaleString('id-ID')} ke ${recipient_name} (${phone_number}) BERHASIL!`,
        receipt: {
          refId,
          type: 'OVO',
          service: 'OVO Transfer Instan',
          accountNumber: phone_number,
          recipientName: recipient_name,
          amount: parsedAmount,
          adminFee: 0,
          total: parsedAmount,
          sourceWallet: sourceWallet.name,
          date: new Date().toISOString(),
          status: 'BERHASIL',
        },
        transaction: createdTrx,
      });
    }

    // 6. QUICK SETUP E-WALLET (DANA ATAU OVO)
    if (action === 'quick_setup_ewallet') {
      const { provider } = body; // 'DANA' or 'OVO'
      const isDana = provider?.toUpperCase() === 'DANA';
      const name = isDana ? 'DANA E-Wallet' : 'OVO Premier';
      const color = isDana ? '#118EEA' : '#4C3494';

      // Cek apakah sudah ada dompet dengan nama ini
      const existing = userWallets.find((w) => w.name.toLowerCase().includes(isDana ? 'dana' : 'ovo'));
      if (existing) {
        return NextResponse.json({ ok: true, wallet: existing, message: `Dompet ${existing.name} sudah tersedia di akun Anda.` });
      }

      const newWallet = db.createWallet({
        user_id: userId,
        name,
        type: 'ewallet',
        balance: 0,
        initial_balance: 0,
        is_default: false,
        color,
        icon: 'Smartphone',
      });

      return NextResponse.json({
        ok: true,
        wallet: newWallet,
        message: `Dompet ${name} berhasil ditambahkan ke daftar dompet Anda!`,
      });
    }

    return NextResponse.json({ ok: false, error: 'Aksi transfer tidak dikenali' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
