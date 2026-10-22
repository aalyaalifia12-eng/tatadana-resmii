import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  const session = getServerSession(req);

  if (!session.isAuthenticated || !session.actualUser) {
    return NextResponse.json(
      { error: 'Sesi tidak valid atau belum terautentikasi' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: session.actualUser,
    effectiveUser: session.effectiveUser,
    isImpersonating: session.isImpersonating,
    isAdmin: session.isAdmin,
    isApproved: session.isApproved,
    isPending: session.isPending,
    isRejected: session.isRejected,
    isSuspended: session.isSuspended,
    profile: session.effectiveUser,
  });
}
