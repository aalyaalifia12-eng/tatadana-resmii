import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { db } from '@/lib/data/storage';

export async function GET(req: NextRequest) {
  const session = getServerSession(req);

  if (!session.isAuthenticated || !session.effectiveUser) {
    return NextResponse.json(
      { error: 'Akses ditolak: Anda belum terautentikasi.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get('userId');

  // RLS CHECK: Regular user can only view their own profile
  if (requestedUserId && requestedUserId !== session.effectiveUser.id && !session.isAdmin) {
    return NextResponse.json(
      { error: 'Akses Ditolak: Anda tidak diizinkan membaca data pengguna lain (RLS Enforced).' },
      { status: 403 }
    );
  }

  const targetId = requestedUserId || session.effectiveUser.id;
  const profile = db.getProfile(targetId);

  if (!profile) {
    return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PUT(req: NextRequest) {
  const session = getServerSession(req);

  if (!session.isAuthenticated || !session.actualUser) {
    return NextResponse.json(
      { error: 'Akses ditolak: Anda belum terautentikasi.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, role, approval_status, approved_by, approved_at, full_name, avatar_url, phone_number, reminder_times, reminder_frequency } = body;

    const targetUserId = userId || session.effectiveUser?.id;

    // RLS CHECK: User cannot modify other user's profile unless admin
    if (targetUserId !== session.actualUser.id && !session.isAdmin) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Anda tidak diizinkan memodifikasi profil pengguna lain.' },
        { status: 403 }
      );
    }

    // PRIVILEGE ESCALATION CHECK: Non-admin CANNOT modify role or approval_status
    if ((role !== undefined || approval_status !== undefined || approved_by !== undefined || approved_at !== undefined) && !session.isAdmin) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Pengguna biasa tidak memiliki izin mengubah role atau status persetujuan akun.' },
        { status: 403 }
      );
    }

    const updates: any = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (phone_number !== undefined) updates.phone_number = phone_number;
    if (reminder_times !== undefined) updates.reminder_times = reminder_times;
    if (reminder_frequency !== undefined) updates.reminder_frequency = reminder_frequency;

    // Only admin can apply role or status changes
    if (session.isAdmin) {
      if (role !== undefined) updates.role = role;
      if (approval_status !== undefined) updates.approval_status = approval_status;
    }

    const updated = db.updateProfile(targetUserId, updates, session.actualUser.id);
    return NextResponse.json({ ok: true, profile: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
