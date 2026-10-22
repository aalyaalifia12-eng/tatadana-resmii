/**
 * Resilient Data Store & Supabase Bridge for TataDana
 * Strictly adheres to 0-dummy policy:
 * - New users start with Rp0 balance across all wallets
 * - Pemasukan & Pengeluaran start at Rp0
 * - Budget tersisa starts at Rp0 (if no budget set)
 * - Formula: Saldo Wallet = saldo awal wallet + pemasukan - pengeluaran + transfer masuk - transfer keluar
 * - Transfer antar-wallet tidak dihitung sebagai pemasukan atau pengeluaran keseluruhan
 * - Timezone: Asia/Jakarta (WIB)
 */

import { isSameMonthWIB } from '../utils/date';

export interface Profile {
  id: string;
  email?: string;
  phone_number: string;
  full_name: string;
  avatar_url?: string;
  plan: 'starter' | 'pro';
  role: 'user' | 'admin' | 'superadmin';
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  password_hash?: string;
  default_currency: string;
  telegram_chat_id?: number | null;
  telegram_username?: string | null;
  telegram_bot_token?: string | null;
  telegram_connected: boolean;
  reminder_enabled: boolean;
  reminder_frequency: number;
  reminder_times: string[];
  is_phone_verified: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'investment' | 'other';
  balance: number;
  initial_balance?: number;
  is_default: boolean;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  emoji: string;
  color: string;
  monthly_budget?: number | null;
  is_system: boolean;
}

export interface ReceiptItem {
  id: string;
  transaction_id: string;
  item_name: string;
  price: number;
  quantity: number;
  category_name?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string; // ISO String in WIB
  notes: string;
  source: 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice' | 'web_chat_bot' | 'qris' | 'dana' | 'ovo' | string;
  receipt_image_url?: string;
  transfer_to_wallet_id?: string;
  voice_transcript?: string;
  receipt_items?: ReceiptItem[];
  created_at: string;
}

export interface ExportReport {
  id: string;
  user_id: string;
  format: 'pdf' | 'xlsx';
  period_start: string;
  period_end: string;
  file_name: string;
  file_url: string;
  total_income: number;
  total_expense: number;
  status: 'completed' | 'failed';
  created_at: string;
}

export interface AIProviderConfig {
  id: string;
  provider_name: 'gemini' | 'openai' | 'deepseek';
  display_name: string;
  api_key: string;
  model_name: string;
  is_active: boolean;
  priority: number;
  mode: 'single' | 'failover';
}

export interface AICallLog {
  id: string;
  user_id?: string;
  provider: string;
  action: 'parse_text' | 'ocr_receipt' | 'stt_voice' | 'financial_advisor';
  input_text?: string;
  output_data?: any;
  latency_ms: number;
  status: 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  target_user_id?: string;
  action: string;
  details?: any;
  accessed_at: string;
}

class TataDanaStore {
  private profiles: Profile[] = [];
  private wallets: Wallet[] = [];
  private categories: Category[] = [];
  private transactions: Transaction[] = [];
  private exportReports: ExportReport[] = [];
  private aiProviders: AIProviderConfig[] = [];
  private aiLogs: AICallLog[] = [];
  private adminAuditLogs: AdminAuditLog[] = [];
  private processedUpdates: Set<number> = new Set();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Initial Default Profile: Provisioned Superadmin
    const defaultUserId = 'usr_tatadana_demo_01';
    this.profiles.push({
      id: defaultUserId,
      email: 'admin@tatadana.id',
      phone_number: '081234567890',
      full_name: 'Budi Pratama (Superadmin)',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      plan: 'pro',
      role: 'superadmin',
      approval_status: 'approved',
      approved_by: 'system_bootstrap',
      approved_at: new Date().toISOString(),
      password_hash: 'admin123',
      default_currency: 'IDR',
      telegram_chat_id: 987654321,
      telegram_username: 'budipratama_id',
      telegram_bot_token: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
      telegram_connected: true,
      reminder_enabled: true,
      reminder_frequency: 2,
      reminder_times: ['08:00', '20:00'],
      is_phone_verified: true,
      created_at: new Date().toISOString(),
    });

    // 1b. Seed Demo Approved User for Immediate Testing
    const approvedUserId = 'usr_user_approved_01';
    this.profiles.push({
      id: approvedUserId,
      email: 'user@tatadana.id',
      phone_number: '085711223344',
      full_name: 'Dewi Lestari',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      plan: 'starter',
      role: 'user',
      approval_status: 'approved',
      approved_by: defaultUserId,
      approved_at: new Date().toISOString(),
      password_hash: 'user123',
      default_currency: 'IDR',
      telegram_connected: false,
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_times: ['20:00'],
      is_phone_verified: true,
      created_at: new Date().toISOString(),
    });

