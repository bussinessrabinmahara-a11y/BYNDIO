# BYNDIO — India's Zero-Commission Marketplace

> **SHOP • SELL • EARN** — B2C + B2B + Influencer + Affiliate + Dropshipping

---

## 🚀 Quick Deploy (Netlify + Supabase)

### Step 1: Set Up Supabase
1. Go to [supabase.com](https://supabase.com) → New Project
2. **SQL Editor → New Query** → paste `supabase_schema.sql` → Run
3. **Project Settings → API** → copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
4. *(Optional)* Enable Google OAuth: **Authentication → Providers → Google**

### Step 2: Deploy to Netlify
1. Push this project to GitHub
2. Netlify → **Add New Site → Import from Git**
3. Build settings (auto from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Site Settings → Environment Variables** → Add:
   ```
   VITE_SUPABASE_URL      = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...
   NODE_VERSION           = 18
   ```
5. **Trigger Deploy**

### Step 3: Make Yourself Admin
After registering on your site, run in **Supabase → SQL Editor**:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🏗️ Project Structure

```
BYNDIO/
├── src/
│   ├── pages/
│   │   ├── Home.tsx              # Landing page
│   │   ├── Products.tsx          # Product listing + filter
│   │   ├── ProductDetail.tsx     # Product detail + reviews
│   │   ├── Checkout.tsx          # Multi-step checkout
│   │   ├── MyOrders.tsx          # Order history + tracking
│   │   ├── Invoices.tsx          # NEW: Download GST invoices
│   │   ├── Returns.tsx           # Return/refund requests
│   │   ├── Wishlist.tsx          # Product wishlist
│   │   ├── Compare.tsx           # Product comparison
│   │   ├── FlashSales.tsx        # Live flash deals
│   │   ├── RewardsWallet.tsx     # Wallet + reward points
│   │   ├── Gamification.tsx      # NEW: Badges + levels + perks
│   │   ├── Notifications.tsx     # NEW: Notification center
│   │   ├── KYC.tsx               # NEW: Identity verification
│   │   ├── Seller.tsx            # Seller landing page
│   │   ├── Dashboard.tsx         # Seller dashboard
│   │   ├── B2B.tsx               # B2B Supply marketplace
│   │   ├── SupplierLeads.tsx     # B2B lead inbox
│   │   ├── Influencer.tsx        # Creator Hub landing
│   │   ├── CreatorDashboard.tsx  # Creator earnings dashboard
│   │   ├── CreatorStorefront.tsx # Public creator profile
│   │   ├── Campaigns.tsx         # NEW: Brand campaign marketplace
│   │   ├── Affiliate.tsx         # Affiliate program
│   │   ├── Leaderboard.tsx       # Rankings
│   │   ├── Dropshipping.tsx      # NEW: Byndio Express
│   │   ├── Messages.tsx          # Direct messaging
│   │   └── Admin.tsx             # Full admin panel
│   ├── components/
│   │   ├── Navbar.tsx            # Navigation + user menu
│   │   ├── LoginModal.tsx        # Auth modal (fixed)
│   │   ├── CartDrawer.tsx        # Slide-out cart
│   │   ├── ProductCard.tsx       # Product card
│   │   └── Toast.tsx             # Toast notifications
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── validators.ts         # Form validators
│   │   └── gstInvoice.ts         # Invoice generator
│   └── store.ts                  # Global state (fixed)
├── supabase_schema.sql           # Complete DB setup
├── netlify.toml                  # Netlify config
└── README.md                     # This file
```

---

## ✅ Features

### All Users
- Email/Password + Google OAuth login
- Role-based access (buyer/seller/influencer/admin)
- KYC verification flow
- Notifications center
- Badges, levels & loyalty perks
- Reward points + referral bonuses

### Customer (B2C)
- Product search, filter, compare
- Cart, wishlist, checkout
- UPI / Card / COD payment
- Order tracking
- Return/refund requests
- GST invoice download
- Ratings & reviews

### Seller
- Dashboard: products, orders, analytics
- Add/edit/delete products + bulk CSV upload
- Inventory & SKU management
- Wallet & withdrawal requests

### Creator (Influencer)
- Affiliate link generator + promo codes
- Campaign Marketplace — apply to brand deals
- Click/conversion tracking
- Earnings dashboard + leaderboard

### B2B (Byndio Supply)
- Bulk catalog + MOQ pricing
- Supplier lead inbox
- Subscription plans

### Dropshipping (Byndio Express)
- Browse 500+ verified suppliers
- One-click catalog import
- Auto order forwarding (UI + settings ready)
- Margin calculator

### Admin Panel
- Live orders & platform stats
- Product management (add/edit/delete/toggle)
- User management (sellers/buyers/creators)
- Flash sale creation
- Site content editor
- Revenue dashboard

---

## 🗄️ Database Tables (19 total)

| Table | Purpose |
|-------|---------|
| `users` | All user profiles + roles |
| `kyc_submissions` | KYC verification data |
| `products` | Product catalog |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `reviews` | Ratings & reviews |
| `sellers` | Seller business info |
| `influencers` | Creator profiles |
| `affiliate_links` | Affiliate links |
| `wallets` | Wallet balances |
| `reward_points` | Points log |
| `flash_sales` | Flash sale events |
| `site_settings` | Admin content |
| `messages` | Direct messages |
| `returns` | Return requests |
| `notifications` | User notifications |
| `campaign_applications` | Campaign applications |
| `withdrawal_requests` | Withdrawal requests |

---

## 🔧 Local Development

```bash
npm install
# Create .env.local:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
npm run dev
```

---

## 🚦 Features Needing Extra Setup

| Feature | Status | Needs |
|---------|--------|-------|
| Push Notifications | UI ready | Firebase FCM |
| Biometric Login | Placeholder | Mobile app |
| Payment Gateway | UI ready | Razorpay/PayU |
| Document Upload (KYC) | Placeholder | Supabase Storage |
| Supplier API Sync | UI ready | Supplier API keys |
| Real-time Chat | Basic UI | Supabase Realtime |

---

*React + TypeScript + Vite + Tailwind CSS + Supabase + Netlify*
