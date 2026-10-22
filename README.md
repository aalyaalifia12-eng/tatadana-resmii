# TataDana (Fintech Indonesia SaaS) 🍊🇮🇩

> **Tagline**: Catat keuangan semudah chat — langsung dari Telegram kamu.
> **Deskripsi**: TataDana adalah aplikasi manajemen keuangan pribadi yang terintegrasi dengan Telegram Bot. Pengguna dapat mencatat pemasukan dan pengeluaran langsung dari chat Telegram dengan bahasa natural atau foto struk, dan setiap transaksi otomatis tersimpan rapi dan dapat diakses kapan saja melalui dashboard web native TataDana.

---

## 🏗️ Arsitektur & Teknologi

- **Frontend & Fullstack Framework**: [Next.js 14+ (App Router)](file:///C:/Users/ALYA%20ALIFIA/.gemini/antigravity/scratch/tatadana/package.json), TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Database & Authentication**: [Supabase Postgres & Supabase Auth](file:///C:/Users/ALYA%20ALIFIA/.gemini/antigravity/scratch/tatadana/supabase/migrations/20241020000000_init_tatadana.sql), Row Level Security (RLS), Supabase Storage.
- **Telegram Bot Integration**:
  - Webhook Endpoint: `/api/telegram/webhook` dengan **Idempotency Guard** (mencegah transaksi ganda dari update_id Telegram).
  - Setup & Connection Test: `/api/telegram/test-connection` (memanggil `getMe` dan otomatis `setWebhook`).
  - Polling Dev Runner: `npm run bot:poll` (untuk pengujian lokal instan tanpa perlu public tunnel).
- **Multi-Provider AI Engine**: Google Gemini 1.5 Flash (Vision OCR Struk & Transkrip Audio), OpenAI GPT-4o-mini, dan DeepSeek dengan konfigurasi dinamis via Admin UI (mode failover & single).
- **Payment Gateway**: Midtrans (QRIS, GoPay, VA BCA/Mandiri) + Verifikasi Transfer Manual oleh Admin.
- **Timezone**: 100% menggunakan **WIB (Asia/Jakarta)**.

---

## 📁 Struktur Direktori

```
tatadana/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Landing Page (Navbar, Hero, Problem Aware, Preview, Fitur, Testimoni, Harga, FAQ, Footer)
│   │   ├── login/page.tsx               # Login Split Layout 40:60 (Phone OTP + Email)
│   │   ├── register/page.tsx            # Register + Onboarding AI Category Personalization
│   │   ├── dashboard/
│   │   │   ├── layout.tsx               # Dashboard Sidebar, Impersonation Switch, Responsive Drawer
│   │   │   ├── page.tsx                 # Beranda: 4 Stats Cards, Pie Chart, Bar Chart 6 Bulan, Trend Line, 10 Trx Terakhir
│   │   │   ├── transactions/page.tsx    # Transaksi: CRUD Pemasukan/Pengeluaran/Transfer Antar Dompet
│   │   │   ├── reports/page.tsx         # Laporan: Filter Lanjutan, Top 5 Kategori, Export On-Demand PDF & Excel (.xlsx)
│   │   │   ├── budget/page.tsx          # Budget: Visual Progress Bar (█░), Alert 80% & 100%
│   │   │   ├── wallets/page.tsx         # Multi-Wallet: Atur Default Telegram Wallet (BCA, GoPay, Cash, dll)
│   │   │   └── settings/page.tsx        # Settings: Profil, Telegram Bot (BotFather guide + Test Koneksi), Reminder (1x/2x hari)
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Superadmin Layout
│   │   │   └── page.tsx                 # Control Panel: Impersonation, Multi-AI Config, AI Logs, Manual Payments Approval, Export All Users
│   │   └── api/
│   │       ├── telegram/
│   │       │   ├── webhook/route.ts     # Webhook Telegram Publik dengan Idempotency
│   │       │   └── test-connection/route.ts # Test Koneksi getMe & setWebhook
│   │       ├── reports/export/route.ts  # Generator & Exporter Laporan PDF / Excel
│   │       └── transactions/route.ts    # Transaksi API Handler
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── parser.ts                # Natural Language Parser (Format ID: 15rb, 500k, 1.5jt)
│   │   │   ├── receipt-ocr.ts           # Vision OCR Ekstraksi Foto Struk Multi-Item
│   │   │   └── financial-advisor.ts     # AI Financial Advisor Triggers
│   │   ├── telegram/
│   │   │   ├── bot-service.ts           # Core Message Processing & Plan Limit Enforcement
│   │   │   └── formatter.ts             # Template Reply Bot Sesuai Spesifikasi Persis
│   │   ├── utils/
│   │   │   ├── currency.ts              # Format & Parser Rupiah
│   │   │   ├── date.ts                  # WIB Asia/Jakarta Date Helpers
│   │   │   └── export.ts                # jsPDF & SheetJS Excel Generators
│   │   └── data/storage.ts              # Relational State Manager & Supabase Bridge
├── supabase/
│   └── migrations/
│       └── 20241020000000_init_tatadana.sql # Skema Postgres Lengkap + RLS + Triggers
├── scripts/
│   ├── test-bot.mjs                     # Automated Validation Test Suite (25 Tests)
│   └── telegram-poll.mjs                # Local Polling Dev Runner
├── .env.example
├── package.json
└── tailwind.config.ts
```

---

## ⚡ Cara Menjalankan Aplikasi

### 1. Jalankan Development Server
```bash
npm run dev
```
Akses aplikasi di browser: `http://localhost:3000`

### 2. Jalankan Automated Test Suite
```bash
npx tsx scripts/test-bot.mjs
```
Menguji 25 skenario end-to-end:
- Parsing nominal Indonesia (`15rb`, `15ribu`, `500k`, `1.5jt`, `1,5jt`, `5jt`, `2M`)
- Struktur format balasan bot pengeluaran & pemasukan
- Webhook update_id idempotency
- AI Financial Advisor automatic triggers
- Limit paket Starter (50 trx/bulan) vs Pro (Unlimited)

### 3. Jalankan Telegram Bot Dev Polling
```bash
npm run bot:poll
```
Menerima chat Telegram secara instan dari token bot Anda tanpa perlu tunnel publik.

---

## 🛡️ Kebijakan Paket Langganan
- **Starter (Rp49.000/bln)**: Maks 50 transaksi/bln, 3 wallet, 5 budget, laporan ringkasan.
- **Pro Lifetime (Rp99.000 Sekali Bayar)**: Unlimited transaksi & wallet, Input foto struk AI OCR dengan breakdown multi-item, AI Financial Advisor, dan Export laporan PDF/Excel tanpa batas.
