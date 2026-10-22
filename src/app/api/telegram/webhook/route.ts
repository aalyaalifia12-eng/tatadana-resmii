import { NextRequest, NextResponse } from 'next/server';
import { processTelegramUpdate } from '@/lib/telegram/bot-service';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8689409197:AAEZ6PBWclzaozjRiN91vBqD4LEaonpIg1Y';

    const result = await processTelegramUpdate(update, botToken);

    if (result && result.replyText && botToken && botToken !== 'demo_test_token') {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: result.chatId,
            text: result.replyText,
          }),
        });
      } catch (sendErr) {
        console.error('Failed to send telegram reply to user:', sendErr);
      }
    }

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error('Error handling Telegram webhook:', error);
    // Always return 200 to Telegram so it doesn't repeatedly retry on application error
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'TataDana Telegram Webhook Endpoint',
    status: 'active',
    timezone: 'Asia/Jakarta (WIB)',
  });
}
