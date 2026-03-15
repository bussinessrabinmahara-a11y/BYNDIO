-- ============================================================
-- BYNDIO — Complete Production Database Schema v2
-- Run this ONCE in Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin','buyer','seller','influencer')),
    avatar_url TEXT,
    phone_number TEXT,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id),
    subscription_plan TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    total_reward_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- SELLERS
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID REFERENCES public.users(id) PRIMARY KEY,
    business_name TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT,
    business_address TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    category TEXT DEFAULT 'General',
    kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending','submitted','verified','rejected')),
    gst_verified BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free','pro','enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- INFLUENCERS
CREATE TABLE IF NOT EXISTS public.influencers (
    id UUID REFERENCES public.users(id) PRIMARY KEY,
    social_media_links JSONB DEFAULT '{}',
    total_followers INTEGER DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- PRODUCTS — 'name' column (NOT 'title') to match all frontend code
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES public.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    images TEXT[] NOT NULL DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    sku TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 18.00,
    hsn_code TEXT,
    is_active BOOLEAN DEFAULT true,
    is_sponsored BOOLEAN DEFAULT false,
    sponsored_until TIMESTAMP WITH TIME ZONE,
    is_creator_pick BOOLEAN DEFAULT false,
    creator_name TEXT,
    avg_rating DECIMAL(3,2) DEFAULT 4.5,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
    payment_method TEXT NOT NULL,
    payment_id TEXT,
    shipping_address JSONB NOT NULL DEFAULT '{}',
    affiliate_code TEXT,
    affiliate_commission DECIMAL(10,2) DEFAULT 0,
    platform_fee DECIMAL(10,2) DEFAULT 10,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    cod_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ORDER ITEMS — 'price' column (NOT 'price_at_time'), seller_id → users(id) NOT sellers(id)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    seller_id UUID REFERENCES public.users(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(product_id, user_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id) NOT NULL,
    receiver_id UUID REFERENCES public.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- SITE SETTINGS (single row)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    hero_title TEXT DEFAULT 'Shop Beyond Ordinary',
    hero_subtitle TEXT DEFAULT '0% commission for sellers. 20,000+ creators. Transparent prices.',
    footer_about TEXT DEFAULT 'India''s 0% commission social commerce ecosystem.',
    contact_email TEXT DEFAULT 'support@byndio.in',
    contact_phone TEXT DEFAULT '1800-BYNDIO',
    contact_address TEXT DEFAULT 'Mumbai, Maharashtra, India',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    CONSTRAINT site_settings_single_row CHECK (id = 1)
);
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- AFFILIATE LINKS
CREATE TABLE IF NOT EXISTS public.affiliate_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    link_code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- FLASH SALES
CREATE TABLE IF NOT EXISTS public.flash_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    discount_pct INTEGER NOT NULL CHECK (discount_pct BETWEEN 1 AND 95),
    original_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    max_quantity INTEGER NOT NULL DEFAULT 100,
    sold_quantity INTEGER DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- REWARD POINTS
CREATE TABLE IF NOT EXISTS public.reward_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    action TEXT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    total_earned DECIMAL(10,2) DEFAULT 0,
    total_withdrawn DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- RETURN REQUESTS
CREATE TABLE IF NOT EXISTS public.return_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) NOT NULL,
    order_item_id UUID REFERENCES public.order_items(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','picked_up','refunded')),
    refund_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- PRODUCT Q&A
CREATE TABLE IF NOT EXISTS public.product_qa (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES public.users(id),
    answered_at TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- RECENTLY VIEWED
CREATE TABLE IF NOT EXISTS public.recently_viewed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- B2B LEADS
CREATE TABLE IF NOT EXISTS public.b2b_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    buyer_id UUID REFERENCES public.users(id),
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    buyer_email TEXT,
    company_name TEXT,
    gst_number TEXT,
    product_category TEXT NOT NULL,
    product_description TEXT NOT NULL,
    quantity TEXT NOT NULL,
    budget TEXT,
    delivery_location TEXT NOT NULL,
    delivery_timeline TEXT,
    is_otp_verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','closed','expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- B2B LEAD ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.b2b_lead_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lead_id UUID REFERENCES public.b2b_leads(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES public.users(id) NOT NULL,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent','viewed','responded','closed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc',now()) NOT NULL
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_lead_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_select"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_insert"   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_own_update"   ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_admin_select" ON public.users FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "sellers_own"    ON public.sellers FOR ALL USING (auth.uid() = id);
CREATE POLICY "sellers_public" ON public.sellers FOR SELECT USING (true);
CREATE POLICY "influencers_own" ON public.influencers FOR ALL USING (auth.uid() = id);

CREATE POLICY "products_public"   ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "products_own"      ON public.products FOR ALL   USING (auth.uid() = seller_id);
CREATE POLICY "products_admin"    ON public.products FOR ALL   USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "orders_buyer"       ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_buyer_ins"   ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_seller_sel"  ON public.orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.order_items WHERE order_id = id AND seller_id = auth.uid()));
CREATE POLICY "orders_admin"       ON public.orders FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "oi_buyer"  ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));
CREATE POLICY "oi_seller" ON public.order_items FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "oi_insert" ON public.order_items FOR INSERT  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid()));

