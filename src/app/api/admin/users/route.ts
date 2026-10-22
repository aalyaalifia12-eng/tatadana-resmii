import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server';
import { db } from '@/lib/data/storage';

export async function GET(req: NextRequest) {
  const session = getServerSession(req);

  // STRICT: Only active admins can list users
  if (!session.isAuthenticated || !session.isAdmin || !session.actualUser) {
    return NextResponse.json(
      { error: 'Akses Ditolak: Anda tidak memiliki wewenang administrator.' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'pending', 'all', 'suspended'

  let users = db.getAllProfiles();

  if (filter === 'pending') {
    users = users.filter((u) => u.approval_status === 'pending');
  } else if (filter === 'suspended') {
    users = users.filter((u) => u.approval_status === 'suspended');
  }

  return NextResponse.json({
    ok: true,
    total: users.length,
    users,
  });
}
