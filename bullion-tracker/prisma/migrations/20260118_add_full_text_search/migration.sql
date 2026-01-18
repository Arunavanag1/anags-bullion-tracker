-- Add tsvector column for full-text search on CoinReference
-- This enables fast, relevance-ranked search as the database grows

-- Add tsvector column for full-text search
ALTER TABLE "CoinReference" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "CoinReference_searchVector_idx"
ON "CoinReference" USING GIN ("searchVector");

-- Function to generate search vector from coin fields
-- Weights: A = fullName (most important), B = series, C = denomination, D = year
CREATE OR REPLACE FUNCTION coin_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW."fullName", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.series, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.denomination, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(CAST(NEW.year AS TEXT), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector on insert/update
DROP TRIGGER IF EXISTS coin_search_vector_trigger ON "CoinReference";
CREATE TRIGGER coin_search_vector_trigger
BEFORE INSERT OR UPDATE ON "CoinReference"
FOR EACH ROW EXECUTE FUNCTION coin_search_vector_update();

-- Populate existing rows by triggering update
UPDATE "CoinReference" SET "fullName" = "fullName" WHERE "searchVector" IS NULL;
