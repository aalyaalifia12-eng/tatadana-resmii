-- =============================================================================
-- Migration: 20241020000001_fix_triggers_and_balance.sql
-- Fixes: Wallet balance calculation triggers to handle UPDATE as well as INSERT and DELETE.
-- Safe, non-destructive migration preserving all existing tables and data.
-- Timezone: Asia/Jakarta (WIB)
-- =============================================================================

-- 1. ENHANCED BALANCE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handling DELETE: Reverse the old transaction amount
    IF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = OLD.wallet_id;
            IF OLD.transfer_to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = OLD.transfer_to_wallet_id;
            END IF;
        END IF;
        RETURN OLD;

    -- Handling UPDATE: Reverse the old amount, then apply the new amount
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert OLD
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

        -- Apply NEW
        IF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
            IF NEW.transfer_to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.transfer_to_wallet_id;
            END IF;
        END IF;
        RETURN NEW;

    -- Handling INSERT: Apply the new transaction amount
    ELSIF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.wallet_id;
            IF NEW.transfer_to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta') WHERE id = NEW.transfer_to_wallet_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RE-ATTACH TRIGGER TO COVER INSERT, UPDATE, AND DELETE
DROP TRIGGER IF EXISTS trg_transaction_balance ON public.transactions;

CREATE TRIGGER trg_transaction_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

-- 3. FUNCTION TO RECOMPUTE WALLET BALANCES ACCORDING TO FORMULA
CREATE OR REPLACE FUNCTION public.recalculate_wallet_balance(p_wallet_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_income NUMERIC := 0;
    v_expense NUMERIC := 0;
    v_transfer_in NUMERIC := 0;
    v_transfer_out NUMERIC := 0;
    v_new_balance NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_income
    FROM public.transactions
    WHERE wallet_id = p_wallet_id AND type = 'income';

    SELECT COALESCE(SUM(amount), 0) INTO v_expense
    FROM public.transactions
    WHERE wallet_id = p_wallet_id AND type = 'expense';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_in
    FROM public.transactions
    WHERE transfer_to_wallet_id = p_wallet_id AND type = 'transfer';

    SELECT COALESCE(SUM(amount), 0) INTO v_transfer_out
    FROM public.transactions
    WHERE wallet_id = p_wallet_id AND type = 'transfer';

    v_new_balance := v_income - v_expense + v_transfer_in - v_transfer_out;

    UPDATE public.wallets
    SET balance = v_new_balance, updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
    WHERE id = p_wallet_id;

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
