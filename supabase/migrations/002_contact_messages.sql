-- ── contact_messages ──────────────────────────────────────────────
CREATE TABLE contact_messages (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit a message
CREATE POLICY "contact_messages: authenticated insert"
  ON contact_messages FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only admins can read messages
CREATE POLICY "contact_messages: admin select"
  ON contact_messages FOR SELECT TO authenticated
  USING (is_admin());
