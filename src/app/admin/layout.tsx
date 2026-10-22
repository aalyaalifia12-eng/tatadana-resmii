'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Cpu,
  ArrowLeft,
  Key,
  CreditCard,
  UserCheck,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { clearClientUserId, clearImpersonatedUserId } from '@/lib/auth/session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.ok || !data.user) {
          router.push('/login');
          return;
        }

        // STRICT: Only users with role 'admin' or 'superadmin' and status 'approved'
        if (!data.isAdmin) {
          router.push('/access-denied');
          return;
        }

        setAdminUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error('Admin auth check failed:', err);
        router.push('/login');
      }
    };
    verifyAdmin();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientUserId();
    clearImpersonatedUserId();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shadow-orange-500/25 animate-pulse mb-4">
          TD
        </div>
        <p className="text-xs font-bold text-slate-400 tracking-wider uppercase animate-pulse">
          Memverifikasi Hak Akses Administrator...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between py-6 px-4 shrink-0 fixed inset-y-0 left-0 z-30">
        <div>
          {/* Brand */}
          <div className="flex items-center space-x-3 px-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-orange-500/20">
              TD
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">Superadmin</span>
              <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">TataDana Internal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5 text-xs font-semibold">
            <Link
              href="/admin#account-requests"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-orange-400" />
              <span>Permintaan Akun</span>
            </Link>

            <Link
              href="/admin#users-list"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Kelola Seluruh Pengguna</span>
            </Link>

            <Link
              href="/admin#ai-providers"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Cpu className="w-4 h-4" />
              <span>Provider AI (Multi-AI)</span>
            </Link>

            <Link
              href="/admin#ai-logs"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Key className="w-4 h-4" />
              <span>Log AI & Audit Biaya</span>
            </Link>

            <Link
              href="/admin#payments"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pembayaran & Approval</span>
            </Link>
          </nav>
        </div>

        {/* Admin User Info & Logout */}
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="px-3 py-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="truncate max-w-[140px]">
              <p className="text-xs font-bold text-white truncate">{adminUser?.full_name}</p>
              <p className="text-[10px] text-orange-400 font-mono uppercase">{adminUser?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout Administrator"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64 p-8 min-h-screen">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
