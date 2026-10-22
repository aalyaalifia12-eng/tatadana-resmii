import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { db } from '@/lib/data/storage';

export async function POST(req: NextRequest) {
  const session = getServerSession(req);

  // STRICT: Only active admins can impersonate users
  if (!session.isAuthenticated || !session.isAdmin || !session.actualUser) {
    return NextResponse.json(
      { error: 'Akses Ditolak: Hanya administrator yang dapat menggunakan fitur impersonation.' },
      { status: 403 }
    );
  }

  try {
    const { targetUserId, action } = await req.json();

    if (action === 'exit') {
      const currentImpersonated = req.cookies.get('tatadana_impersonated_user_id')?.value;
      if (currentImpersonated) {
        db.logAdminAudit(session.actualUser.id, currentImpersonated, 'IMPERSONATE_EXIT', {
          timestamp: new Date().toISOString(),
        });
      }
      const res = NextResponse.json({ ok: true, message: 'Mode impersonasi dihentikan', redirect: '/admin' });
      res.cookies.delete('tatadana_impersonated_user_id');
      return res;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId wajib diisi.' }, { status: 400 });
    }

    const targetUser = db.getProfile(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna target tidak ditemukan.' }, { status: 404 });
    }

    // STRICT: Admin cannot impersonate another admin/superadmin
    if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Tidak diizinkan melakukan impersonation terhadap sesama administrator.' },
        { status: 403 }
      );
    }

    // Audit log impersonation start
    db.logAdminAudit(session.actualUser.id, targetUserId, 'IMPERSONATE_START', {
      target_user_name: targetUser.full_name,
      target_user_email: targetUser.email,
      timestamp: new Date().toISOString(),
    });

    const res = NextResponse.json({
      ok: true,
      message: `Memulai impersonasi sebagai ${targetUser.full_name}`,
      redirect: '/dashboard',
      targetUser: {
        id: targetUser.id,
        fullName: targetUser.full_name,
        email: targetUser.email,
      },
    });

    res.cookies.set('tatadana_impersonated_user_id', targetUserId, {
      path: '/',
      maxAge: 3600, // 1 hour safety window
      sameSite: 'lax',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
