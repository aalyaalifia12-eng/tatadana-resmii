import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phoneNumber, password, plan } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Nama lengkap dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';

    // Check if email already registered
    const existingEmail = db.getProfileByEmail(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email ini sudah terdaftar. Silakan login ke akun Anda.' },
        { status: 409 }
      );
    }

    // Check if phone already registered (if provided)
    if (cleanPhone) {
      const existingPhone = db.getProfileByPhone(cleanPhone);
      if (existingPhone) {
        return NextResponse.json(
          { error: 'Nomor telepon ini sudah terdaftar.' },
          { status: 409 }
        );
      }
    }

    // STRICT: Create completely fresh user with role = 'user' and approval_status = 'pending'
    const newProfile = db.createUserAccount({
      fullName: fullName.trim(),
      email: cleanEmail,
      phoneNumber: cleanPhone,
      password: password || 'password123',
      plan: plan === 'pro' ? 'pro' : 'starter',
    });

    const response = NextResponse.json({
      ok: true,
      message: 'Akun kamu berhasil didaftarkan dan sedang menunggu verifikasi admin. Kamu akan mendapatkan akses setelah akun disetujui.',
      status: 'pending',
      user: {
        id: newProfile.id,
        fullName: newProfile.full_name,
        email: newProfile.email,
        phoneNumber: newProfile.phone_number,
        approvalStatus: newProfile.approval_status,
        role: newProfile.role,
        createdAt: newProfile.created_at,
      },
      redirect: '/pending-approval',
    });

    // Set cookie so user can access the pending page with their profile context
    response.cookies.set('tatadana_user_id', newProfile.id, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
