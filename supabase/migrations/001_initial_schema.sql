-- ================================================================
-- AgriLink X – Supabase Migration 001: Initial Schema
-- Apply in: Supabase Dashboard → SQL Editor (paste & run)
-- Or via CLI: supabase db push
-- ================================================================

-- ─── Products ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  category      text NOT NULL DEFAULT 'Other',
  price_per_unit numeric(10,2) NOT NULL,
  unit          text NOT NULL DEFAULT 'kg',
  stock         numeric(10,2) NOT NULL DEFAULT 0,
  description   text,
  image_emoji   text DEFAULT '📦',
  video_url     text,
  is_organic    boolean DEFAULT false,
  is_available  boolean DEFAULT true,
  location      text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── Profiles ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name     text,
  county        text,
  phone         text,
  bio           text,
  farm_size     text,
  main_crops    text[],
  photo_url     text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── Orders ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  buyer_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity      numeric(10,2) NOT NULL,
  unit          text NOT NULL,
  total_price   numeric(10,2) NOT NULL,
  delivery_fee  numeric(10,2) DEFAULT 50,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method text DEFAULT 'mpesa',
  payment_ref   text,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ─── Conversations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message  text,
  last_at       timestamptz DEFAULT now(),
  unread_a      int DEFAULT 0,
  unread_b      int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  CHECK (participant_a <> participant_b),
  UNIQUE (participant_a, participant_b)
);

-- ─── Messages ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL,
  read            boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ─── Product Likes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_likes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- ─── Product Ratings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_ratings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- ─── Crop Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crop_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  crop        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('planting','fertilizing','spraying','harvesting','irrigation','pruning')),
  event_date  date NOT NULL,
  notes       text,
  done        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ─── ID Verifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS id_verifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  doc_url       text,
  front_doc_url text,
  back_doc_url  text,
  status        text NOT NULL DEFAULT 'unverified'
                CHECK (status IN ('unverified','pending','verified','rejected')),
  reviewer_note text,
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ─── Storage Buckets ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-media', 'product-media', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('id-documents', 'id-documents', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile-photos', 'profile-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- ─── Row Level Security (RLS) ────────────────────────────────────
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;

-- Products
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_owner_insert" ON products;
DROP POLICY IF EXISTS "products_owner_update" ON products;
DROP POLICY IF EXISTS "products_owner_delete" ON products;
CREATE POLICY "products_public_read"  ON products FOR SELECT USING (true);
CREATE POLICY "products_owner_insert" ON products FOR INSERT WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "products_owner_update" ON products FOR UPDATE USING (farmer_id = auth.uid());
CREATE POLICY "products_owner_delete" ON products FOR DELETE USING (farmer_id = auth.uid());

-- Profiles
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_public_read"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_owner_update" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Orders
DROP POLICY IF EXISTS "orders_parties_read" ON orders;
DROP POLICY IF EXISTS "orders_buyer_insert" ON orders;
DROP POLICY IF EXISTS "orders_parties_update" ON orders;
CREATE POLICY "orders_parties_read"    ON orders FOR SELECT  USING (buyer_id = auth.uid() OR farmer_id = auth.uid());
CREATE POLICY "orders_buyer_insert"    ON orders FOR INSERT  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_parties_update"  ON orders FOR UPDATE  USING (buyer_id = auth.uid() OR farmer_id = auth.uid());

-- Conversations
DROP POLICY IF EXISTS "conv_participants" ON conversations;
CREATE POLICY "conv_participants"  ON conversations FOR ALL
  USING (participant_a = auth.uid() OR participant_b = auth.uid())
  WITH CHECK (
    (participant_a = auth.uid() OR participant_b = auth.uid())
    AND participant_a <> participant_b
    AND participant_a < participant_b
  );

-- Messages
DROP POLICY IF EXISTS "msg_participants_read" ON messages;
DROP POLICY IF EXISTS "msg_sender_insert" ON messages;
CREATE POLICY "msg_participants_read" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())));
CREATE POLICY "msg_sender_insert"     ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_id
      AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
  )
);

-- Product likes
DROP POLICY IF EXISTS "product_likes_public_read" ON product_likes;
DROP POLICY IF EXISTS "product_likes_owner_insert" ON product_likes;
DROP POLICY IF EXISTS "product_likes_owner_delete" ON product_likes;
CREATE POLICY "product_likes_public_read" ON product_likes FOR SELECT USING (true);
CREATE POLICY "product_likes_owner_insert" ON product_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "product_likes_owner_delete" ON product_likes FOR DELETE USING (user_id = auth.uid());

-- Product ratings
DROP POLICY IF EXISTS "product_ratings_public_read" ON product_ratings;
DROP POLICY IF EXISTS "product_ratings_owner_insert" ON product_ratings;
DROP POLICY IF EXISTS "product_ratings_owner_update" ON product_ratings;
CREATE POLICY "product_ratings_public_read" ON product_ratings FOR SELECT USING (true);
CREATE POLICY "product_ratings_owner_insert" ON product_ratings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "product_ratings_owner_update" ON product_ratings FOR UPDATE USING (user_id = auth.uid());

-- Crop events
DROP POLICY IF EXISTS "crop_events_owner" ON crop_events;
CREATE POLICY "crop_events_owner" ON crop_events FOR ALL USING (farmer_id = auth.uid());

-- ID verifications
DROP POLICY IF EXISTS "id_ver_owner" ON id_verifications;
CREATE POLICY "id_ver_owner" ON id_verifications FOR ALL USING (user_id = auth.uid());

-- Storage
DROP POLICY IF EXISTS "product_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "product_media_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "id_docs_owner_upload" ON storage.objects;
DROP POLICY IF EXISTS "id_docs_owner_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "profile_photos_owner_upload" ON storage.objects;
CREATE POLICY "product_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "product_media_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-media' AND auth.role() = 'authenticated');
CREATE POLICY "id_docs_owner_upload"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_docs_owner_read"        ON storage.objects FOR SELECT USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "profile_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "profile_photos_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Realtime ─────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- ─── Auto-update timestamps ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at    BEFORE UPDATE ON products    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at    BEFORE UPDATE ON profiles    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at      BEFORE UPDATE ON orders      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS crop_events_updated_at ON crop_events;
CREATE TRIGGER crop_events_updated_at BEFORE UPDATE ON crop_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS product_ratings_updated_at ON product_ratings;
CREATE TRIGGER product_ratings_updated_at BEFORE UPDATE ON product_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
