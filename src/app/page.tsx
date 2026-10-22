'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  MessageSquare,
  Camera,
  Bot,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Play,
  Wallet,
  Receipt,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'lifetime'>('lifetime');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Demo State
  const [demoInput, setDemoInput] = useState('beli bakso 15rb');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'user', text: 'beli bakso 15rb' },
    {
      sender: 'bot',
      text: `📅 Selasa, 20 Oktober 2026 — 13:45 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp15.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 BCA Utama
├ Catatan : beli bakso
└ Saldo : Rp14.485.000

📊 Budget Makanan & Minuman bulan ini:
█████░░░░░ 52% — sisa Rp1.200.000
💡 Budget masih aman, tetap pertahankan gaya hidup hematmu!`,
    },
  ]);

  const handleSendDemo = () => {
    if (!demoInput.trim()) return;
    const userText = demoInput.trim();
    const newMessages = [...chatMessages, { sender: 'user' as const, text: userText }];

    // Realistic bot response simulation for interactive demo
    let reply = '';
    if (userText.toLowerCase().includes('gaji') || userText.toLowerCase().includes('5jt')) {
      reply = `📅 Selasa, 20 Oktober 2026 — 13:46 WIB
💰 Pemasukan tercatat!
├ Nominal : Rp5.000.000
├ Kategori : 💼 Pemasukan
├ Dompet : 👛 BCA Utama
└ Saldo baru : Rp19.485.000

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;
    } else {
      reply = `📅 Selasa, 20 Oktober 2026 — 13:46 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp25.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 BCA Utama
├ Catatan : ${userText}
└ Saldo : Rp14.460.000

📊 Budget Makanan & Minuman bulan ini:
██████░░░░ 56% — sisa Rp1.175.000`;
    }

    newMessages.push({ sender: 'bot', text: reply });
    setChatMessages(newMessages);
    setDemoInput('');
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-orange-500/20">
              TD
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">Tata<span className="text-orange-500">Dana</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                Fintech Indonesia
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#fitur" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Cara Kerja</a>
            <a href="#harga" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">Harga</a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-orange-500 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-orange-500 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-sm shadow-orange-500/25 transition-all transform active:scale-95"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-gradient-to-b from-orange-50/50 via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pre-headline Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-orange-100/70 border border-orange-200 text-orange-700 text-xs sm:text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Catat keuangan langsung dari Telegram kamu</span>
          </div>

          {/* Headline H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6 max-w-4xl mx-auto">
            Gaji habis sebelum akhir bulan?{' '}
            <span className="text-tatadana-gradient">
              Sudah saatnya kamu tahu ke mana uangmu pergi.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya sistem kami yang urus dan sajikan rapi di dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
            >
              <span>Mulai Gratis Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#demo-interaktif"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Lihat cara kerjanya</span>
              <span>→</span>
            </a>
          </div>

          {/* HERO VIDEO / INTERFACE PREVIEW PLACEHOLDER */}
          {/* TODO: ganti dengan video asli demo interaksi Telegram saat beta user launch */}
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white p-2">
            <div className="aspect-video bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-xl flex flex-col items-center justify-center text-white relative group cursor-pointer">
              <div className="w-20 h-20 rounded-full bg-orange-500/90 flex items-center justify-center text-white shadow-xl shadow-orange-500/40 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1 fill-white" />
              </div>
              <p className="mt-4 font-semibold text-lg text-slate-200">
                Tonton Demo: Ketik &quot;beli bakso 15rb&quot; &rarr; Laporan Otomatis
              </p>
              <p className="text-xs text-slate-400 mt-1">[Placeholder Video Showcase]</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM AWARE SECTION */}
      <section className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-2">Kenapa Sulit Mengatur Keuangan?</h2>
            <p className="text-3xl font-extrabold text-slate-900">Kebiasaan lama yang bikin uang menguap tanpa jejak</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl mb-6">
                ⏳
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">&quot;Buka aplikasi keuangan? Nanti dulu deh...&quot;</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aplikasi finance biasa terlalu ribet: harus login, pilih kategori bertingkat, pilih akun bank. Akhirnya malas dan tak pernah dicatat.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mb-6">
                💸
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">&quot;Kok uangnya habis ya? Padahal kayak tidak beli apa-apa&quot;</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kopi 25rb, jajan 15rb, parkir 5rb. Pengeluaran receh yang tak disadari ini justru jadi kebocoran terbesar dompetmu setiap hari.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-2xl mb-6">
                🎯
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">&quot;Udah niat bikin budget, tapi seminggu kemudian lupa&quot;</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Budget tanpa reminder dan peringatan real-time sama saja sia-sia. Kamu baru sadar saat saldo rekening sudah menipis di tanggal tua.
              </p>
            </div>
          </div>

          {/* Transition to Solution */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-orange-200 text-center shadow-lg shadow-orange-500/5 relative overflow-hidden">
            <div className="max-w-2xl mx-auto">
              <p className="text-orange-600 font-bold text-lg mb-2">Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?</p>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mb-4">
                Introducing <span className="text-orange-500">TataDana</span>
              </h3>
              <p className="text-slate-600 text-base leading-relaxed mb-6">
                Cukup buka Telegram yang sudah kamu buka setiap hari. Ketik &quot;kopi 25rb&quot; atau jepret struk belanjaanmu. TataDana yang mengkategorikan, mengkalkulasi saldo, dan mengingatkan batas budgetmu secara otomatis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DASHBOARD & TELEGRAM PREVIEW */}
      <section id="demo-interaktif" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-2">Coba Langsung Tanpa Install</h2>
            <p className="text-3xl font-extrabold text-slate-900">Interaksi Nyata Bot Telegram TataDana</p>
            <p className="text-sm text-slate-500 mt-2">Ketik kalimat transaksimu di bawah dan lihat bagaimana bot membalas secara instan.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Telegram Phone Simulator (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl border-4 border-slate-800">
              <div className="bg-[#17212B] rounded-[2rem] h-[540px] flex flex-col overflow-hidden text-white">
                {/* Telegram Header */}
                <div className="bg-[#242F3D] px-4 py-3 flex items-center space-x-3 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">
                    TD
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">TataDana Bot</p>
                    <p className="text-xs text-orange-400">bot aktif • WIB</p>
                  </div>
                </div>

                {/* Telegram Chat Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#2B5278] text-white rounded-br-none'
                            : 'bg-[#242F3D] text-slate-100 rounded-bl-none border border-slate-700/60 font-mono text-[11px]'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Simulator */}
                <div className="p-3 bg-[#242F3D] flex items-center space-x-2 border-t border-slate-700">
                  <input
                    type="text"
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendDemo()}
                    placeholder="Ketik: 'makan bakso 20rb'..."
                    className="flex-1 bg-[#17212B] text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={handleSendDemo}
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Web Dashboard Mirror (7 Cols) */}
            <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Mirror Dashboard Real-Time</h3>
                  <p className="text-xs text-slate-500">Otomatis terupdate begitu ada transaksi masuk dari Telegram</p>
                </div>
                <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Supabase Live</span>
                </span>
              </div>

              {/* 4 Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Saldo Total</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">Rp15.670.000</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Pemasukan</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">+Rp18.500.000</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Pengeluaran</p>
                  <p className="text-sm font-bold text-red-600 mt-1">-Rp2.830.000</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-medium text-slate-500">Sisa Budget</p>
                  <p className="text-sm font-bold text-orange-600 mt-1">Rp5.170.000</p>
                </div>
              </div>

              {/* Recent Transaction Preview List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Catatan Terakhir Masuk</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🍜</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Makan siang Nasi Padang</p>
                        <p className="text-[11px] text-slate-400">via Telegram Bot • BCA Utama</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-600">-Rp45.000</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">💰</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Gaji Bulanan</p>
                        <p className="text-[11px] text-slate-400">via Web • BCA Utama</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">+Rp18.500.000</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🚗</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Gojek ke kantor</p>
                        <p className="text-[11px] text-slate-400">via Voice Note • GoPay</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-600">-Rp32.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3 FITUR UTAMA (Alternating Layout) */}
      <section id="fitur" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Fitur 1: Catat via Telegram Teks & Foto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                Catat Langsung dari Telegram. Teks, Voice Note, atau Foto Struk.
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Didukung LLM terstruktur yang memahami bahasa sehari-hari orang Indonesia. Tulis &quot;15rb&quot;, &quot;500k&quot;, atau &quot;1.5jt&quot; — semua diproses sempurna. Untuk struk belanja bertingkat, AI Vision mengekstrak setiap item secara rinci.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Parsing nominal format lokal: rb, k, jt, juta</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Deteksi foto struk belanjaan otomatis (Paket Pro)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dukungan pesan suara (voice note) dengan auto-transkrip</span>
                </li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="font-bold text-orange-800">📸 Scan Struk Indomaret</p>
                  <p className="text-orange-700 mt-1">3 item terbaca: Kopi Kenangan, Roti Gandum, Tissue Paseo &rarr; Total Rp48.500</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="font-bold text-slate-800">🎙️ Voice Note (Transkrip: &quot;Gojek 32 ribu&quot;)</p>
                  <p className="text-slate-600 mt-1">Kategori: 🚗 Transportasi &bull; Dompet: GoPay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur 2: Laporan & Export On-Demand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs font-bold text-slate-800">Ekspor Laporan On-Demand</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Siap Unduh</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">TataDana_Laporan_Oktober.xlsx</p>
                    <p className="text-[11px] text-slate-500">2 Sheet: Ringkasan + Transaksi Rinci</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <PieChart className="w-8 h-8 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">TataDana_Laporan_Finansial.pdf</p>
                    <p className="text-[11px] text-slate-500">Format resmi A4 lengkap kop & tabel</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-6">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                Laporan & Export Otomatis di Dashboard TataDana
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Tidak perlu pusing membuat rumus Excel manual. Buka dashboard native TataDana kapan saja, filter berdasarkan rentang tanggal, kategori, atau dompet, lalu unduh laporan berformat PDF dan Excel dalam 1 klik.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Download file PDF resmi dan Excel .xlsx on-demand</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Penyimpanan riwayat export tersimpan rapi</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tampilan rincian per item dari transaksi foto struk</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Fitur 3: AI Financial Advisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">
                AI Financial Advisor Pribadi
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Bukan sekadar mencatat angka. AI TataDana memantau ritme keuanganmu di latar belakang. Jika pengeluaran kopi melonjak &gt;50% dibanding minggu lalu atau budgetmu terancam jebol, AI langsung memberikan saran actionable via Telegram.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Deteksi lonjakan pengeluaran kategori tak wajar</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Alert rasio pengeluaran ketika melebihi 80% gaji</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Saran penghematan cerdas yang realistis dan aplikatif</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#242F3D] text-white p-6 rounded-2xl border border-slate-700 shadow-xl font-mono text-xs">
              <p className="text-orange-400 font-bold mb-2">🤖 Financial Advisor</p>
              <p className="text-slate-200 leading-relaxed">
                Hei Budi! Pengeluaranmu di kategori Makanan & Minuman minggu ini naik 65% dibanding minggu lalu (Total: Rp950.000).
              </p>
              <div className="mt-3 p-3 bg-[#17212B] rounded-xl border border-slate-700">
                <p className="text-amber-400 font-bold">💡 Saran:</p>
                <p className="text-slate-300 mt-1">
                  Coba kurangi pesanan delivery online selama 4 hari ke depan agar sisa budgetmu tetap aman hingga akhir bulan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS (Masonry Grid Placeholder) */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-2">Cerita Pengguna</h2>
            <p className="text-3xl font-extrabold text-slate-900">Dipercaya Karyawan, Freelancer, & Mahasiswa</p>
            <p className="text-xs text-slate-400 mt-1">[Placeholder Testimoni untuk Launching Beta User]</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimoni 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                &quot;Dulu aplikasi keuangan saya tinggalkan setelah 3 hari karena capek input kategori satu per satu. Pakai TataDana tinggal ketik di Telegram pas lagi bayar parkir atau makan siang. Sekarang tahu persis gaji lari ke mana.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center">
                  AR
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Andi Ramadhan</p>
                  <p className="text-[11px] text-slate-500">Software Engineer, Jakarta</p>
                </div>
              </div>
            </div>

            {/* Testimoni 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                &quot;Fitur foto struk di paket Pro benar-benar penyelamat. Beli belanjaan dapur di supermarket isi belasan item langsung otomatis terekam rapi tanpa ngetik apa pun.&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center">
                  SL
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Sarah Lestari</p>
                  <p className="text-[11px] text-slate-500">Freelance Designer, Bandung</p>
                </div>
              </div>
            </div>

            {/* Testimoni 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                &quot;AI Advisor-nya tepat sasaran. Pernah diingatkan kalau jajan kopi sudah 80% dari alokasi budget bulanan padahal baru tanggal 15. Sangat membantu berhemat!&quot;
              </p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-200 text-orange-800 font-bold flex items-center justify-center">
                  DW
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Dimas Wicaksono</p>
                  <p className="text-[11px] text-slate-500">Mahasiswa, Yogyakarta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="harga" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-2">Pilihan Paket Transparan</h2>
            <p className="text-3xl font-extrabold text-slate-900">Investasi Kecil untuk Finansial yang Terkontrol</p>
            <p className="text-sm text-slate-600 mt-2">Dukung pembayaran via Midtrans (QRIS, GoPay, Virtual Account) & Transfer Manual.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                  Starter
                </span>
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-slate-900">Rp49.000</span>
                  <span className="text-slate-500 text-sm">/bulan</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Cocok untuk pencatatan transaksi dasar sehari-hari.</p>

                <div className="my-8 border-t border-slate-100 pt-6 space-y-3.5 text-sm text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Catat transaksi via teks Telegram</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Dashboard web lengkap real-time</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Maksimal 50 transaksi / bulan</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Maksimal 3 dompet & 5 kategori budget</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-400">
                    <span className="w-4 h-4 flex items-center justify-center font-bold">✕</span>
                    <span className="line-through">Input foto struk AI OCR</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-400">
                    <span className="w-4 h-4 flex items-center justify-center font-bold">✕</span>
                    <span className="line-through">AI Financial Advisor</span>
                  </div>
                  <div className="flex items-center space-x-2.5 text-slate-400">
                    <span className="w-4 h-4 flex items-center justify-center font-bold">✕</span>
                    <span className="line-through">Export Laporan PDF/Excel</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register?plan=starter"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Pilih Starter
              </Link>
            </div>

            {/* Pro Plan (Best Value) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-orange-500 shadow-xl shadow-orange-500/10 flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                Paling Populer &bull; Sekali Bayar
              </div>

              <div>
                <span className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                  Pro Lifetime
                </span>
                <div className="mt-4 flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-slate-900">Rp99.000</span>
                  <span className="text-orange-600 font-semibold text-xs px-2 py-0.5 bg-orange-50 rounded-md">Sekali Bayar</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Akses penuh selamanya tanpa biaya langganan bulanan.</p>

                <div className="my-8 border-t border-slate-100 pt-6 space-y-3.5 text-sm text-slate-700">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">Unlimited Transaksi, Dompet & Kategori</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-900">Input via Foto Struk AI OCR</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Laporan Lengkap & Filter Lanjutan</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Export Unlimited ke PDF & Excel (.xlsx)</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>AI Financial Advisor aktif otomatis</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Reminder Custom (maks 2x sehari)</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Prioritas Support & WhatsApp Care</span>
                  </div>
                </div>
              </div>

              <Link
                href="/register?plan=pro"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-center text-white bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/25 transition-all"
              >
                Dapatkan Akses Pro Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION (7 Pertanyaan Relevan) */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-orange-600 tracking-wider uppercase mb-2">Pertanyaan Umum</h2>
            <p className="text-3xl font-extrabold text-slate-900">Semua yang Perlu Kamu Ketahui</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Apakah saya bisa menggunakan input foto struk di paket Starter?',
                a: 'Tidak. Fitur scan foto struk menggunakan komputasi AI Vision tingkat lanjut untuk membaca setiap rincian belanjaan, sehingga fitur ini eksklusif untuk pengguna paket Pro.',
              },
              {
                q: 'Bagaimana keamanan dan privasi data transaksi saya di TataDana?',
                a: 'Keamanan data Anda adalah prioritas utama kami. Semua data disimpan di database Supabase terenkripsi dengan proteksi Row Level Security (RLS) ketat — artinya hanya akun Anda yang memiliki akses ke transaksi Anda. Akses tim admin untuk keperluan teknis tercatat lengkap dalam audit log privasi.',
              },
              {
                q: 'Apakah 1 bot Telegram digunakan bersama atau 1 bot per user?',
                a: 'TataDana menggunakan 1 bot resmi bersama yang mengenali akun Anda melalui user ID atau nomor HP terverifikasi saat pendaftaran. Anda juga memiliki opsi untuk menghubungkan bot pribadi sendiri via token BotFather.',
              },
              {
                q: 'Metode pembayaran apa saja yang didukung?',
                a: 'Kami bekerjasama resmi dengan Midtrans untuk memproses pembayaran otomatis lewat QRIS (semua e-wallet dan m-banking), GoPay, ShopeePay, dan Virtual Account BCA/Mandiri/BRI/BNI. Kami juga menyediakan opsi transfer manual dengan konfirmasi admin.',
              },
              {
                q: 'Apakah format nominal seperti "15rb", "500k", dan "1.5jt" bisa langsung dikenali?',
                a: 'Ya! TataDana didesain khusus 100% untuk kebiasaan orang Indonesia. Anda cukup mengetik "beli bakso 15rb", "kopi 25k", atau "gajian 5jt", dan AI kami akan langsung mengekstrak nominal dan kategorinya.',
              },
              {
                q: 'Bagaimana cara menghubungkan Telegram bot ke akun TataDana saya?',
                a: 'Sangat mudah! Setelah membuat akun, buka halaman Settings -> Tab Telegram Bot. Masukkan nomor HP atau token bot Anda, klik "Test Koneksi", dan bot langsung aktif terhubung dalam hitungan detik.',
              },
              {
                q: 'Apakah laporan keuangan bisa diexport ke file PDF dan Excel?',
                a: 'Bisa! Di paket Pro, Anda dapat mengekspor laporan transaksi untuk rentang tanggal custom langsung dari dashboard ke format PDF berdesain rapi atau file Excel (.xlsx) dengan pembagian sheet ringkasan dan rincian transaksi.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-orange-300 transition-colors"
                onClick={() => toggleFaq(idx)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base pr-4">{faq.q}</h4>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${openFaq === idx ? 'rotate-180 text-orange-500' : ''}`}
                  />
                </div>
                {openFaq === idx && (
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-tr from-orange-600 to-orange-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Mulai kendalikan keuanganmu hari ini
          </h2>
          <p className="text-orange-100 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Tidak ada lagi cerita gaji menguap tanpa jejak di pertengahan bulan. Gabung bersama ribuan pengguna cerdas lainnya di TataDana.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-base"
          >
            <span>Daftar Gratis Sekarang</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* 10. FOOTER (4 Columns) */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-xl mb-4">
              <span className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-bold">TD</span>
              <span>Tata<span className="text-orange-500">Dana</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Catat keuangan semudah chat — langsung dari Telegram kamu. Terintegrasi penuh dengan Supabase, Midtrans, dan AI terkemuka.
            </p>
            <p className="text-xs text-slate-500">&copy; 2026 PT Tata Data Indonesia. All rights reserved.</p>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Produk</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#fitur" className="hover:text-white transition-colors">Telegram Bot Finansial</a></li>
              <li><a href="#demo-interaktif" className="hover:text-white transition-colors">AI Receipt OCR Scan</a></li>
              <li><a href="#fitur" className="hover:text-white transition-colors">Laporan & Ekspor PDF/Excel</a></li>
              <li><a href="#fitur" className="hover:text-white transition-colors">AI Financial Advisor</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Perusahaan</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Tentang TataDana</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Panduan Literasi Keuangan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Karier & Lowongan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hubungi Tim Kami</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legalitas</h5>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Keamanan Data Supabase</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bantuan Telegram (@BotSupport)</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