    this.wallets.push({
      id: 'wal_dewi_main',
      user_id: approvedUserId,
      name: 'BCA Dewi',
      type: 'bank',
      balance: 0,
      initial_balance: 0,
      is_default: true,
      color: '#0066AE',
      icon: 'CreditCard',
    });

    // 1c. Seed Demo Pending User
    const pendingUserId = 'usr_user_pending_01';
    this.profiles.push({
      id: pendingUserId,
      email: 'ahmad.pending@example.com',
      phone_number: '081399887766',
      full_name: 'Ahmad Fauzi (Menunggu Verifikasi)',
      plan: 'starter',
      role: 'user',
      approval_status: 'pending',
      approved_by: null,
      approved_at: null,
      password_hash: 'pending123',
      default_currency: 'IDR',
      telegram_connected: false,
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_times: ['20:00'],
      is_phone_verified: true,
      created_at: new Date().toISOString(),
    });

    // 2. Initial Wallets with Rp0 balance
    this.wallets.push(
      {
        id: 'wal_bca_01',
        user_id: defaultUserId,
        name: 'BCA Utama',
        type: 'bank',
        balance: 0,
        initial_balance: 0,
        is_default: true,
        color: '#0066AE',
        icon: 'CreditCard',
      },
      {
        id: 'wal_gopay_02',
        user_id: defaultUserId,
        name: 'GoPay',
        type: 'ewallet',
        balance: 0,
        initial_balance: 0,
        is_default: false,
        color: '#00AED6',
        icon: 'Smartphone',
      },
      {
        id: 'wal_cash_03',
        user_id: defaultUserId,
        name: 'Dompet Tunai',
        type: 'cash',
        balance: 0,
        initial_balance: 0,
        is_default: false,
        color: '#10B981',
        icon: 'Banknote',
      }
    );

