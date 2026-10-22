-- =============================================================================
-- TATADANA COMPLETE SUPABASE DATABASE SCHEMA & SECURITY SETUP
-- =============================================================================
-- Features:
-- 1. Full Multi-Wallet & Transaction Schema
-- 2. User Registration with Admin Approval Workflow ('pending', 'approved', 'rejected', 'suspended')
-- 3. Strict Role Separation ('user', 'admin', 'superadmin')
-- 4. Database Trigger Preventing Non-Admin Privilege Escalation
-- 5. Wallet Dynamic Balance Trigger Automation (INSERT, UPDATE, DELETE)
-- 6. Supabase Auth Integration Trigger (auth.users -> public.profiles with Rp0 wallet)
-- 7. Supabase Storage Bucket for Reports Export
-- 8. Complete Row Level Security (RLS) on All Tables
-- 9. Timezone: Asia/Jakarta (WIB)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone_number TEXT UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    default_currency TEXT NOT NULL DEFAULT 'IDR',
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_bot_token TEXT,
    telegram_connected BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_frequency INTEGER NOT NULL DEFAULT 1 CHECK (reminder_frequency IN (1, 2)),
    reminder_times TEXT[] DEFAULT ARRAY['20:00'],
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 2. WALLETS TABLE (Multi-Wallet: Cash, BCA, Mandiri, GoPay, OVO, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank', 'ewallet', 'investment', 'other')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    initial_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT DEFAULT '#F97316',
    icon TEXT DEFAULT 'CreditCard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 3. CATEGORIES TABLE (Hierarchical / Personalized)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL for system templates
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    emoji TEXT NOT NULL DEFAULT '🏷️',
    color TEXT DEFAULT '#F97316',
    monthly_budget NUMERIC(15, 2) DEFAULT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 4. TRANSACTIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'telegram_text', 'telegram_receipt', 'telegram_voice')),
    receipt_image_url TEXT,
    transfer_to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
    voice_transcript TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 5. RECEIPT ITEMS (OCR Receipt Item Breakdown)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transaction_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 6. EXPORT REPORTS HISTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.export_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'xlsx')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    total_income NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_expense NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 7. TELEGRAM UPDATES IDEMPOTENCY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    telegram_chat_id BIGINT,
    message_text TEXT,
    message_type TEXT DEFAULT 'text',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'ignored'))
);

-- =============================================================================
-- 8. AI PROVIDERS CONFIGURATION (Managed from Admin UI)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_providers_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL UNIQUE CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    display_name TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    model_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 1,
    mode TEXT NOT NULL DEFAULT 'failover' CHECK (mode IN ('single', 'failover')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 9. AI CALL LOGS (Debugging, Latency & Token Usage Audit)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ai_call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('parse_text', 'ocr_receipt', 'stt_voice', 'financial_advisor')),
    input_text TEXT,
    output_data JSONB,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 10. PAYMENTS / MIDTRANS TRANSACTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
    amount NUMERIC(15, 2) NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'midtrans' CHECK (payment_type IN ('midtrans', 'manual_transfer')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'settlement', 'capture', 'deny', 'expire', 'cancel', 'refund')),
    payment_gateway_response JSONB DEFAULT '{}'::jsonb,
    manual_receipt_url TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- 11. ADMIN AUDIT LOGS (Privacy protection when admin inspects user data)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_approval ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =============================================================================
-- HELPER FUNCTIONS FOR ROLES & APPROVAL
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND role IN ('admin', 'superadmin')
          AND approval_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND approval_status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: PREVENT PRIVILEGE ESCALATION
