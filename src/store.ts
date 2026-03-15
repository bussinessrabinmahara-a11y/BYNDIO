import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './lib/supabase';
import { PRODUCTS as LOCAL_PRODUCTS } from './data';

export interface Product {
  id: number | string;
  name: string;
  brand: string;
  cat: string;
  price: number;
  mrp: number;
  icon: string;
  rating: number;
  reviews: number;
  inf: boolean;
  creator?: string;
  specs: [string, string][];
  is_sponsored?: boolean;
  flash_sale?: { discount_pct: number; ends_at: string; sale_price: number } | null;
}

export interface CartItem extends Product {
  qty: number;
  affiliate_code?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'influencer' | 'admin';
  subscription_plan?: string;
  reward_points?: number;
}

export interface SiteSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string;
  footer_about: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_address: Record<string, string>;
  payment_method: string;
  created_at: string;
  order_items?: {
    id: string;
    quantity: number;
    price: number;
    products: { name: string; images: string[] } | null;
  }[];
}

export interface AffiliateLink {
  id: string;
  user_id: string;
  product_id: string;
  link_code: string;
  clicks: number;
  conversions: number;
  total_earnings: number;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
  product?: { name: string; icon?: string; price?: number };
}

export interface FlashSale {
  id: string;
  title: string;
  product_id: string;
  discount_pct: number;
  original_price: number;
  sale_price: number;
  max_quantity: number;
  sold_quantity: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  product?: { name: string; images: string[] };
}

interface AppState {
  products: Product[];
  isLoadingProducts: boolean;
  cart: CartItem[];
  wishlist: (number | string)[];
  recentlyViewed: (number | string)[];
  user: User | null;
  isAuthLoading: boolean;
  siteSettings: SiteSettings | null;
  myOrders: Order[];
  isLoadingOrders: boolean;
  affiliateLinks: AffiliateLink[];
  flashSales: FlashSale[];
  walletBalance: number;
  rewardPoints: number;

  fetchProducts: () => Promise<void>;
  fetchSiteSettings: () => Promise<void>;
  fetchMyOrders: () => Promise<void>;
  fetchAffiliateLinks: () => Promise<void>;
  fetchFlashSales: () => Promise<void>;
  fetchWalletData: () => Promise<void>;
  generateAffiliateLink: (productId: string) => Promise<string | null>;
  addRecentlyViewed: (id: number | string) => void;

  addToCart: (product: Product, qty?: number, affiliateCode?: string) => void;
  removeFromCart: (id: number | string) => void;
  updateQty: (id: number | string, delta: number) => void;
  toggleWishlist: (id: number | string) => void;
  clearCart: () => void;

  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  initAuth: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: LOCAL_PRODUCTS,
      isLoadingProducts: false,
      cart: [],
      wishlist: [],
      recentlyViewed: [],
      user: null,
      isAuthLoading: true,
      siteSettings: null,
      myOrders: [],
      isLoadingOrders: false,
      affiliateLinks: [],
      flashSales: [],
      walletBalance: 0,
      rewardPoints: 0,

