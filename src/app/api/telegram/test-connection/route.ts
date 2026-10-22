import { NextRequest, NextResponse } from 'next/server';
import { testTelegramBotConnection } from '@/lib/telegram/bot-service';
import { db } from '@/lib/data/storage';

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ ok: false, error: 'Token bot tidak boleh kosong.' }, { status: 400 });
    }

    const cleanToken = token.trim();

    // 1. Uniqueness check: Ensure token is not registered by another user
    const allProfiles = db.getAllProfiles();
    const duplicate = allProfiles.find((p) => p.telegram_bot_token === cleanToken && p.id !== userId);
    if (duplicate) {
      return NextResponse.json(
        { ok: false, error: 'Token ini sudah digunakan oleh akun TataDana lain. Silakan buat bot baru di @BotFather.' },
        { status: 400 }
      );
    }

    // 2. Call Telegram getMe and setWebhook
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const connectionResult = await testTelegramBotConnection(cleanToken, webhookBaseUrl);

    if (!connectionResult.ok) {
      return NextResponse.json(
        { ok: false, error: connectionResult.error || 'Token salah atau tidak dikenali oleh Telegram.' },
        { status: 400 }
      );
    }

    // 3. Update Profile status and save token
    if (userId) {
      db.updateProfile(userId, {
        telegram_bot_token: cleanToken,
        telegram_connected: true,
        telegram_username: connectionResult.botInfo?.username,
      });
    }

    return NextResponse.json({
      ok: true,
      bot: connectionResult.botInfo,
      webhookSet: connectionResult.webhookSet,
      message: 'Koneksi Telegram Bot berhasil diaktifkan!',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