-- Non-admin cannot modify role, approval_status, approved_by, approved_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.approval_status IS DISTINCT FROM OLD.approval_status) OR
       (NEW.approved_by IS DISTINCT FROM OLD.approved_by) OR
       (NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
       
        IF NOT public.is_active_admin() AND auth.role() <> 'service_role' THEN
            RAISE EXCEPTION 'Akses Ditolak: Pengguna biasa tidak memiliki izin mengubah role atau status persetujuan akun.';
        END IF;
    END IF;

    NEW.updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- =============================================================================
-- RECALCULATE WALLET BALANCE HELPER
-- Formula: Saldo = initial_balance + pemasukan - pengeluaran + transfer_masuk - transfer_keluar
-- =============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_wallet_balance(p_wallet_id UUID)
RETURNS VOID AS $$
DECLARE
    v_initial NUMERIC(15, 2) := 0.00;
    v_income NUMERIC(15, 2) := 0.00;
    v_expense NUMERIC(15, 2) := 0.00;
    v_transfer_in NUMERIC(15, 2) := 0.00;
    v_transfer_out NUMERIC(15, 2) := 0.00;
BEGIN
    SELECT COALESCE(initial_balance, 0.00) INTO v_initial FROM public.wallets WHERE id = p_wallet_id;
    SELECT COALESCE(SUM(amount), 0.00) INTO v_income FROM public.transactions WHERE wallet_id = p_wallet_id AND type = 'income';
    SELECT COALESCE(SUM(amount), 0.00) INTO v_expense FROM public.transactions WHERE wallet_id = p_wallet_id AND type = 'expense';
    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfer_in FROM public.transactions WHERE transfer_to_wallet_id = p_wallet_id AND type = 'transfer';
    SELECT COALESCE(SUM(amount), 0.00) INTO v_transfer_out FROM public.transactions WHERE wallet_id = p_wallet_id AND type = 'transfer';

    UPDATE public.wallets
    SET balance = v_initial + v_income - v_expense + v_transfer_in - v_transfer_out,
        updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
    WHERE id = p_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGER: TRANSACTION BALANCE AUTOMATION (INSERT, UPDATE, DELETE)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.recalculate_wallet_balance(NEW.wallet_id);
        IF NEW.type = 'transfer' AND NEW.transfer_to_wallet_id IS NOT NULL THEN
            PERFORM public.recalculate_wallet_balance(NEW.transfer_to_wallet_id);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        PERFORM public.recalculate_wallet_balance(OLD.wallet_id);
        IF OLD.wallet_id <> NEW.wallet_id THEN
            PERFORM public.recalculate_wallet_balance(NEW.wallet_id);
        END IF;
        IF OLD.type = 'transfer' AND OLD.transfer_to_wallet_id IS NOT NULL THEN
            PERFORM public.recalculate_wallet_balance(OLD.transfer_to_wallet_id);
        END IF;
        IF NEW.type = 'transfer' AND NEW.transfer_to_wallet_id IS NOT NULL THEN
            PERFORM public.recalculate_wallet_balance(NEW.transfer_to_wallet_id);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.recalculate_wallet_balance(OLD.wallet_id);
        IF OLD.type = 'transfer' AND OLD.transfer_to_wallet_id IS NOT NULL THEN
            PERFORM public.recalculate_wallet_balance(OLD.transfer_to_wallet_id);
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_transaction_balance ON public.transactions;
CREATE TRIGGER trg_transaction_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

-- =============================================================================
-- TRIGGER: AUTH.USERS -> PUBLIC.PROFILES (New Registration Handler)
-- Automatically creates profile with status 'pending' and initial wallet Rp0
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone_number';

    -- 1. Insert Profile (STRICT: role = 'user', approval_status = 'pending')
    INSERT INTO public.profiles (
        id,
        email,
        phone_number,
        full_name,
        role,
        approval_status,
        plan
    ) VALUES (
        NEW.id,
        NEW.email,
        v_phone,
        v_full_name,
        'user',
        'pending',
        'starter'
    );

    -- 2. Create Default Wallet with Rp0 Balance
    INSERT INTO public.wallets (
        user_id,
        name,
        type,
        balance,
        initial_balance,
        is_default,
        color,
        icon
    ) VALUES (
        NEW.id,
        'Dompet Utama',
        'bank',
        0.00,
        0.00,
        true,
        '#0066AE',
        'CreditCard'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile info" ON public.profiles;
CREATE POLICY "Users can update own profile info" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
CREATE POLICY "Admins manage all profiles" ON public.profiles
    FOR ALL USING (public.is_active_admin());

-- 2. Wallets Policies (Only approved users can access)
DROP POLICY IF EXISTS "Approved users manage own wallets" ON public.wallets;
CREATE POLICY "Approved users manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id AND public.is_approved_user());

-- 3. Categories Policies
DROP POLICY IF EXISTS "Users view categories" ON public.categories;
CREATE POLICY "Users view categories" ON public.categories
    FOR SELECT USING (is_system = true OR (auth.uid() = user_id AND public.is_approved_user()));

DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
CREATE POLICY "Users manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id AND public.is_approved_user());

-- 4. Transactions Policies
DROP POLICY IF EXISTS "Approved users manage own transactions" ON public.transactions;
CREATE POLICY "Approved users manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id AND public.is_approved_user());

-- 5. Receipt items
DROP POLICY IF EXISTS "Users manage own receipt items" ON public.transaction_receipt_items;
CREATE POLICY "Users manage own receipt items" ON public.transaction_receipt_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND t.user_id = auth.uid() AND public.is_approved_user()
        )
    );

