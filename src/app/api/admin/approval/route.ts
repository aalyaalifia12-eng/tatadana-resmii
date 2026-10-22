import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { db } from '@/lib/data/storage';

export async function POST(req: NextRequest) {
  const session = getServerSession(req);

  // STRICT: Only active admins can execute approvals
  if (!session.isAuthenticated || !session.isAdmin || !session.actualUser) {
    return NextResponse.json(
      { error: 'Akses Ditolak: Hanya administrator berwenang yang dapat melakukan tindakan ini.' },
      { status: 403 }
    );
  }

  try {
    const { targetUserId, action, reason } = await req.json();

    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: 'targetUserId dan action wajib diisi.' },
        { status: 400 }
      );
    }

    const adminId = session.actualUser.id;
    let updatedProfile = null;

    if (action === 'approve') {
      updatedProfile = db.approveUser(targetUserId, adminId);
    } else if (action === 'reject') {
      updatedProfile = db.rejectUser(targetUserId, adminId, reason);
    } else if (action === 'suspend') {
      updatedProfile = db.suspendUser(targetUserId, adminId, reason);
    } else if (action === 'reactivate') {
      updatedProfile = db.reactivateUser(targetUserId, adminId);
    } else {
      return NextResponse.json(
        { error: `Action '${action}' tidak valid. Gunakan approve, reject, suspend, atau reactivate.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Tindakan ${action} berhasil dilakukan untuk pengguna ${updatedProfile.full_name}`,
      user: updatedProfile,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