    // 3. System Categories (With NULL monthly budget by default)
    this.categories.push(
      { id: 'cat_01', name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#F97316', monthly_budget: null, is_system: true },
      { id: 'cat_02', name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#3B82F6', monthly_budget: null, is_system: true },
      { id: 'cat_03', name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#EF4444', monthly_budget: null, is_system: true },
      { id: 'cat_04', name: 'Hiburan & Rekreasi', type: 'expense', emoji: '🎮', color: '#8B5CF6', monthly_budget: null, is_system: true },
      { id: 'cat_05', name: 'Belanja & Kebutuhan', type: 'expense', emoji: '👕', color: '#EC4899', monthly_budget: null, is_system: true },
      { id: 'cat_06', name: 'Kesehatan & Medis', type: 'expense', emoji: '💊', color: '#10B981', monthly_budget: null, is_system: true },
      { id: 'cat_07', name: 'Gaji & Upah', type: 'income', emoji: '💰', color: '#10B981', monthly_budget: null, is_system: true },
      { id: 'cat_08', name: 'Side Hustle', type: 'income', emoji: '💼', color: '#F59E0B', monthly_budget: null, is_system: true }
    );

    // 4. Initial Transactions: Strictly EMPTY (No fake/dummy transactions)
    this.transactions = [];

    // 5. Initial AI Providers
    this.aiProviders.push(
      {
        id: 'ai_01',
        provider_name: 'gemini',
        display_name: 'Google Gemini 1.5 Flash',
        api_key: 'AIzaSyDemoDefaultGeminiKey',
        model_name: 'gemini-1.5-flash',
        is_active: true,
        priority: 1,
        mode: 'failover',
      },
      {
        id: 'ai_02',
        provider_name: 'openai',
        display_name: 'OpenAI GPT-4o-mini',
        api_key: 'sk-demo-openai-key',
        model_name: 'gpt-4o-mini',
        is_active: true,
        priority: 2,
        mode: 'failover',
      },
      {
        id: 'ai_03',
        provider_name: 'deepseek',
        display_name: 'DeepSeek V3',
        api_key: 'sk-demo-deepseek-key',
        model_name: 'deepseek-chat',
        is_active: false,
        priority: 3,
        mode: 'single',
      }
    );
  }

  // Idempotency: Returns true if update already processed
  public isUpdateProcessed(updateId: number): boolean {
    return this.processedUpdates.has(updateId);
  }

  public markUpdateProcessed(updateId: number) {
    this.processedUpdates.add(updateId);
  }

  // Profiles
  public getProfile(userId: string): Profile | undefined {
    return this.profiles.find((p) => p.id === userId);
  }

  public getProfileByPhone(phone: string): Profile | undefined {
    return this.profiles.find((p) => p.phone_number === phone);
  }

  public getProfileByChatId(chatId: number): Profile | undefined {
    return this.profiles.find((p) => p.telegram_chat_id === chatId);
  }

  public getAllProfiles(): Profile[] {
    return [...this.profiles];
  }

  public getProfileByEmail(email: string): Profile | undefined {
    return this.profiles.find((p) => p.email && p.email.toLowerCase() === email.toLowerCase().trim());
  }

  public getPendingUsers(): Profile[] {
    return this.profiles.filter((p) => p.approval_status === 'pending');
  }

  public updateProfile(userId: string, data: Partial<Profile>, callerId?: string): Profile | null {
    const idx = this.profiles.findIndex((p) => p.id === userId);
    if (idx === -1) return null;

    // Security check: If attempting to change role or approval_status, caller must be an approved admin
    if (
      data.role !== undefined ||
      data.approval_status !== undefined ||
      data.approved_by !== undefined ||
      data.approved_at !== undefined
    ) {
      const caller = callerId ? this.getProfile(callerId) : null;
      const isCallerAdmin =
        caller && (caller.role === 'admin' || caller.role === 'superadmin') && caller.approval_status === 'approved';
      if (!isCallerAdmin) {
        throw new Error('Akses Ditolak: Pengguna tidak memiliki izin mengubah role atau status persetujuan akun.');
      }
    }

    this.profiles[idx] = { ...this.profiles[idx], ...data };
    return this.profiles[idx];
  }

  /**
   * Approves a pending user (Admin only)
   */
  public approveUser(userId: string, adminId: string): Profile {
    const admin = this.getProfile(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin') || admin.approval_status !== 'approved') {
      throw new Error('Hanya admin aktif yang berwenang menyetujui akun pengguna.');
    }
    const user = this.getProfile(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    user.approval_status = 'approved';
    user.approved_by = adminId;
    user.approved_at = new Date().toISOString();
    user.rejection_reason = null;

    this.logAdminAudit(adminId, userId, 'APPROVE_USER', {
      user_email: user.email,
      approved_at: user.approved_at,
    });
    return user;
  }

  /**
   * Rejects a pending user (Admin only)
   */
  public rejectUser(userId: string, adminId: string, reason?: string): Profile {
    const admin = this.getProfile(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin') || admin.approval_status !== 'approved') {
      throw new Error('Hanya admin aktif yang berwenang menolak akun pengguna.');
    }
    const user = this.getProfile(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    user.approval_status = 'rejected';
    user.rejection_reason =
      reason || 'Permintaan akses ditolak oleh administrator. Silakan hubungi admin jika memerlukan informasi lebih lanjut.';

    this.logAdminAudit(adminId, userId, 'REJECT_USER', {
      user_email: user.email,
      reason: user.rejection_reason,
    });
    return user;
  }

  /**
   * Suspends an active user (Admin only)
   */
  public suspendUser(userId: string, adminId: string, reason?: string): Profile {
    const admin = this.getProfile(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin') || admin.approval_status !== 'approved') {
      throw new Error('Hanya admin aktif yang berwenang menonaktifkan akun pengguna.');
    }
    const user = this.getProfile(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    user.approval_status = 'suspended';
    user.rejection_reason = reason || 'Akun Anda telah dinonaktifkan sementara oleh administrator.';

    this.logAdminAudit(adminId, userId, 'SUSPEND_USER', {
      user_email: user.email,
      reason: user.rejection_reason,
    });
    return user;
  }

  /**
   * Reactivates a suspended user (Admin only)
   */
  public reactivateUser(userId: string, adminId: string): Profile {
    const admin = this.getProfile(adminId);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'superadmin') || admin.approval_status !== 'approved') {
      throw new Error('Hanya admin aktif yang berwenang mengaktifkan kembali akun pengguna.');
    }
    const user = this.getProfile(userId);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    user.approval_status = 'approved';
    user.rejection_reason = null;

    this.logAdminAudit(adminId, userId, 'REACTIVATE_USER', {
      user_email: user.email,
    });
    return user;
  }

  /**
   * Safe Admin Provisioning (Used by system bootstrap/owner only, not public registration)
   */
  public provisionAdmin(params: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    password?: string;
  }): Profile {
    const adminId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newAdmin: Profile = {
      id: adminId,
      email: params.email.trim().toLowerCase(),
      phone_number: params.phoneNumber ? params.phoneNumber.replace(/[^0-9]/g, '') : '081234567890',
      full_name: params.fullName.trim(),
      plan: 'pro',
      role: 'admin',
      approval_status: 'approved',
      approved_by: 'system_bootstrap',
      approved_at: new Date().toISOString(),
      password_hash: params.password || 'admin123',
      default_currency: 'IDR',
      telegram_connected: false,
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_times: ['20:00'],
      is_phone_verified: true,
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newAdmin);
    return newAdmin;
  }

  /**
   * Registers a completely clean user account with Rp0 balance and no transactions
   * Status defaults strictly to 'pending' and role strictly to 'user'
   */
  public createUserAccount(params: {
    fullName: string;
    email?: string;
    phoneNumber: string;
    password?: string;
    plan?: 'starter' | 'pro';
  }): Profile {
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: Profile = {
      id: userId,
      email: params.email ? params.email.trim().toLowerCase() : `user_${userId}@tatadana.id`,
      phone_number: params.phoneNumber,
      full_name: params.fullName,
      plan: params.plan || 'starter',
      role: 'user', // STRICT: Cannot register as admin
      approval_status: 'pending', // STRICT: Always pending approval
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      password_hash: params.password || 'password123',
      default_currency: 'IDR',
      telegram_connected: false,
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_times: ['20:00'],
      is_phone_verified: true,
      created_at: new Date().toISOString(),
    };
    this.profiles.push(newProfile);

    // Create 1 default wallet with 0 balance
    this.wallets.push({
      id: `wal_${Date.now()}_default`,
      user_id: userId,
      name: 'Dompet Utama',
      type: 'bank',
      balance: 0,
      initial_balance: 0,
      is_default: true,
      color: '#0066AE',
      icon: 'CreditCard',
    });

    return newProfile;
  }

  // Admin Audit Trail Logging
  public logAdminAudit(adminId: string, targetUserId: string | undefined, action: string, details?: any) {
    const entry: AdminAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      details,
      accessed_at: new Date().toISOString(),
    };
    this.adminAuditLogs.push(entry);
    console.log(`[ADMIN AUDIT] Admin ${adminId} performed ${action} on ${targetUserId || 'system'}`);
  }

  public getAdminAuditLogs(): AdminAuditLog[] {
    return [...this.adminAuditLogs];
  }

  // Wallets: Dynamic Balance Calculation Formula
  // Saldo Wallet = saldo awal wallet + pemasukan - pengeluaran + transfer masuk - transfer keluar
  public getWallets(userId: string): Wallet[] {
    const userWallets = this.wallets.filter((w) => w.user_id === userId);
    const userTransactions = this.transactions.filter((t) => t.user_id === userId);

    return userWallets.map((wallet) => {
      const initialBalance = Number(wallet.initial_balance || 0);
      const income = userTransactions
        .filter((t) => t.wallet_id === wallet.id && t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = userTransactions
        .filter((t) => t.wallet_id === wallet.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const transferIn = userTransactions
        .filter((t) => t.transfer_to_wallet_id === wallet.id && t.type === 'transfer')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const transferOut = userTransactions
        .filter((t) => t.wallet_id === wallet.id && t.type === 'transfer')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const calculatedBalance = initialBalance + income - expense + transferIn - transferOut;
      wallet.balance = calculatedBalance;
      return { ...wallet, balance: calculatedBalance };
    });
  }

  public getWallet(walletId: string): Wallet | undefined {
    const wallet = this.wallets.find((w) => w.id === walletId);
    if (!wallet) return undefined;

    const userTransactions = this.transactions.filter((t) => t.user_id === wallet.user_id);
    const initialBalance = Number(wallet.initial_balance || 0);
    const income = userTransactions
      .filter((t) => t.wallet_id === wallet.id && t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = userTransactions
      .filter((t) => t.wallet_id === wallet.id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const transferIn = userTransactions
      .filter((t) => t.transfer_to_wallet_id === wallet.id && t.type === 'transfer')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const transferOut = userTransactions
      .filter((t) => t.wallet_id === wallet.id && t.type === 'transfer')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const calculatedBalance = initialBalance + income - expense + transferIn - transferOut;
    wallet.balance = calculatedBalance;
    return { ...wallet, balance: calculatedBalance };
  }

  public getDefaultWallet(userId: string): Wallet | undefined {
    const userWallets = this.getWallets(userId);
    return userWallets.find((w) => w.is_default) || userWallets[0];
  }

  public createWallet(wallet: Omit<Wallet, 'id' | 'balance'> & { balance?: number }): Wallet {
    const initBalance = Number(wallet.initial_balance ?? wallet.balance ?? 0);
    const newWallet: Wallet = {
      ...wallet,
      id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      initial_balance: initBalance,
      balance: initBalance,
    };
    if (newWallet.is_default) {
      this.wallets.forEach((w) => {
        if (w.user_id === newWallet.user_id) w.is_default = false;
      });
    }
    this.wallets.push(newWallet);
    return newWallet;
  }

  public updateWallet(walletId: string, data: Partial<Wallet>): Wallet | null {
    const idx = this.wallets.findIndex((w) => w.id === walletId);
    if (idx === -1) return null;
    if (data.is_default) {
      const userId = this.wallets[idx].user_id;
      this.wallets.forEach((w) => {
        if (w.user_id === userId) w.is_default = false;
      });
    }
    this.wallets[idx] = { ...this.wallets[idx], ...data };
    return this.getWallet(walletId) || this.wallets[idx];
  }

  // Categories
  public getCategories(userId: string): Category[] {
    return this.categories.filter((c) => c.is_system || c.user_id === userId);
  }

  public createCategory(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  public updateCategory(categoryId: string, data: Partial<Category>): Category | null {
    const idx = this.categories.findIndex((c) => c.id === categoryId);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...data };
    return this.categories[idx];
  }

  // Transactions
  public getTransactions(userId: string): Transaction[] {
    return this.transactions
      .filter((t) => t.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public countMonthlyTransactions(userId: string): number {
    const now = new Date();
    return this.transactions.filter((t) => {
      if (t.user_id !== userId) return false;
      return isSameMonthWIB(t.date, now);
    }).length;
  }

  public createTransaction(trx: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const newTransaction: Transaction = {
      ...trx,
      amount: Number(trx.amount),
      id: `trx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    this.transactions.push(newTransaction);
    // Refresh wallet balances automatically
    this.getWallets(trx.user_id);

    return newTransaction;
  }

  public updateTransaction(transactionId: string, data: Partial<Transaction>): Transaction | null {
    const idx = this.transactions.findIndex((t) => t.id === transactionId);
    if (idx === -1) return null;

    if (data.amount !== undefined) {
      data.amount = Number(data.amount);
    }

    this.transactions[idx] = { ...this.transactions[idx], ...data };
    // Refresh wallet balances
    this.getWallets(this.transactions[idx].user_id);

    return this.transactions[idx];
  }

  public deleteTransaction(transactionId: string): boolean {
    const idx = this.transactions.findIndex((t) => t.id === transactionId);
    if (idx === -1) return false;

    const userId = this.transactions[idx].user_id;
    this.transactions.splice(idx, 1);

    // Refresh wallet balances
    this.getWallets(userId);
    return true;
  }

  // Export Reports
  public getExportReports(userId: string): ExportReport[] {
    return this.exportReports
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addExportReport(report: Omit<ExportReport, 'id' | 'created_at'>): ExportReport {
    const newReport: ExportReport = {
      ...report,
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.exportReports.push(newReport);
    return newReport;
  }

  // AI Providers & Logs
  public getAIProviders(): AIProviderConfig[] {
    return [...this.aiProviders];
  }

  public updateAIProvider(id: string, data: Partial<AIProviderConfig>): AIProviderConfig | null {
    const idx = this.aiProviders.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.aiProviders[idx] = { ...this.aiProviders[idx], ...data };
    return this.aiProviders[idx];
  }

  public addAILog(log: Omit<AICallLog, 'id' | 'created_at'>): AICallLog {
    const newLog: AICallLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    this.aiLogs.unshift(newLog);
    if (this.aiLogs.length > 500) this.aiLogs.pop();
    return newLog;
  }

  public getAILogs(): AICallLog[] {
    return [...this.aiLogs];
  }

  /**
   * Testing Helper: Clears all transactions for a specific user to test fresh accounts
   */
  public clearUserTransactions(userId: string) {
    this.transactions = this.transactions.filter((t) => t.user_id !== userId);
    this.getWallets(userId);
  }
}

// Global Singleton for Hot Reloading
const globalStore = global as unknown as { tatadanaStore?: TataDanaStore };
export const db = globalStore.tatadanaStore || new TataDanaStore();
if (process.env.NODE_ENV !== 'production') globalStore.tatadanaStore = db;
