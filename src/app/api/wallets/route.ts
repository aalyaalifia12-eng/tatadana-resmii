import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';
import { getServerSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  const session = getServerSession(req);

  if (!session.isAuthenticated || !session.effectiveUser) {
    return NextResponse.json({ ok: false, error: 'Sesi tidak valid atau belum login' }, { status: 401 });
  }

  if (!session.isApproved) {
    return NextResponse.json({ ok: false, error: 'Akun Anda belum disetujui.', status: session.effectiveUser.approval_status }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get('userId');

  // RLS check
  if (requestedUserId && requestedUserId !== session.effectiveUser.id && !session.isAdmin) {
    return NextResponse.json({ ok: false, error: 'Akses Ditolak: Tidak diizinkan membaca wallet pengguna lain (RLS Enforced).' }, { status: 403 });
  }

  const targetId = (session.isAdmin && requestedUserId) ? requestedUserId : session.effectiveUser.id;
  const wallets = db.getWallets(targetId);
  return NextResponse.json({ ok: true, wallets });
}

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun Anda belum disetujui.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, type, balance, initial_balance, is_default, color, icon } = body;

    const newWallet = db.createWallet({
      user_id: session.effectiveUser.id,
      name,
      type: type || 'bank',
      balance: Number(balance) || 0,
      initial_balance: Number(initial_balance) || 0,
      is_default: !!is_default,
      color: color || '#F97316',
      icon: icon || 'Wallet',
    });

    return NextResponse.json({ ok: true, wallet: newWallet });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun Anda belum disetujui.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, is_default, name } = body;

    // Verify ownership
    const userWallets = db.getWallets(session.effectiveUser.id);
    if (!userWallets.some((w) => w.id === id) && !session.isAdmin) {
      return NextResponse.json({ error: 'Wallet tidak ditemukan atau bukan milik akun Anda' }, { status: 404 });
    }

    const updated = db.updateWallet(id, {
      ...(is_default !== undefined ? { is_default } : {}),
      ...(name !== undefined ? { name } : {}),
    });

    return NextResponse.json({ ok: true, wallet: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
