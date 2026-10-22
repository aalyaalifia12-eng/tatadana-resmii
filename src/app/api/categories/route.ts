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
    return NextResponse.json({ ok: false, error: 'Akses Ditolak: Tidak diizinkan membaca kategori pengguna lain (RLS Enforced).' }, { status: 403 });
  }

  const targetId = (session.isAdmin && requestedUserId) ? requestedUserId : session.effectiveUser.id;
  const categories = db.getCategories(targetId);
  return NextResponse.json({ ok: true, categories });
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
    const { id, monthly_budget, name, emoji } = body;

    const updated = db.updateCategory(id, {
      ...(monthly_budget !== undefined ? { monthly_budget: Number(monthly_budget) } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(emoji !== undefined ? { emoji } : {}),
    });

    return NextResponse.json({ ok: true, category: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
