
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('farmer_free', 'farmer_pro', 'buyer_enterprise');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  county TEXT,
  farm_size TEXT,
  main_crops TEXT[],
  photo_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's current role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Auto-create profile and assign farmer_free role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'farmer_free');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Feature flags table (admin-managed)
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  enabled_for app_role[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);

-- Seed feature flags
INSERT INTO public.feature_flags (feature_key, enabled_for, description) VALUES
  ('ai_price_guidance', '{farmer_free,farmer_pro,buyer_enterprise}', 'Basic AI price guidance'),
  ('ai_crop_advisor', '{farmer_pro,buyer_enterprise}', 'Advanced AI crop & profit advisor'),
  ('unlimited_listings', '{farmer_pro,buyer_enterprise}', 'Unlimited product listings'),
  ('voice_interface', '{farmer_pro,buyer_enterprise}', 'Voice-assisted interface'),
  ('micro_loans', '{farmer_pro}', 'Micro-loan access'),
  ('smart_logistics', '{farmer_pro,buyer_enterprise}', 'Automated delivery matching'),
  ('contract_farming', '{buyer_enterprise}', 'Contract farming module'),
  ('bulk_orders', '{buyer_enterprise}', 'Bulk order management'),
  ('predictive_analytics', '{buyer_enterprise}', 'AI supply & demand forecasting'),
  ('escrow_payments', '{farmer_free,farmer_pro,buyer_enterprise}', 'M-Pesa escrow system'),
  ('community_access', '{farmer_free,farmer_pro,buyer_enterprise}', 'Community tips & alerts'),
  ('sales_analytics', '{farmer_pro,buyer_enterprise}', 'Real-time sales analytics'),
  ('priority_search', '{farmer_pro}', 'Priority in buyer search results'),
  ('export_reports', '{buyer_enterprise}', 'Export reports & projections');
