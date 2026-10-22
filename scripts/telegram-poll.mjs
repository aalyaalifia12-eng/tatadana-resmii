/**
 * TataDana Telegram Live Polling Runner
 * Connects the real Telegram Bot (@tatadana_alya_bot) to TataDana
 */

import fs from 'fs';
import path from 'path';

// 1. Read token from .env.local or process.env
let token = process.env.TELEGRAM_BOT_TOKEN;

if (!token || token === 'demo_test_token') {
  try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/TELEGRAM_BOT_TOKEN=["']?([^"'\r\n]+)["']?/);
      if (match) token = match[1];
    }
  } catch (err) {
    console.error('Failed to read .env.local:', err.message);
  }
}

if (!token || token === 'demo_test_token') {
  token = '8689409197:AAEZ6PBWclzaozjRiN91vBqD4LEaonpIg1Y';
}

console.log('====================================================');
console.log('🤖 TATADANA TELEGRAM BOT LIVE POLLING RUNNER');
console.log('====================================================');
console.log(`Bot Token: ${token.substring(0, 10)}... (aktif)`);
console.log('Mendengarkan chat masuk dari Telegram secara realtime...\n');

let offset = 0;

async function poll() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        const msgText = update.message?.text || (update.message?.photo ? '[Foto Struk]' : '[Pesan Media]');
        const sender = update.message?.from?.first_name || 'User';

        console.log(`📩 Pesan masuk dari ${sender}: "${msgText}" (Update ID: ${update.update_id})`);

        // Forward to Next.js webhook endpoint
        try {
          const webhookRes = await fetch('http://localhost:3000/api/telegram/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });
          const webhookData = await webhookRes.json();
          if (webhookData.ok && webhookData.result) {
            console.log(`✅ Diproses berhasil oleh TataDana. Balasan terkirim ke Telegram.`);
          }
        } catch (postErr) {
          console.error('Error forwarding to webhook:', postErr.message);
        }
      }
    }
  } catch (err) {
    // Silent catch network blips
  }

  setTimeout(poll, 1000);
}

poll();
