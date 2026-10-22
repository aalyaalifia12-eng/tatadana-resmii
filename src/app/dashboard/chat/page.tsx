'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Wallet,
  ArrowRightLeft,
  QrCode,
  CheckCircle2,
  Trash2,
  HelpCircle,
  TrendingUp,
  Smartphone,
  CreditCard,
  Target,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  cardType?: string;
  data?: any;
  quickReplies?: string[];
}

export default function ChatBotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        id: 'init_welcome',
        sender: 'bot',
        text: `Halo! 👋 Selamat datang di **TataDana AI Financial Assistant**.\n\nSaya asisten cerdas yang terhubung langsung dengan dompet dan anggaran Anda. Anda bisa mencatat transaksi hanya dengan mengetik bahasa santai, cek saldo, memantau pagu budget, atau melakukan transfer ke **DANA, OVO, dan QRIS**.\n\nApa yang ingin Anda lakukan hari ini?`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        quickReplies: [
          '👛 Cek Saldo Dompet',
          '🎯 Cek Sisa Budget',
          '📱 Transfer DANA',
          '🟣 Transfer OVO',
          '💳 Bayar QRIS',
          '💡 Tips Hemat',
        ],
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (data.ok && data.reply) {
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: data.reply.text,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          cardType: data.reply.cardType,
          data: data.reply.data,
          quickReplies: data.reply.quickReplies,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'bot',
            text: `Maaf, kendala: ${data.error || 'Gagal memproses pesan.'}`,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'bot',
          text: 'Maaf, gagal menghubungi server TataDana AI. Periksa koneksi internet Anda.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Bersihkan riwayat percakapan?')) {
      setMessages([
        {
          id: 'cleared',
          sender: 'bot',
          text: 'Riwayat percakapan telah dibersihkan. Ada yang ingin Anda catat atau tanyakan sekarang? 😊',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          quickReplies: ['Cek Saldo', 'Transfer DANA', 'Bayar QRIS', 'Beli Kopi 25rb'],
        },
      ]);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* CHAT HEADER */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                Asisten AI Keuangan TataDana
              </h1>
              <span className="text-[11px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>Aktif & Terhubung</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Pencatatan natural, cek saldo, dan transfer instan QRIS &bull; DANA &bull; OVO
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/transfer"
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Layanan Transfer</span>
          </Link>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Bersihkan Percakapan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div className="flex items-end space-x-2.5 max-w-2xl">
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 mb-1 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`rounded-3xl px-5 py-4 leading-relaxed ${
                    isUser
                      ? 'bg-orange-500 text-white rounded-br-none shadow-md shadow-orange-500/10'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">{m.text}</div>

                  {/* INTERACTIVE CARD: TRANSACTION SUCCESS */}
                  {m.cardType === 'transaction_success' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Transaksi Masuk ke Buku Kas</span>
                      </div>
                      <Link
                        href="/dashboard/transactions"
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                      >
                        <span>Cek Riwayat</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {/* INTERACTIVE CARD: TRANSFER ACTION */}
                  {m.cardType === 'transfer_action' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <Link
                        href="/dashboard/transfer"
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-sm transition-all text-xs"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Buka Menu Transfer ({m.data?.method})</span>
                      </Link>
                    </div>
                  )}

                  {/* INTERACTIVE CARD: BALANCE OVERVIEW */}
                  {m.cardType === 'balance_overview' && m.data?.wallets && (
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      {m.data.wallets.map((w: any) => (
                        <div key={w.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[11px] font-bold text-slate-500">{w.name}</p>
                          <p className="text-xs font-extrabold text-slate-900 mt-0.5">{formatRupiah(w.balance)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-slate-400 px-10">{m.timestamp}</span>

              {/* QUICK REPLIES */}
              {!isUser && m.quickReplies && m.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 px-10 pt-1">
                  {m.quickReplies.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="px-3.5 py-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-full text-xs font-semibold transition-all shadow-xs"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs px-10 py-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></div>
            <span className="animate-pulse font-semibold">TataDana AI sedang memproses...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* QUICK PROMPTS & CHAT INPUT */}
      <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 space-y-3">
        {/* Suggestion Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Contoh:</span>
          </span>
          {[
            'Beli bakso 15rb',
            'Kopi susu 25k',
            'Transfer DANA 50rb',
            'Transfer OVO 100rb',
            'Bayar QRIS 35rb',
            'Gajian 5jt',
            'Cek Saldo',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 bg-slate-100 hover:bg-orange-100/70 text-slate-700 hover:text-orange-700 rounded-full font-medium shrink-0 transition-colors text-xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* INPUT BOX */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik pesan: 'makan siang 35rb', 'transfer dana 50rb', 'cek budget'..."
            className="flex-1 px-5 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none transition-all placeholder:text-slate-400 shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white rounded-2xl font-bold flex items-center space-x-2 transition-all shadow-md shadow-orange-500/20 disabled:shadow-none"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
}
