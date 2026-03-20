-- ============================================================
-- AgriLink X – Full Backend SQL Migration
-- Run this entire script in your Supabase SQL editor
-- ============================================================

-- ─── Products ────────────────────────────────────────────────
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

-- ─── Orders ─────────────────────────────────────────────────
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

-- ─── Messages / Conversations ─────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message  text,
  last_at       timestamptz DEFAULT now(),
  unread_a      int DEFAULT 0,
  unread_b      int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (participant_a, participant_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text NOT NULL,
  read            boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ─── Crop Events (Crop Calendar) ─────────────────────────────
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

-- ─── Profile ID Verification ──────────────────────────────────
CREATE TABLE IF NOT EXISTS id_verifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  doc_url     text,
  status      text NOT NULL DEFAULT 'unverified'
              CHECK (status IN ('unverified','pending','verified','rejected')),
  reviewer_note text,
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

-- ─── Storage Buckets ─────────────────────────────────────────
-- Run these individually if you don't have them already
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-media', 'product-media', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('id-documents', 'id-documents', false)
  ON CONFLICT (id) DO NOTHING;

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read, only farmer-owner can write
CREATE POLICY "products_public_read"  ON products FOR SELECT USING (true);
CREATE POLICY "products_owner_insert" ON products FOR INSERT WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "products_owner_update" ON products FOR UPDATE USING (farmer_id = auth.uid());
CREATE POLICY "products_owner_delete" ON products FOR DELETE USING (farmer_id = auth.uid());

-- Orders: buyer and farmer can read their own orders
CREATE POLICY "orders_parties_read"  ON orders FOR SELECT USING (buyer_id = auth.uid() OR farmer_id = auth.uid());
CREATE POLICY "orders_buyer_insert"  ON orders FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "orders_farmer_update" ON orders FOR UPDATE USING (farmer_id = auth.uid() OR buyer_id = auth.uid());

-- Conversations & Messages: only participants
CREATE POLICY "conv_participants_read" ON conversations FOR SELECT USING (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "conv_participants_insert" ON conversations FOR INSERT WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "conv_participants_update" ON conversations FOR UPDATE USING (participant_a = auth.uid() OR participant_b = auth.uid());

CREATE POLICY "msg_participants_read" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())));
CREATE POLICY "msg_sender_insert" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Crop events: farmer owns their own
CREATE POLICY "crop_events_owner" ON crop_events FOR ALL USING (farmer_id = auth.uid());

-- ID verifications: user can only see/edit their own
CREATE POLICY "id_ver_owner_read"   ON id_verifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "id_ver_owner_insert" ON id_verifications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "id_ver_owner_update" ON id_verifications FOR UPDATE USING (user_id = auth.uid());

-- Storage policies
CREATE POLICY "product_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "product_media_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-media' AND auth.role() = 'authenticated');
CREATE POLICY "id_docs_owner_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "id_docs_owner_read"   ON storage.objects FOR SELECT USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ─── Updated-at trigger function ─────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER products_updated_at    BEFORE UPDATE ON products    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at      BEFORE UPDATE ON orders      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER crop_events_updated_at BEFORE UPDATE ON crop_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Backfill for deployments that were created before cover_image_url was added
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cover_image_url text;
