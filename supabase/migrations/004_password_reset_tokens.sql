-- Password reset tokens table.
-- Stores short-lived (24h) one-time tokens generated when a user requests a
-- password reset. The admin copies the link from the Messages page and sends
-- it manually. The token is verified server-side; no Supabase recovery link is
-- used, avoiding PKCE compatibility issues.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT        NOT NULL,
  token      UUID        NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS with no policies → denies all direct client access.
-- The service-role client (supabaseAdmin) bypasses RLS and is the only accessor.
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
