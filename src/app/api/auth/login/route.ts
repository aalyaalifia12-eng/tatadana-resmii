import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';

export async function POST(req: NextRequest) {
  try {
    const { email, phoneNumber, password, method } = await req.json();

    let profile = null;

    if (method === 'phone' || phoneNumber) {
      const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
      profile = db.getProfileByPhone(cleanPhone);
      if (!profile) {
        return NextResponse.json(
          { error: 'Nomor telepon tidak terdaftar.' },
          { status: 404 }
        );
      }
    } else {
      if (!email) {
        return NextResponse.json(
          { error: 'Email wajib diisi.' },
          { status: 400 }
        );
      }
      profile = db.getProfileByEmail(email.trim());
      if (!profile) {
        return NextResponse.json(
          { error: 'Kredensial tidak valid atau akun tidak ditemukan.' },
          { status: 401 }
        );
      }

      // Check password if set
      if (profile.password_hash && password && profile.password_hash !== password) {
        return NextResponse.json(
          { error: 'Kata sandi salah.' },
          { status: 401 }
        );
      }
    }

    // Server-side check of role & approval_status
    const status = profile.approval_status;
    const role = profile.role;

    // Handle different account statuses
    if (status === 'pending') {
      const res = NextResponse.json({
        ok: true,
        status: 'pending',
        role,
        redirect: '/pending-approval',
        message: 'Akun Anda sedang menunggu verifikasi admin.',
        user: {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          approvalStatus: profile.approval_status,
          role: profile.role,
        },
      });
      res.cookies.set('tatadana_user_id', profile.id, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return res;
    }

    if (status === 'rejected') {
      const res = NextResponse.json({
        ok: false,
        status: 'rejected',
        role,
        redirect: '/access-rejected',
        error: 'Permintaan akses akun Anda telah ditolak oleh administrator.',
        reason: profile.rejection_reason || 'Pendaftaran tidak memenuhi kriteria verifikasi.',
        user: {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          approvalStatus: profile.approval_status,
        },
      }, { status: 403 });
      res.cookies.set('tatadana_user_id', profile.id, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return res;
    }

    if (status === 'suspended') {
      const res = NextResponse.json({
        ok: false,
        status: 'suspended',
        role,
        redirect: '/access-suspended',
        error: 'Akun Anda telah dinonaktifkan oleh administrator.',
        reason: profile.rejection_reason || 'Akun dinonaktifkan sementara.',
        user: {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          approvalStatus: profile.approval_status,
        },
      }, { status: 403 });
      res.cookies.set('tatadana_user_id', profile.id, {
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return res;
    }

    if (status !== 'approved') {
      return NextResponse.json(
        { error: 'Status akun tidak valid. Akses ditolak secara aman.' },
        { status: 403 }
      );
    }

    // Status is 'approved'
    // Determine destination by role
    let redirectUrl = '/dashboard';
    if (role === 'admin' || role === 'superadmin') {
      redirectUrl = '/admin';
    }

    const res = NextResponse.json({
      ok: true,
      status: 'approved',
      role,
      redirect: redirectUrl,
      user: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
        approvalStatus: profile.approval_status,
      },
    });

    res.cookies.set('tatadana_user_id', profile.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    // Clear any previous impersonation cookie on new login
    res.cookies.delete('tatadana_impersonated_user_id');

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
