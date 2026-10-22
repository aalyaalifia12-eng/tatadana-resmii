-- =============================================================================
-- TataDana SaaS Database Schema & Migrations
-- Fully compliant with Supabase Auth, Row Level Security (RLS), and Realtime
-- Timezone: Asia/Jakarta (WIB)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    default_currency TEXT NOT NULL DEFAULT 'IDR',
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_bot_token TEXT,
    telegram_connected BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_frequency INTEGER NOT NULL DEFAULT 1 CHECK (reminder_frequency IN (1, 2)),
    reminder_times TEXT[] DEFAULT ARRAY['20:00'],
    is_phone_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 2. WALLETS TABLE (Multi-Wallet: Cash, BCA, Mandiri, GoPay, OVO, etc.)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank', 'ewallet', 'investment', 'other')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT DEFAULT '#F97316', -- Orange TataDana accent
    icon TEXT DEFAULT 'Wallet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 3. CATEGORIES TABLE (Hierarchical / Personalized)
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

-- 4. TRANSACTIONS TABLE
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

-- 5. RECEIPT ITEMS (Multi-item receipt breakdown for single primary transaction)
CREATE TABLE IF NOT EXISTS public.transaction_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    quantity INTEGER NOT NULL DEFAULT 1,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- 6. EXPORT REPORTS HISTORY
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

-- 7. TELEGRAM UPDATES IDEMPOTENCY
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    telegram_chat_id BIGINT,
    message_text TEXT,
    message_type TEXT DEFAULT 'text',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'ignored'))
);

-- 8. AI PROVIDERS CONFIGURATION (Managed from Admin UI)
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

-- 9. AI CALL LOGS (Debugging, Latency & Token Usage Audit)
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

-- 10. PAYMENTS / MIDTRANS TRANSACTIONS
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

-- 11. ADMIN AUDIT LOGS (Privacy protection when admin inspects user data)
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
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON public.profiles(telegram_chat_id);

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

-- Profiles: Users can view & update their own profile; Admins can view all
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Wallets: Users can view and manage their own wallets
CREATE POLICY "Users manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id);

-- Categories: Users view system categories + manage own categories
CREATE POLICY "Users view system and own categories" ON public.categories
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users manage own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions: Users manage own transactions
CREATE POLICY "Users manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Receipt items: Users view and manage items belonging to their transactions
CREATE POLICY "Users manage own receipt items" ON public.transaction_receipt_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );

-- Export reports: Users manage own export history
CREATE POLICY "Users manage own export reports" ON public.export_reports
    FOR ALL USING (auth.uid() = user_id);

-- Payment transactions: Users view their own payments
CREATE POLICY "Users view own payments" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Admins full access policy helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies
CREATE POLICY "Admins full access to ai_providers" ON public.ai_providers_config
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to ai_logs" ON public.ai_call_logs
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to audit_logs" ON public.admin_audit_logs
    FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to payments" ON public.payment_transactions
    FOR ALL USING (public.is_admin());

-- =============================================================================
-- WALLET BALANCE TRIGGER AUTOMATION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            IF NEW.transfer_to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.transfer_to_wallet_id;
            END IF;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            IF OLD.transfer_to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_wallet_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_transaction_balance
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

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