      initAuth: () => {
        const buildUser = (sessionUser: any, profileData: any): User => ({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: profileData?.full_name || sessionUser.email?.split('@')[0] || 'User',
          role: (profileData?.role as User['role']) || 'buyer',
          subscription_plan: profileData?.subscription_plan,
          reward_points: profileData?.reward_points,
        });

        // Only register the auth state listener once
        if (!(window as any).__byndioAuthListenerRegistered) {
          (window as any).__byndioAuthListenerRegistered = true;
          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              // Use maybeSingle() — won't 406 if row doesn't exist yet
              supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
                .then(({ data }) => {
                  // Always log user in from session, even if profile row is missing
                  set({ user: buildUser(session.user, data), isAuthLoading: false });
                })
                .catch(() => {
                  // If DB query fails for any reason, still log in from session
                  set({ user: buildUser(session.user, null), isAuthLoading: false });
                });
            } else {
              set({ user: null, isAuthLoading: false });
            }
          });
        }

        // Always check current session on init
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
              .then(({ data }) => {
                set({ user: buildUser(session.user, data), isAuthLoading: false });
              })
              .catch(() => {
                set({ user: buildUser(session.user, null), isAuthLoading: false });
              });
          } else {
            set({ isAuthLoading: false });
          }
        });
      },

      fetchSiteSettings: async () => {
        try {
          const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).single();
          if (!error && data) set({ siteSettings: data });
        } catch {}
      },

      fetchProducts: async () => {
        set({ isLoadingProducts: true });
        try {
          const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
          if (error) throw error;
          if (data && data.length > 0) {
            set({ products: data.map(p => ({
              id: p.id, name: p.name,
              brand: p.description?.replace('Brand: ', '') || 'Brand',
              cat: p.category, price: p.price, mrp: p.mrp,
              icon: p.images?.[0] || '📦',
              rating: p.avg_rating ?? 4.5, reviews: p.review_count ?? 0,
              inf: p.is_creator_pick ?? false, creator: p.creator_name,
              specs: Object.entries(p.specifications || {}) as [string, string][],
              is_sponsored: p.is_sponsored ?? false,
            })) });
          }
        } catch { /* keep local data */ }
        finally { set({ isLoadingProducts: false }); }
      },

      fetchMyOrders: async () => {
        const { user } = get();
        if (!user) return;
        set({ isLoadingOrders: true });
        try {
          const { data } = await supabase.from('orders').select(`id,buyer_id,total_amount,status,payment_status,shipping_address,payment_method,created_at,order_items(id,quantity,price,products(name,images))`).eq('buyer_id', user.id).order('created_at', { ascending: false });
          if (data) set({ myOrders: data as Order[] });
        } catch {}
        finally { set({ isLoadingOrders: false }); }
      },

      fetchAffiliateLinks: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { data } = await supabase.from('affiliate_links').select('*, products(name, images, price)').eq('user_id', user.id).order('created_at', { ascending: false });
          if (data) set({ affiliateLinks: data.map(l => ({ ...l, product: l.products ? { name: l.products.name, icon: l.products.images?.[0] || '📦', price: l.products.price } : undefined })) });
        } catch {}
      },

      fetchFlashSales: async () => {
        try {
          const now = new Date().toISOString();
          const { data } = await supabase.from('flash_sales').select('*, products(name,images)').eq('is_active', true).gte('ends_at', now).order('ends_at');
          if (data) set({ flashSales: data });
        } catch {}
      },

      fetchWalletData: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
          const { data: points } = await supabase.from('reward_points').select('points').eq('user_id', user.id);
          const totalPoints = points?.reduce((s, p) => s + p.points, 0) ?? 0;
          set({ walletBalance: wallet?.balance ?? 0, rewardPoints: totalPoints });
        } catch {}
      },

      generateAffiliateLink: async (productId: string) => {
        const { user } = get();
        if (!user) return null;
        try {
          const code = `${user.id.slice(0,8)}-${productId.slice(0,8)}-${Date.now().toString(36)}`;
          const { data, error } = await supabase.from('affiliate_links').upsert({
            user_id: user.id, product_id: productId, link_code: code,
            commission_rate: user.role === 'influencer' ? 10 : 8,
          }, { onConflict: 'user_id,product_id' }).select().single();
          if (error) throw error;
          await get().fetchAffiliateLinks();
          return data.link_code;
        } catch { return null; }
      },

      addRecentlyViewed: (id) => {
        set(state => ({
          recentlyViewed: [id, ...state.recentlyViewed.filter(i => i !== id)].slice(0, 20),
        }));
      },

      addToCart: (product, qty = 1, affiliateCode) =>
        set(state => {
          const existing = state.cart.find(i => i.id === product.id);
          if (existing) return { cart: state.cart.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i) };
          return { cart: [...state.cart, { ...product, qty, affiliate_code: affiliateCode }] };
        }),
      removeFromCart: id => set(state => ({ cart: state.cart.filter(i => i.id !== id) })),
      updateQty: (id, delta) => set(state => ({ cart: state.cart.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i) })),
      toggleWishlist: id => set(state => ({ wishlist: state.wishlist.includes(id) ? state.wishlist.filter(w => w !== id) : [...state.wishlist, id] })),
      clearCart: () => set({ cart: [] }),
      setUser: user => set({ user }),
      logout: async () => { await supabase.auth.signOut(); set({ user: null, cart: [], wishlist: [], myOrders: [], affiliateLinks: [], walletBalance: 0, rewardPoints: 0 }); },
    }),
    { name: 'byndio-storage', partialize: state => ({ cart: state.cart, wishlist: state.wishlist, recentlyViewed: state.recentlyViewed }) }
  )
);
