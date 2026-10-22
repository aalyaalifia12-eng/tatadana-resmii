'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  ChevronDown,
  RefreshCw,
  Wallet,
  ArrowRightLeft,
  QrCode,
  CheckCircle2,
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

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length === 0) {
      // Welcome message
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: `Halo! 👋 Saya **Asisten AI TataDana**.\n\nKamu bisa mencatat keuangan semudah mengetik chat (*"beli boba 25rb"*), transfer ke **DANA/OVO**, bayar **QRIS**, atau cek saldo langsung di sini!`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          quickReplies: ['Cek Saldo', 'Transfer DANA', 'Bayar QRIS', 'Beli Kopi 25rb'],
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
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
            text: `Maaf, terjadi kendala: ${data.error || 'Gagal memproses pesan.'}`,
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
          text: 'Maaf, gagal menghubungi server TataDana AI.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full text-xs font-bold shadow-xl border border-slate-700/60 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tanya Chat Bot AI</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            aria-label="Buka Chat Bot AI TataDana"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all relative group"
          >
            <Bot className="w-7 h-7" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* FLOATING CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* HEADER */}
          <div className="px-5 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-sm tracking-tight">TataDana AI</h3>
                  <span className="text-[10px] bg-emerald-400/30 text-white font-bold px-2 py-0.5 rounded-full border border-emerald-300/40 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping"></span>
                    <span>Online</span>
                  </span>
                </div>
                <p className="text-[11px] text-orange-100 font-medium">Asisten Keuangan Pintar</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Link
                href="/dashboard/chat"
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Buka Layar Penuh"
                onClick={() => setIsOpen(false)}
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                title="Tutup Widget"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                      isUser
                        ? 'bg-orange-500 text-white rounded-br-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line text-[12px]">{m.text}</div>

                    {/* CARD: ACTION TRANSFER */}
                    {m.cardType === 'transfer_action' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col space-y-2">
                        <Link
                          href="/dashboard/transfer"
                          onClick={() => setIsOpen(false)}
                          className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-sm transition-all text-xs"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Buka Layanan Transfer</span>
                        </Link>
                      </div>
                    )}

                    {/* CARD: TRANSACTION SUCCESS */}
                    {m.cardType === 'transaction_success' && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                        <span className="flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Tercatat Otomatis</span>
                        </span>
                        <Link
                          href="/dashboard/transactions"
                          onClick={() => setIsOpen(false)}
                          className="text-orange-600 hover:underline"
                        >
                          Lihat Mutasi &rarr;
                        </Link>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 px-1">{m.timestamp}</span>

                  {/* QUICK REPLIES */}
                  {!isUser && m.quickReplies && (
                    <div className="flex flex-wrap gap-1.5 mt-1 pt-1">
                      {m.quickReplies.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-300 rounded-full text-[11px] font-semibold transition-all shadow-2xs"
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
              <div className="flex items-center space-x-2 text-slate-400 text-xs p-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
                <span className="animate-pulse font-medium">TataDana AI sedang mengetik...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ketik: 'beli bakso 15rb' / 'transfer dana'..."
                className="flex-1 px-4 py-2.5 bg-slate-100 focus:bg-white border border-transparent focus:border-orange-500 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="w-10 h-10 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-orange-500/20 disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span>Didukung AI & Sinkron Realtime</span>
              <Link
                href="/dashboard/transfer"
                onClick={() => setIsOpen(false)}
                className="text-orange-600 hover:underline font-semibold"
              >
                Transfer QRIS &bull; DANA &bull; OVO
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