CREATE POLICY "reviews_public"     ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_ins"    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_own_upd"    ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "msg_own"  ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "msg_send" ON public.messages FOR INSERT  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "ss_public" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "ss_admin"  ON public.site_settings FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "aff_own"    ON public.affiliate_links FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "aff_public" ON public.affiliate_links FOR SELECT USING (is_active = true);

CREATE POLICY "fs_public" ON public.flash_sales FOR SELECT USING (true);
CREATE POLICY "fs_admin"  ON public.flash_sales FOR ALL    USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "rp_own"    ON public.reward_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rp_insert" ON public.reward_points FOR INSERT  WITH CHECK (true);

CREATE POLICY "wallet_sel"    ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallet_ins"    ON public.wallets FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallet_upd"    ON public.wallets FOR UPDATE  USING (true);

CREATE POLICY "ret_own"   ON public.return_requests FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "ret_admin" ON public.return_requests FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');

CREATE POLICY "qa_public" ON public.product_qa FOR SELECT USING (is_approved = true);
CREATE POLICY "qa_ins"    ON public.product_qa FOR INSERT  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rv_own" ON public.recently_viewed FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "b2b_ins"   ON public.b2b_leads FOR INSERT  WITH CHECK (true);
CREATE POLICY "b2b_sel"   ON public.b2b_leads FOR SELECT  USING (auth.uid() = buyer_id OR (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) IN ('admin','seller'));
CREATE POLICY "b2ba_own"  ON public.b2b_lead_assignments FOR ALL    USING (auth.uid() = supplier_id);
CREATE POLICY "b2ba_adm"  ON public.b2b_lead_assignments FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin');
CREATE POLICY "sub_own"   ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER upd_users    BEFORE UPDATE ON public.users    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_orders   BEFORE UPDATE ON public.orders   FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER upd_returns  BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || EXTRACT(EPOCH FROM now())::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END; $$;
CREATE TRIGGER set_referral_code BEFORE INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE generate_referral_code();

-- Auto-create wallet for every new user (fixes Google OAuth path)
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, total_earned, total_withdrawn)
  VALUES (NEW.id, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_user_created_wallet AFTER INSERT ON public.users FOR EACH ROW EXECUTE PROCEDURE create_user_wallet();

-- Update product avg_rating after review insert/update/delete
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_pid UUID;
BEGIN
  v_pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products SET
    avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM public.reviews WHERE product_id = v_pid),
    review_count = (SELECT COUNT(*)                       FROM public.reviews WHERE product_id = v_pid)
  WHERE id = v_pid;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER update_rating_trigger AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE update_product_rating();

-- SAFE atomic increment for reward points (no race condition)
CREATE OR REPLACE FUNCTION increment_reward_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET total_reward_points = COALESCE(total_reward_points, 0) + p_points WHERE id = p_user_id;
END; $$;

-- Award points on order delivery
CREATE OR REPLACE FUNCTION award_points_on_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_points INTEGER;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    v_points := GREATEST(1, FLOOR(NEW.total_amount / 10)::INTEGER);
    INSERT INTO public.reward_points (user_id, points, action, order_id)
      VALUES (NEW.buyer_id, v_points, 'purchase', NEW.id);
    PERFORM increment_reward_points(NEW.buyer_id, v_points);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER order_delivery_points AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE award_points_on_delivery();

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.affiliate_leaderboard AS
SELECT
  u.id, u.full_name, u.role,
  COALESCE(SUM(al.total_earnings), 0)::NUMERIC  AS total_earned,
  COALESCE(SUM(al.clicks), 0)::INTEGER           AS total_clicks,
  COALESCE(SUM(al.conversions), 0)::INTEGER      AS total_sales,
  COALESCE(COUNT(al.id), 0)::INTEGER             AS link_count,
  RANK() OVER (ORDER BY COALESCE(SUM(al.total_earnings), 0) DESC) AS rank
FROM public.users u
LEFT JOIN public.affiliate_links al ON al.user_id = u.id AND al.is_active = true
WHERE u.role IN ('influencer','seller')
GROUP BY u.id, u.full_name, u.role
ORDER BY total_earned DESC;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_cat    ON public.products(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer    ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_oi_order        ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oi_seller       ON public.order_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_prod    ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_aff_user        ON public.affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_aff_code        ON public.affiliate_links(link_code);
CREATE INDEX IF NOT EXISTS idx_msg_sender      ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_receiver    ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_flash_active    ON public.flash_sales(ends_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rp_user         ON public.reward_points(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_status      ON public.b2b_leads(status);
CREATE INDEX IF NOT EXISTS idx_rv_user         ON public.recently_viewed(user_id);
