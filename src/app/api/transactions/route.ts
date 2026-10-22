import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';
import { getServerSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const session = getServerSession(req);

    // 1. Authentication Check
    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json(
        { ok: false, error: 'Sesi tidak valid atau belum login' },
        { status: 401 }
      );
    }

    // 2. Approval Status Check
    if (!session.isApproved) {
      if (session.isPending) {
        return NextResponse.json(
          { ok: false, error: 'Akses ditolak: Akun Anda sedang menunggu verifikasi admin.', status: 'pending' },
          { status: 403 }
        );
      }
      if (session.isRejected) {
        return NextResponse.json(
          { ok: false, error: 'Akses ditolak: Pendaftaran akun Anda telah ditolak.', status: 'rejected' },
          { status: 403 }
        );
      }
      if (session.isSuspended) {
        return NextResponse.json(
          { ok: false, error: 'Akses ditolak: Akun Anda telah dinonaktifkan.', status: 'suspended' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { ok: false, error: 'Akses ditolak: Status akun tidak valid.' },
        { status: 403 }
      );
    }

    // 3. RLS Check: User cannot inspect other users' transactions
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');

    if (requestedUserId && requestedUserId !== session.effectiveUser.id && !session.isAdmin) {
      return NextResponse.json(
        { ok: false, error: 'Akses Ditolak: Anda tidak diizinkan membaca data transaksi pengguna lain (RLS Enforced).' },
        { status: 403 }
      );
    }

    const targetUserId = (session.isAdmin && requestedUserId) ? requestedUserId : session.effectiveUser.id;

    const transactions = db.getTransactions(targetUserId);
    const wallets = db.getWallets(targetUserId);
    const categories = db.getCategories(targetUserId);
    const reports = db.getExportReports(targetUserId);

    return NextResponse.json({
      ok: true,
      transactions: transactions || [],
      wallets: wallets || [],
      categories: categories || [],
      reports: reports || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun Anda belum disetujui untuk melakukan pencatatan transaksi.' }, { status: 403 });
    }

    const body = await req.json();
    const { wallet_id, category_id, type, amount, date, notes, source, transfer_to_wallet_id } = body;

    const profile = session.effectiveUser;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Nominal transaksi harus lebih dari Rp0' }, { status: 400 });
    }

    if (!wallet_id) {
      return NextResponse.json({ error: 'Dompet wajib dipilih' }, { status: 400 });
    }

    // Verify wallet belongs to user
    const userWallets = db.getWallets(profile.id);
    if (!userWallets.some((w) => w.id === wallet_id)) {
      return NextResponse.json({ error: 'Dompet tidak valid untuk akun Anda' }, { status: 403 });
    }

    // Check Starter plan transaction limit
    if (profile.plan === 'starter' && db.countMonthlyTransactions(profile.id) >= 50) {
      return NextResponse.json(
        { error: 'Batas 50 transaksi/bulan untuk paket Starter telah tercapai. Upgrade ke Pro untuk akses tak terbatas!' },
        { status: 403 }
      );
    }

    const created = db.createTransaction({
      user_id: profile.id,
      wallet_id,
      category_id: type === 'transfer' ? undefined : category_id,
      transfer_to_wallet_id: type === 'transfer' ? transfer_to_wallet_id : undefined,
      type,
      amount: parsedAmount,
      date: date || new Date().toISOString(),
      notes: notes || '',
      source: source || 'web',
    });

    return NextResponse.json({ ok: true, transaction: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun belum disetujui' }, { status: 403 });
    }

    const body = await req.json();
    const { id, amount, notes, category_id, wallet_id, transfer_to_wallet_id, type, date } = body;

    if (!id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

    // Verify transaction owner
    const existing = db.getTransactions(session.effectiveUser.id).find((t) => t.id === id);
    if (!existing && !session.isAdmin) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan atau bukan milik akun Anda' }, { status: 404 });
    }

    const updated = db.updateTransaction(id, {
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(category_id !== undefined ? { category_id } : {}),
      ...(wallet_id !== undefined ? { wallet_id } : {}),
      ...(transfer_to_wallet_id !== undefined ? { transfer_to_wallet_id } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(date !== undefined ? { date } : {}),
    });

    if (!updated) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, transaction: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun belum disetujui' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });

    // Verify transaction owner
    const existing = db.getTransactions(session.effectiveUser.id).find((t) => t.id === id);
    if (!existing && !session.isAdmin) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan atau bukan milik akun Anda' }, { status: 404 });
    }

    const success = db.deleteTransaction(id);
    if (!success) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
