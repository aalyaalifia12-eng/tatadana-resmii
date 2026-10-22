-- =============================================================================
-- TataDana SaaS Database Migration: User Approval System & Role Security
-- Migration: 20241020000002_user_approval_and_roles.sql
-- Enforces:
-- 1. approval_status ('pending', 'approved', 'rejected', 'suspended')
-- 2. Strict Role Separation ('user', 'admin', 'superadmin')
-- 3. Prevent Privilege Escalation via database trigger
-- 4. RLS update: only 'approved' users can access financial data
-- 5. Safe Admin Provisioning
-- =============================================================================

-- 1. Add approval columns to profiles
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Create index for fast status lookups and admin pending queries
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Function to check if the caller is an active approved user
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

-- 4. Function to check if caller is an approved admin/superadmin
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

-- 5. Trigger to strictly prevent non-admin users from escalating their own role or approval_status
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if someone is trying to alter role, approval_status, approved_by, or approved_at
    IF (NEW.role IS DISTINCT FROM OLD.role) OR
       (NEW.approval_status IS DISTINCT FROM OLD.approval_status) OR
       (NEW.approved_by IS DISTINCT FROM OLD.approved_by) OR
       (NEW.approved_at IS DISTINCT FROM OLD.approved_at) THEN
       
        -- Only an approved admin or system service role can modify these administrative columns
        IF NOT public.is_active_admin() AND auth.role() <> 'service_role' THEN
            RAISE EXCEPTION 'Akses Ditolak: Pengguna biasa tidak memiliki izin mengubah role atau status persetujuan akun.';
        END IF;
    END IF;

    -- Update updated_at timestamp
    NEW.updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- 6. Update Row Level Security (RLS) policies for user data isolation
-- Only approved users can query or modify wallets, transactions, categories, export_reports

-- Transactions: Only approved user owner
DROP POLICY IF EXISTS "Users manage own transactions" ON public.transactions;
CREATE POLICY "Approved users manage own transactions" ON public.transactions
    FOR ALL USING (
        auth.uid() = user_id AND public.is_approved_user()
    );

-- Wallets: Only approved user owner
DROP POLICY IF EXISTS "Users manage own wallets" ON public.wallets;
CREATE POLICY "Approved users manage own wallets" ON public.wallets
    FOR ALL USING (
        auth.uid() = user_id AND public.is_approved_user()
    );

-- Categories: Only approved user owner + system categories
DROP POLICY IF EXISTS "Users view system and own categories" ON public.categories;
DROP POLICY IF EXISTS "Users manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Users update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users delete own categories" ON public.categories;

CREATE POLICY "Approved users view system and own categories" ON public.categories
    FOR SELECT USING (
        is_system = true OR (auth.uid() = user_id AND public.is_approved_user())
    );

CREATE POLICY "Approved users manage own categories" ON public.categories
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND public.is_approved_user()
    );

CREATE POLICY "Approved users update own categories" ON public.categories
    FOR UPDATE USING (
        auth.uid() = user_id AND public.is_approved_user()
    );

CREATE POLICY "Approved users delete own categories" ON public.categories
    FOR DELETE USING (
        auth.uid() = user_id AND public.is_approved_user()
    );

-- Profiles: Admin can view all profiles for approval; Users can only view own profile
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles" ON public.profiles
    FOR ALL USING (public.is_active_admin());

-- 7. Provision the Initial Superadmin safely
-- usr_tatadana_demo_01 is provisioned as superadmin and approved
UPDATE public.profiles
SET 
    role = 'superadmin',
    approval_status = 'approved',
    email = COALESCE(email, 'admin@tatadana.id'),
    approved_at = NOW() AT TIME ZONE 'Asia/Jakarta'
WHERE id = 'usr_tatadana_demo_01'::uuid OR phone_number = '081234567890';
