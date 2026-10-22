import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true, message: 'Berhasil logout' });
  res.cookies.set('tatadana_user_id', '', { path: '/', maxAge: 0 });
  res.cookies.set('tatadana_impersonated_user_id', '', { path: '/', maxAge: 0 });
  return res;
}
