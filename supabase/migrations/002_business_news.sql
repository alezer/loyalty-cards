-- business_news: news posts published by a business owner for their customers
CREATE TABLE business_news (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID        NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_news_business ON business_news(business_id, created_at DESC);

ALTER TABLE business_news ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read news (customers browsing businesses)
CREATE POLICY "authenticated read business_news" ON business_news
  FOR SELECT TO authenticated USING (true);

-- Owner can insert/update/delete news for their own business
CREATE POLICY "owner manage business_news" ON business_news
  FOR ALL TO authenticated
  USING (get_my_role() = 'owner' AND business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'owner' AND business_id = get_my_business_id());

-- Admin can do anything
CREATE POLICY "admin all business_news" ON business_news
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER trg_business_news_updated_at
  BEFORE UPDATE ON business_news
  FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();
