-- ================================================================
-- Business details: address, opening hours, instagram, main image
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ================================================================

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS reward        TEXT,
  ADD COLUMN IF NOT EXISTS address       TEXT,
  ADD COLUMN IF NOT EXISTS opening_hours JSONB,
  ADD COLUMN IF NOT EXISTS instagram     TEXT,
  ADD COLUMN IF NOT EXISTS image_url     TEXT;

-- ── opening_hours shape (for reference) ──────────────────────────
-- {
--   "monday":    { "open": "09:00", "close": "18:00" },
--   "tuesday":   { "open": "09:00", "close": "18:00" },
--   "wednesday": { "open": "09:00", "close": "18:00" },
--   "thursday":  { "open": "09:00", "close": "18:00" },
--   "friday":    { "open": "09:00", "close": "14:00" },
--   "saturday":  null,
--   "sunday":    null
-- }
