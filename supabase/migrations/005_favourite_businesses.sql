-- Customers can save favourite businesses

CREATE TABLE public.favourite_businesses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, business_id)
);

ALTER TABLE public.favourite_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers can view own favourites"
  ON public.favourite_businesses FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "customers can insert own favourites"
  ON public.favourite_businesses FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "customers can delete own favourites"
  ON public.favourite_businesses FOR DELETE
  USING (auth.uid() = customer_id);
