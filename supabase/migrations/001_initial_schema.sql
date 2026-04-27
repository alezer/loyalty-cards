-- ================================================================
-- LOYALTY CARDS PWA — Initial Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

-- ── 1. Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Enum ───────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'staff', 'customer');

-- ── 3. businesses ─────────────────────────────────────────────────
-- Created before profiles to avoid circular FK dependency.
CREATE TABLE businesses (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  logo_url     TEXT,
  stamps_goal  INTEGER     NOT NULL DEFAULT 10 CHECK (stamps_goal > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. profiles ───────────────────────────────────────────────────
-- Extends auth.users. Auto-populated by trigger on user sign-up.
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  full_name   TEXT,
  role        user_role   NOT NULL DEFAULT 'customer',
  business_id UUID        REFERENCES businesses(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. loyalty_cards ──────────────────────────────────────────────
-- One card per (customer, business) pair. UNIQUE enforced.
CREATE TABLE loyalty_cards (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id  UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stamps_count INTEGER     NOT NULL DEFAULT 0 CHECK (stamps_count >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, business_id)
);

CREATE INDEX idx_loyalty_cards_customer ON loyalty_cards(customer_id);
CREATE INDEX idx_loyalty_cards_business ON loyalty_cards(business_id);

-- ── 6. stamps_log ─────────────────────────────────────────────────
-- Immutable audit log of every stamp applied.
CREATE TABLE stamps_log (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id    UUID        NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  staff_id   UUID        NOT NULL REFERENCES profiles(id)      ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Critical index for the anti-fraud query (latest stamp per card)
CREATE INDEX idx_stamps_log_card_time ON stamps_log(card_id, created_at DESC);

-- ── 7. rewards ────────────────────────────────────────────────────
-- Auto-generated when stamps_count reaches stamps_goal.
CREATE TABLE rewards (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id           UUID        NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  reward_code       TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  is_redeemed       BOOLEAN     NOT NULL DEFAULT FALSE,
  redeemed_at       TIMESTAMPTZ,
  staff_id_redeemer UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rewards_card ON rewards(card_id);

-- ================================================================
-- Helper functions (used in RLS policies)
-- SECURITY DEFINER avoids infinite recursion when profiles calls itself.
-- ================================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ================================================================
-- Trigger: auto-update updated_at on every row change
-- ================================================================

CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_loyalty_cards_updated_at
  BEFORE UPDATE ON loyalty_cards
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

-- ================================================================
-- Trigger: auto-create profile when a user signs up
-- Works for both Email/Password and Google OAuth.
-- ================================================================

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',  -- Google OAuth field
      NEW.raw_user_meta_data->>'name',       -- fallback
      ''
    ),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ================================================================
-- Trigger: auto-fill redeemed_at + staff_id_redeemer on reward redeem
-- ================================================================

CREATE OR REPLACE FUNCTION fn_handle_reward_redeem()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_redeemed = TRUE AND OLD.is_redeemed = FALSE THEN
    NEW.redeemed_at       = NOW();
    NEW.staff_id_redeemer = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_on_reward_redeem
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION fn_handle_reward_redeem();

-- ================================================================
-- MAIN TRIGGER: Anti-fraud check + stamp counter + reward generation
--
-- Fires BEFORE INSERT on stamps_log so it can:
--   1. Abort the operation if the same card was stamped < 1 min ago
--   2. Increment loyalty_cards.stamps_count
--   3. Auto-generate a reward if stamps_goal is reached
-- ================================================================

CREATE OR REPLACE FUNCTION fn_process_stamp_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id     UUID;
  v_last_stamp_time TIMESTAMPTZ;
  v_new_count       INTEGER;
  v_stamps_goal     INTEGER;
  v_seconds_elapsed NUMERIC;
BEGIN
  -- Resolve business from the card
  SELECT business_id INTO v_business_id
  FROM   loyalty_cards
  WHERE  id = NEW.card_id;

  -- ── Anti-fraud: check last stamp on this card ─────────────────
  -- We check the card (= same customer + same business), regardless
  -- of which staff member applied the previous stamp.
  SELECT MAX(created_at) INTO v_last_stamp_time
  FROM   stamps_log
  WHERE  card_id = NEW.card_id;
  -- The index idx_stamps_log_card_time makes this fast.

  IF v_last_stamp_time IS NOT NULL THEN
    v_seconds_elapsed := EXTRACT(EPOCH FROM (NOW() - v_last_stamp_time));

    IF v_seconds_elapsed < 60 THEN
      RAISE EXCEPTION 'Escaneo duplicado detectado'
        USING
          ERRCODE = 'P0001',
          DETAIL  = format(
            'Último sello hace %s segundos. Mínimo requerido: 60 segundos.',
            ROUND(v_seconds_elapsed)::TEXT
          ),
          HINT = 'Espere al menos 1 minuto antes de escanear al mismo cliente.';
    END IF;
  END IF;

  -- ── Increment stamps_count ────────────────────────────────────
  UPDATE loyalty_cards
  SET    stamps_count = stamps_count + 1,
         updated_at   = NOW()
  WHERE  id = NEW.card_id
  RETURNING stamps_count INTO v_new_count;

  -- ── Auto-generate reward if goal is reached ───────────────────
  -- Recurring model: reward every N stamps (10, 20, 30 …)
  SELECT stamps_goal INTO v_stamps_goal
  FROM   businesses
  WHERE  id = v_business_id;

  IF v_new_count % v_stamps_goal = 0 THEN
    INSERT INTO rewards (card_id)
    VALUES (NEW.card_id);
  END IF;

  RETURN NEW; -- Allow the stamps_log INSERT to proceed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_stamp_insert
  BEFORE INSERT ON stamps_log
  FOR EACH ROW EXECUTE FUNCTION fn_process_stamp_insert();

-- ================================================================
-- Public RPC: add_stamp
--
-- Single entry point for stamping a customer from the frontend
-- (or backend). Handles card auto-creation and delegates to the
-- trigger for anti-fraud + counting.
--
-- Security: caller must be staff of the target business or admin.
-- auth.uid() is available because the client passes its JWT.
-- ================================================================

CREATE OR REPLACE FUNCTION add_stamp(
  p_customer_id UUID,
  p_business_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_caller_role user_role;
  v_caller_biz  UUID;
  v_card_id     UUID;
  v_result      JSON;
BEGIN
  -- Who is calling?
  SELECT role, business_id
  INTO   v_caller_role, v_caller_biz
  FROM   profiles
  WHERE  id = auth.uid();

  -- Only staff of the correct business (or admin) may add stamps
  IF NOT (
       (v_caller_role = 'staff' AND v_caller_biz = p_business_id)
    OR  v_caller_role = 'admin'
  ) THEN
    RAISE EXCEPTION 'No autorizado: solo el staff del comercio puede agregar sellos'
      USING ERRCODE = 'P0002';
  END IF;

  -- Validate the target is a customer
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_customer_id AND role = 'customer'
  ) THEN
    RAISE EXCEPTION 'Cliente no encontrado o inválido'
      USING ERRCODE = 'P0003';
  END IF;

  -- Get or create the loyalty card for this (customer, business) pair
  INSERT INTO loyalty_cards (customer_id, business_id)
  VALUES (p_customer_id, p_business_id)
  ON CONFLICT (customer_id, business_id) DO NOTHING;

  SELECT id INTO v_card_id
  FROM   loyalty_cards
  WHERE  customer_id = p_customer_id
    AND  business_id = p_business_id;

  -- Insert stamp — trg_on_stamp_insert fires here
  INSERT INTO stamps_log (card_id, staff_id)
  VALUES (v_card_id, auth.uid());

  -- Build the response
  SELECT json_build_object(
    'success',          true,
    'card_id',          lc.id,
    'stamps_count',     lc.stamps_count,
    'stamps_goal',      b.stamps_goal,
    'reward_available', EXISTS(
                          SELECT 1 FROM rewards r
                          WHERE r.card_id    = lc.id
                            AND r.is_redeemed = FALSE
                        )
  )
  INTO v_result
  FROM loyalty_cards lc
  JOIN businesses b ON b.id = lc.business_id
  WHERE lc.id = v_card_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Row Level Security
-- ================================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards       ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────────────

CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles: admin read all"
  ON profiles FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "profiles: owner read business members"
  ON profiles FOR SELECT TO authenticated
  USING (
    get_my_role() = 'owner'
    AND (
      (role = 'staff' AND business_id = get_my_business_id())
      OR EXISTS (
        SELECT 1 FROM loyalty_cards lc
        WHERE lc.customer_id = profiles.id
          AND lc.business_id = get_my_business_id()
      )
    )
  );

CREATE POLICY "profiles: staff read customers"
  ON profiles FOR SELECT TO authenticated
  USING (
    get_my_role() = 'staff'
    AND EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.customer_id = profiles.id
        AND lc.business_id = get_my_business_id()
    )
  );

-- Users can update their own profile, but cannot change their own role
CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles: admin update all"
  ON profiles FOR UPDATE TO authenticated
  USING (is_admin());

-- ── BUSINESSES ────────────────────────────────────────────────────

CREATE POLICY "businesses: all read"
  ON businesses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "businesses: owner update own"
  ON businesses FOR UPDATE TO authenticated
  USING (
    get_my_role() = 'owner'
    AND id = get_my_business_id()
  );

CREATE POLICY "businesses: admin all"
  ON businesses FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "businesses: insert owner or admin"
  ON businesses FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR get_my_role() = 'owner');

-- ── LOYALTY_CARDS ─────────────────────────────────────────────────

CREATE POLICY "cards: customer own"
  ON loyalty_cards FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "cards: business staff owner"
  ON loyalty_cards FOR SELECT TO authenticated
  USING (
    business_id = get_my_business_id()
    AND get_my_role() IN ('staff', 'owner')
  );

CREATE POLICY "cards: admin all"
  ON loyalty_cards FOR ALL TO authenticated
  USING (is_admin());

-- ── STAMPS_LOG ────────────────────────────────────────────────────
-- CRITICAL: Staff can only insert stamps for cards in their OWN business.

CREATE POLICY "stamps: staff insert own business"
  ON stamps_log FOR INSERT TO authenticated
  WITH CHECK (
    get_my_role() = 'staff'
    AND staff_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.business_id = get_my_business_id()
    )
  );

CREATE POLICY "stamps: admin insert"
  ON stamps_log FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "stamps: business read"
  ON stamps_log FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('staff', 'owner')
    AND EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.business_id = get_my_business_id()
    )
  );

CREATE POLICY "stamps: customer own read"
  ON stamps_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.customer_id = auth.uid()
    )
  );

CREATE POLICY "stamps: admin read all"
  ON stamps_log FOR SELECT TO authenticated
  USING (is_admin());

-- ── REWARDS ───────────────────────────────────────────────────────

CREATE POLICY "rewards: customer own"
  ON rewards FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.customer_id = auth.uid()
    )
  );

CREATE POLICY "rewards: business read"
  ON rewards FOR SELECT TO authenticated
  USING (
    get_my_role() IN ('staff', 'owner')
    AND EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.business_id = get_my_business_id()
    )
  );

-- Staff/Owner can mark rewards as redeemed, but can never un-redeem them.
CREATE POLICY "rewards: staff owner redeem"
  ON rewards FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('staff', 'owner')
    AND is_redeemed = FALSE
    AND EXISTS (
      SELECT 1 FROM loyalty_cards lc
      WHERE lc.id          = card_id
        AND lc.business_id = get_my_business_id()
    )
  )
  WITH CHECK (is_redeemed = TRUE);

CREATE POLICY "rewards: admin all"
  ON rewards FOR ALL TO authenticated
  USING (is_admin());
