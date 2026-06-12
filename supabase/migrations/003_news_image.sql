-- Add optional image_url column to business_news for owner-uploaded announcement images
ALTER TABLE business_news ADD COLUMN image_url TEXT;