-- 6. Export Reports
DROP POLICY IF EXISTS "Users manage own export reports" ON public.export_reports;
CREATE POLICY "Users manage own export reports" ON public.export_reports
    FOR ALL USING (auth.uid() = user_id AND public.is_approved_user());

-- 7. Payments
DROP POLICY IF EXISTS "Users view own payments" ON public.payment_transactions;
CREATE POLICY "Users view own payments" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- 8. Admin Only Policies
DROP POLICY IF EXISTS "Admins full access to ai_providers" ON public.ai_providers_config;
CREATE POLICY "Admins full access to ai_providers" ON public.ai_providers_config
    FOR ALL USING (public.is_active_admin());

DROP POLICY IF EXISTS "Admins full access to ai_logs" ON public.ai_call_logs;
CREATE POLICY "Admins full access to ai_logs" ON public.ai_call_logs
    FOR ALL USING (public.is_active_admin());

DROP POLICY IF EXISTS "Admins full access to audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Admins full access to audit_logs" ON public.admin_audit_logs
    FOR ALL USING (public.is_active_admin());

DROP POLICY IF EXISTS "Admins full access to payments" ON public.payment_transactions;
CREATE POLICY "Admins full access to payments" ON public.payment_transactions
    FOR ALL USING (public.is_active_admin());

-- =============================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION (For Temporary Report Exports)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'tatadana-reports',
    'tatadana-reports',
    false,
    10485760, -- 10 MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can only upload and read files in their own folder ({user_id}/*)
DROP POLICY IF EXISTS "Users manage own report files" ON storage.objects;
CREATE POLICY "Users manage own report files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'tatadana-reports' 
        AND auth.uid()::text = (storage.foldername(name))[1]
        AND public.is_approved_user()
    );

-- =============================================================================
-- INITIAL DEFAULT SYSTEM CATEGORIES
-- =============================================================================
INSERT INTO public.categories (name, type, emoji, color, is_system) VALUES
('Makanan & Minuman', 'expense', '🍜', '#F97316', true),
('Transportasi', 'expense', '🚗', '#3B82F6', true),
('Hiburan & Rekreasi', 'expense', '🎮', '#8B5CF6', true),
('Tagihan & Utilitas', 'expense', '🏠', '#EF4444', true),
('Kesehatan & Medis', 'expense', '💊', '#10B981', true),
('Belanja & Kebutuhan', 'expense', '👕', '#EC4899', true),
('Pendidikan & Buku', 'expense', '📚', '#6366F1', true),
('Gaji & Upah', 'income', '💰', '#10B981', true),
('Investasi & Bunga', 'income', '📈', '#06B6D4', true),
('Penjualan / Side Hustle', 'income', '💼', '#F59E0B', true),
('Hadiah & Bonus', 'income', '🎁', '#84CC16', true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- INITIAL AI PROVIDERS SETUP (Managed from Admin UI)
-- =============================================================================
INSERT INTO public.ai_providers_config (provider_name, display_name, api_key_encrypted, model_name, is_active, priority, mode)
VALUES
('gemini', 'Google Gemini AI', 'demo-encrypted-key-gemini', 'gemini-1.5-flash', true, 1, 'failover'),
('openai', 'OpenAI GPT-4o', 'demo-encrypted-key-openai', 'gpt-4o-mini', true, 2, 'failover'),
('deepseek', 'DeepSeek V3', 'demo-encrypted-key-deepseek', 'deepseek-chat', false, 3, 'single')
ON CONFLICT (provider_name) DO NOTHING;
