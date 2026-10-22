'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  CreditCard,
  BarChart3,
  Target,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Shield,
  AlertTriangle,
  ArrowLeft,
  Bot,
  ArrowRightLeft,
} from 'lucide-react';
import { clearClientUserId, clearImpersonatedUserId } from '@/lib/auth/session';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [profile, setProfile] = useState<any>({
    full_name: 'Pengguna TataDana',
    plan: 'starter',
    role: 'user',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.ok || !data.effectiveUser) {
          router.push('/login');
          return;
        }

        const effective = data.effectiveUser;
        const actual = data.user;

        // Check approval status
        if (effective.approval_status === 'pending') {
          router.push('/pending-approval');
          return;
        }
        if (effective.approval_status === 'rejected') {
          router.push('/access-rejected');
          return;
        }
        if (effective.approval_status === 'suspended') {
          router.push('/access-suspended');
          return;
        }

        // Check if admin is trying to access user dashboard directly without impersonation
        if ((actual.role === 'admin' || actual.role === 'superadmin') && !data.isImpersonating) {
          router.push('/admin');
          return;
        }

        setProfile(effective);
        setIsImpersonating(!!data.isImpersonating);
        setLoadingAuth(false);
      } catch (err) {
        console.error('Failed to load user in layout:', err);
        router.push('/login');
      }
    };
    fetchUser();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientUserId();
    router.push('/login');
  };

  const handleExitImpersonation = async () => {
    try {
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'exit' }),
      });
      clearImpersonatedUserId();
      router.push('/admin');
    } catch {
      router.push('/admin');
    }
  };

  const navItems = [
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Chat Bot AI', href: '/dashboard/chat', icon: Bot, badge: 'AI' },
    { label: 'Transfer & QRIS', href: '/dashboard/transfer', icon: ArrowRightLeft, badge: 'Baru' },
    { label: 'Transaksi', href: '/dashboard/transactions', icon: CreditCard },
    { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Budget', href: '/dashboard/budget', icon: Target },
    { label: 'Wallet', href: '/dashboard/wallets', icon: Wallet },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shadow-orange-500/25 animate-pulse mb-4">
          TD
        </div>
        <p className="text-xs font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          Memverifikasi Izin Akses Akun...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* IMPERSONATION BANNER */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 flex items-center justify-between text-xs font-bold sticky top-0 z-50 shadow-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-slate-950" />
            <span>
              Mode Impersonasi Administrator: Anda sedang meninjau dashboard milik <strong>{profile.full_name}</strong> ({profile.email}). Semua aksi tercatat di audit trail.
            </span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors shrink-0 ml-4 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Kembali ke Panel Admin</span>
          </button>
        </div>
      )}

      <div className="flex-1 flex">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between py-6 px-4 shrink-0 fixed inset-y-0 left-0 z-30">
          <div>
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3 px-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-orange-500/20">
                TD
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Tata<span className="text-orange-500">Dana</span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Fintech App</p>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'AI'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Card & Logout */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            {/* Plan Badge */}
            <div className="px-3 py-2 bg-orange-50 rounded-xl border border-orange-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Paket {profile.plan === 'pro' ? 'Pro Lifetime' : 'Starter'}</span>
              </div>
              {profile.plan === 'starter' && (
                <Link href="/dashboard/settings" className="text-[11px] font-bold text-orange-600 hover:underline">
                  Upgrade
                </Link>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold flex items-center justify-center text-xs border border-orange-200">
                  {profile.full_name?.substring(0, 2).toUpperCase() || 'TD'}
                </div>
                <div className="truncate max-w-[100px]">
                  <p className="text-xs font-bold text-slate-800 truncate">{profile.full_name}</p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate">&bull; Terverifikasi</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Keluar"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE TOPBAR */}
        <div className="lg:hidden fixed top-0 inset-x-0 bg-white border-b border-slate-200 z-40 h-16 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white font-extrabold flex items-center justify-center text-sm">
              TD
            </div>
            <span className="font-bold text-slate-900 text-lg">TataDana</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm pt-16">
            <div className="bg-white p-6 space-y-2 border-b border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                      isActive ? 'bg-orange-500 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isActive ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 font-semibold text-sm"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 min-h-screen">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* PERSISTENT FLOATING AI CHAT BOT WIDGET */}
      <FloatingChatWidget />
    </div>
  );
}
