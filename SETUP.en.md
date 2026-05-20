# ShopRay — Setup Guide

**Version:** 1.8.0 | **Last updated:** 2026-05-20

This guide walks you step by step through setting up your ShopRay template —
from installation to a fully live shop.

---

## Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Connecting Supabase](#5-connecting-supabase)
6. [Connecting Stripe](#6-connecting-stripe)
7. [Backend & Webhook](#7-backend--webhook)
8. [Email Setup](#8-email-setup)
9. [Invoice Setup](#9-invoice-setup)
10. [DHL Shipping Labels](#10-dhl-shipping-labels)
11. [Push Notifications](#11-push-notifications)
12. [Choosing a Theme](#12-choosing-a-theme)
13. [Shop Name & Company Details](#13-shop-name--company-details)
14. [Enabling or Disabling Features](#14-enabling-or-disabling-features)
15. [Adding Products](#15-adding-products)
16. [Legal Pages](#16-legal-pages)
17. [Admin Panel Setup](#17-admin-panel-setup)
18. [Deployment](#18-deployment)
19. [Packages — What's included?](#19-packages--whats-included)
20. [Technology & Open Source](#20-technology--open-source)
21. [Marketing, SEO & GEO](#21-marketing-seo--geo)

---

## 1. Prerequisites

Before you start, make sure the following are installed:

| Program | Version | Download |
|---|---|---|
| **Node.js** | 18 or newer | https://nodejs.org |
| **npm** | included with Node.js | — |
| **Git** | any | https://git-scm.com |

You will also need accounts at:
- **Supabase** (free) — https://supabase.com
- **Stripe** (free, fees per transaction only) — https://stripe.com
- **Vercel** (free) — https://vercel.com

---

## 2. Installation

ShopRay consists of three separate projects in one repository: **Frontend**, **Backend**, and **Admin**.

### Step 1 — Install dependencies

Open your terminal and run:

```bash
# Frontend
cd ShopRay/Frontend && npm install

# Backend
cd ../Backend && npm install

# Admin
cd ../Admin && npm install
```

### Step 2 — Prepare environment variables

Each project has its own `.env` file:

```bash
cp ShopRay/Frontend/.env.example ShopRay/Frontend/.env
cp ShopRay/Backend/.env.example  ShopRay/Backend/.env
cp ShopRay/Admin/.env.example    ShopRay/Admin/.env
```

### Step 3 — Start development servers

```bash
# Terminal 1 — Frontend
cd ShopRay/Frontend && npm run dev   # → http://localhost:5173

# Terminal 2 — Backend
cd ShopRay/Backend && npm run dev    # → http://localhost:5000

# Terminal 3 — Admin
cd ShopRay/Admin && npm run dev      # → http://localhost:5174
```

---

## 3. Environment Variables

> **Important:** `.env` files must **never** be committed to Git. They are already listed in `.gitignore`.

### Frontend/.env

```env
VITE_API_URL=https://api.yourshop.com          # Your backend URL
VITE_SUPABASE_URL=https://xxxx.supabase.co     # Supabase project URL
VITE_SUPABASE_ANON_KEY=eyJ...                  # Supabase anon key (public)
```

### Backend/.env

```env
# ── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co          # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # Supabase service_role key (secret!)

# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxx                 # Stripe secret key (secret!)
STRIPE_WEBHOOK_SECRET=whsec_xxxx               # Stripe webhook signing secret

# ── Admin Auth ────────────────────────────────────────────────────────────────
JWT_SECRET=a-very-long-random-string
ADMIN_PASSWORD_HASH=$2b$12$...                 # bcrypt hash of your admin password
ADMIN_URL=https://admin.yourshop.com           # Admin panel URL — must match exactly!

# ── URLs ──────────────────────────────────────────────────────────────────────
CLIENT_URL=https://yourshop.com                # Shop URL (for Stripe redirect after payment)
FRONTEND_URL=https://yourshop.com              # Used in email links
NODE_ENV=production
DEMO_MODE=false                                # true = all admin writes are blocked

# ── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxx
SMTP_FROM_EMAIL=orders@yourshop.com
SMTP_FROM_NAME=My Shop                         # Sender name in emails

# ── Invoice PDF (§14 UStG / required for billing) ────────────────────────────
SHOP_NAME=My Shop LLC
SHOP_STREET=123 Main Street
SHOP_ZIP=10001
SHOP_CITY=New York
SHOP_COUNTRY=United States
SHOP_EMAIL=info@yourshop.com
SHOP_PHONE=+1 555 000 0000                     # optional
SHOP_VAT_ID=DE123456789                        # VAT ID (recommended for EU)
SHOP_TAX_NUMBER=12/345/67890                   # Tax number (alternative to VAT ID)
INVOICE_PREFIX=INV                             # Invoice number prefix (INV-2026-00001)

# ── DHL Shipping Labels ───────────────────────────────────────────────────────
DHL_API_KEY=your-dhl-api-key
DHL_BILLING_NUMBER=12345678012082              # 14-digit billing number from your DHL contract
DHL_SHIPPER_NAME=My Shop LLC
DHL_SHIPPER_STREET=123 Main Street
DHL_SHIPPER_ZIP=10001
DHL_SHIPPER_CITY=New York
DHL_SANDBOX=true                               # true for testing, false for real labels

# ── Push Notifications (VAPID) ───────────────────────────────────────────────
VAPID_PUBLIC_KEY=BGJBw...                      # VAPID public key (starts with B)
VAPID_PRIVATE_KEY=FazEa...                     # VAPID private key (secret!)
VAPID_EMAIL=mailto:admin@yourshop.com          # Contact email for push service
```

### Admin/.env

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co     # Supabase project URL
VITE_SUPABASE_ANON_KEY=eyJ...                  # Supabase anon key (public)
VITE_API_URL=https://api.yourshop.com          # Your backend URL
```

---

## 4. Database Setup

All database changes are stored as SQL files in the `database/` folder. They need to be run once in the Supabase SQL Editor.

### Step 1 — Create the schema

1. Go to **supabase.com → Your Project → SQL Editor**
2. Open `database/schema.sql`, copy the entire contents, and click **"Run"**

This creates all tables, functions, and RLS policies in one step.

| Table | Contents |
|---|---|
| `profiles` | Customer data (name, address, role) |
| `products` | Products (price, description, stock) |
| `orders` | Orders with status history |
| `order_items` | Individual items per order |
| `reviews` | Product reviews |
| `tickets` | Support tickets |

### Step 2 — Run migrations

Run migrations **in order** — each as a separate query in the SQL Editor:

| File | What it does |
|---|---|
| `migration_001_products_detail.sql` | Extended product fields (highlights, certificates, nutritional info) |
| `migration_002_admin_login_log.sql` | Login log for the admin panel |
| `migration_003_product_images.sql` | Supabase Storage bucket for product images |
| `migration_004_grants.sql` | Permissions for all tables |
| `migration_005_shipping_settings.sql` | Shipping cost configuration |
| `migration_006_admin_totp.sql` | Admin 2FA table (TOTP) |
| `migration_007_categories.sql` | Categories table |
| `migration_008_reviews.sql` | Reviews system with moderation |
| `migration_009_tickets.sql` | Support tickets |
| `migration_010_contact_inquiries.sql` | Contact requests table |
| `migration_011_user_ban.sql` | Customer ban/unban system |
| `migration_012_push_subscriptions.sql` | Web push notifications |
| `migration_013_invoice_label.sql` | Invoice numbers + DHL tracking columns |
| `migration_025_discount_codes.sql` | Discount / coupon code system |
| `migration_026_product_variants.sql` | Product variants (size, color — with per-variant stock) |

> **Order matters:** Always run migrations in the order listed above.

### What happens automatically

- When a user registers → a profile is created automatically
- When a review changes → the product rating is updated
- All tables have **Row Level Security (RLS)** — every user only sees their own data

---

## 5. Connecting Supabase

### Step 1 — Create a project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Choose region **"Central EU (Frankfurt)"** — important for GDPR compliance
4. Set a project name and a strong database password
5. Wait ~2 minutes for the project to be ready

### Step 2 — Copy API keys

1. In your Supabase project: **Settings → API**
2. Copy **"Project URL"** → into both `.env` files as `VITE_SUPABASE_URL` (Frontend) and `SUPABASE_URL` (Backend)
3. Copy **"anon public"** key → `Frontend/.env` as `VITE_SUPABASE_ANON_KEY`
4. Copy **"service_role"** key → `Backend/.env` as `SUPABASE_SERVICE_ROLE_KEY`

> **Don't mix up:** The `anon` key goes in the frontend, the `service_role` key in the backend only. The `service_role` key has full database access — it must never be public.

### Step 3 — Configure authentication

1. In Supabase: **Authentication → URL Configuration**
2. Set **Site URL**: your shop domain (e.g. `https://myshop.com`)
3. Under **Redirect URLs** add:
   ```
   https://myshop.com/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```

### Step 4 — Disable email confirmation

Until you have your own SMTP server set up, disable the confirmation email:

1. In Supabase: **Authentication → Sign In / Providers → Email**
2. Turn off **"Confirm email"** → click **Save**

> Re-enable this after you have configured your own SMTP provider (Section 8).

### Step 5 — Enable two-factor authentication (recommended)

1. In Supabase: **Authentication → Sign In / Up**
2. Under **Multi-Factor Authentication** → set **TOTP** to **Enabled**

Customers can then enable 2FA themselves in their account settings.

### Step 6 — Set up Google login (optional)

**Google Cloud Console:**

1. Go to https://console.cloud.google.com → create a project
2. **APIs & Services → Credentials → Create → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URI: `https://YOUR-SUPABASE-URL.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**

**In Supabase:**

1. **Authentication → Sign In / Providers → Google** → Enable
2. Enter **Client ID** and **Client Secret** → Save

### Step 7 — Customize email templates (optional)

In Supabase: **Authentication → Email Templates** — customize "Confirm signup", "Reset Password", and "Magic Link" with your shop name and branding.

---

## 6. Connecting Stripe

### Step 1 — Account and keys

1. Go to https://stripe.com → **Developers → API Keys**
2. Copy **"Publishable key"** (`pk_live_...`) — this is used in the frontend
3. Copy **"Secret key"** (`sk_live_...`) → `Backend/.env` as `STRIPE_SECRET_KEY`

> **Important:** Never put the secret key in the frontend — backend only!

### Step 2 — Test mode

During development use test keys (`pk_test_...`, `sk_test_...`).
Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### Step 3 — Production webhook

After deployment (see Section 18):

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR-BACKEND-URL.vercel.app/api/webhook/stripe`
3. Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy **Signing Secret** → add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## 7. Backend & Webhook

> **Note:** Built-in rate limiting: 100 requests / 15 min globally, stricter limits for login and checkout.

### Start locally

```bash
cd Backend && npm run dev
# Test: http://localhost:5000/api/health → {"status":"ok"}
```

### Test webhook locally

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
# Copy the whsec_... secret → Backend/.env as STRIPE_WEBHOOK_SECRET
```

### Backend endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Status check |
| GET | `/api/products` | All active products |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/settings/shipping` | Shipping settings (public) |
| POST | `/api/orders/checkout` | Start Stripe checkout |
| GET | `/api/orders` | Own orders (auth) |
| GET | `/api/customers/me` | Own profile (auth) |
| GET | `/api/customers/me/export` | GDPR data export (auth) |
| DELETE | `/api/customers/me` | Delete account (GDPR Art. 17) |
| POST | `/api/contact` | Send contact request |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/products` | All products (admin) |
| GET | `/api/admin/orders` | Orders (admin) |
| PATCH | `/api/admin/orders/:id/status` | Update order status (admin) |
| GET | `/api/admin/customers` | Customer list (admin) |
| DELETE | `/api/admin/customers/:id` | Delete customer (admin) |
| GET | `/api/admin/reviews` | Manage reviews (admin) |
| GET | `/api/admin/tickets` | Support tickets (admin) |
| GET | `/api/admin/stats` | Dashboard statistics (admin) |
| PUT | `/api/admin/settings/shipping` | Save shipping settings (admin) |

---

## 8. Email Setup

The shop automatically sends emails for order confirmations, password resets, and ticket replies.

| Provider | Free tier | Link |
|---|---|---|
| **Resend** | 3,000 emails/month | https://resend.com |
| **Postmark** | 100 emails/month | https://postmarkapp.com |
| **AWS SES** | 62,000 emails/month | https://aws.amazon.com/ses |

### Setup (example: Resend)

1. Create account → verify domain (DNS records — Resend walks you through it)
2. Create API key
3. Add to `Backend/.env`:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_xxxx
   SMTP_FROM_EMAIL=orders@yourshop.com
   SMTP_FROM_NAME=My Shop
   ```

> **Note:** SMTP is only used in the backend — the API key never goes in the frontend.

---

## 9. Invoice Setup

ShopRay automatically generates a legally compliant PDF invoice as soon as an order is paid. The invoice is:
- sent **automatically** to the customer by email (via Stripe webhook)
- available as a download in the **admin panel** on the order detail page

### Required fields

Add your company details to `Backend/.env` — they appear on every invoice:

```env
SHOP_NAME=My Shop LLC
SHOP_STREET=123 Main Street
SHOP_ZIP=10001
SHOP_CITY=New York
SHOP_COUNTRY=United States
SHOP_EMAIL=info@yourshop.com
SHOP_PHONE=+1 555 000 0000       # optional
SHOP_VAT_ID=DE123456789          # VAT ID (recommended for EU sellers)
SHOP_TAX_NUMBER=12/345/67890     # Tax number (alternative to VAT ID)
INVOICE_PREFIX=INV               # Prefix for invoice numbers (INV-2026-00001, INV-2026-00002, …)
```

> **VAT ID vs. Tax Number:** For EU businesses, a VAT ID is recommended, especially for cross-border sales. You can set both — the invoice displays whatever is present.

### Invoice numbers

Invoice numbers are assigned sequentially (e.g. `INV-2026-00001`, `INV-2026-00002`, …). The assignment is atomic and idempotent — if the same order is processed again, the same number is returned. This satisfies legal requirements for immutability.

> **Important:** Never change `INVOICE_PREFIX` once invoices have been issued — this would break the sequential numbering required by auditing regulations.

### Download manually

Admin panel → **Orders** → open an order → **"Invoice"** button (top right).

---

## 10. DHL Shipping Labels

DHL labels are created directly from the admin panel — no need to open the DHL portal separately.

### Requirements

- **DHL Business account** with API access enabled
- Request API access at: https://developer.dhl.com → "DHL Parcel DE Shipping" → Sandbox/Production Access

### Step 1 — Add DHL credentials

```env
DHL_API_KEY=your-dhl-api-key
DHL_BILLING_NUMBER=12345678012082   # 14-digit billing number from your DHL contract
DHL_SHIPPER_NAME=My Shop LLC
DHL_SHIPPER_STREET=123 Main Street
DHL_SHIPPER_ZIP=10001
DHL_SHIPPER_CITY=New York
DHL_SANDBOX=true                    # true for testing, false for real labels in production
```

**Where do I find the billing number?** In the DHL Business Customer Portal under **My DHL → Products & Contracts**. It is 14 digits and starts with your 8-digit EKP number.

### Step 2 — Test with sandbox

With `DHL_SANDBOX=true`, labels are created against the DHL test environment. Labels are not valid for real shipping but are perfect for testing.

Sandbox credentials for testing: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2#section/Authentication/ApiKeyAuth

### Step 3 — Switch to production

```env
DHL_SANDBOX=false
```

After this, real labels are created and the customer's order status is automatically set to **"Shipped"** on label creation.

### Create a label (Admin panel)

Admin panel → **Orders** → open an order → **"DHL Label"** button → enter package weight → **"Create & Download Label"**

The label is downloaded as a PDF. The DHL tracking number is saved in the order and shown as a clickable tracking link.

---

## 11. Push Notifications

The admin can enable browser push notifications — they receive an instant alert whenever a new order comes in.

### Supported devices

| Device | Requirement |
|---|---|
| **Desktop (Chrome, Firefox, Edge)** | Works directly in the browser |
| **Android (Chrome)** | Works directly in the browser |
| **iPhone / iPad** | Requires iOS 16.4+ and "Add to Home Screen" |

### Step 1 — Generate VAPID keys (one-time)

```bash
cd Backend
node -e "const wp = require('web-push'); const keys = wp.generateVAPIDKeys(); console.log(JSON.stringify(keys, null, 2));"
```

Output:
```json
{
  "publicKey": "BGJBw...",
  "privateKey": "FazEa..."
}
```

Add both values to `Backend/.env`:
```env
VAPID_PUBLIC_KEY=BGJBw...
VAPID_PRIVATE_KEY=FazEa...
VAPID_EMAIL=mailto:admin@yourshop.com
```

> **Important:** Only generate keys once. If you generate new keys, all existing push subscriptions are invalidated — users must re-subscribe.

### Step 2 — Enable in the admin panel

1. Open admin panel → **Settings → Notifications**
2. Click **"Enable Notifications"**
3. Confirm browser permission

After this, a push notification appears for every new order — even when the browser is minimized.

---

## 12. Choosing a Theme

4 color palettes × 2 modes (dark/light) = **8 themes**.

| Palette | Character | Best for |
|---|---|---|
| **sage** | Natural green, calming | Organic, wellness, health |
| **navy** | Dark blue, professional | Premium, B2B, electronics |
| **terra** | Earth tones, warm | Fashion, lifestyle, home |
| **electric** | Bright blue, modern | Streetwear, gaming, tech |

Change the default in [Frontend/src/providers/ThemeProvider.tsx](Frontend/src/providers/ThemeProvider.tsx):

```tsx
// Palette: 'sage' | 'navy' | 'terra' | 'electric'
() => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'

// Mode: 'light' | 'dark'
() => (localStorage.getItem('sr-mode') as ThemeMode) ?? 'light'
```

> Users can change the theme themselves via the theme toggle in the shop. Your setting only applies as the default for new visitors.

---

## 13. Shop Name & Company Details

All shop and company data is configured in one file:
[Frontend/src/config/app.ts](Frontend/src/config/app.ts)

```ts
export const APP_NAME    = 'Your Shop Name';
export const APP_URL     = 'https://your-domain.com';
export const APP_TAGLINE = 'Short slogan for the footer';

export const APP_COMPANY = {
  owner:   'John Doe',
  street:  '123 Main Street',
  zip:     '10001',
  city:    'New York',
  country: 'United States',
  ustId:   'DE 123 456 789',
  hrb:     '',
};

export const APP_CONTACT = {
  email:   'hello@your-domain.com',
  phone:   '+1 555 000 0000',
  address: '123 Main Street, 10001 New York',
};
```

Changes automatically apply to the header, footer, imprint, privacy policy, and withdrawal form.

> **Important:** Use real data — placeholders are not suitable for a live shop. Incorrect imprint data can result in legal warnings.

---

## 14. Enabling or Disabling Features

Edit `Frontend/src/config/features.ts`:

```ts
export const FEATURES = {
  reviews:  true,   // Product reviews
  wishlist: true,   // Wishlist
  tickets:  true,   // Support tickets
  chat:     false,  // Live chat
};
```

Set to `false` to hide a feature. The code stays, nothing breaks.

To remove completely:

| Feature | What to remove |
|---|---|
| **Reviews** | `src/features/reviews/` + tab in `product-detail.tsx` |
| **Wishlist** | `src/features/wishlist/` + `wishlist.tsx` + heart buttons |
| **Support tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` |
| **Live chat** | `src/pages/support/chat.tsx` + route in `router/index.tsx` |

After any change: run `npx tsc --noEmit` to check for TypeScript errors.

---

## 15. Adding Products

### Via Admin panel (recommended)

1. Admin panel → **Products → New Product**
2. Fill in name, price, description, images, category
3. Click **Save** — visible in the shop immediately

### Product variants (size, color, material …)

If your product comes in different variations (e.g. sizes S/M/L or colors Red/Blue), you can set up variants. Each variant has its own stock.

**Prerequisite:** Migration 026 must have been run (see Section 4).

**How to set up:**

1. Open a product: Admin panel → **Products → Edit product**
2. On the right side, find the **"Variants"** section
3. Click **"Add option group"** — e.g. "Size"
4. Enter values (e.g. S, M, L, XL) and confirm each with Enter
5. Add more option groups if needed (e.g. "Color" → Red, Blue) — up to 3 groups
6. Click **"Generate SKU matrix"** — the system automatically creates all combinations (e.g. S/Red, S/Blue, M/Red, …)
7. Set stock and optionally a price surcharge for each combination
8. Click **"Save variants"**

**In the shop:** The customer sees selection fields for each option group. Sold-out combinations are automatically shown as unavailable. Prices update instantly when a surcharge is set.

**No variants needed?** Products without variants work exactly as before — the feature is fully optional.

### Discount / coupon codes

You can create coupon codes that give customers a percentage or fixed-amount discount.

**Prerequisite:** Migration 025 must have been run (see Section 4).

**How to set up:**

1. Admin panel → **Discount Codes → New Code**
2. Fill in the fields:
   - **Code** — e.g. `SUMMER10` (case-insensitive at checkout)
   - **Type** — Percent (%) or fixed amount (€/$)
   - **Value** — e.g. 10 for 10% or 5 for €5 off
   - **Minimum order value** — e.g. 30 (optional, 0 = no minimum)
   - **Max redemptions** — how many times the code can be used total (empty = unlimited)
   - **Valid until** — optional expiry date
3. Click **Save**

**In the shop:** The customer enters the code at checkout — the discount is shown immediately and deducted from the order total. After a successful payment, the redemption counter is automatically incremented.

### Via seed data (testing)

Run `database/seed.sql` in the Supabase SQL Editor to populate with sample products.

---

## 16. Legal Pages

> **Important:** Legal texts in the template are placeholders. Update before going live — use a lawyer or a service like Termly or iubenda.

Company data from `app.ts` is automatically applied to `/imprint`, `/privacy`, and `/withdrawal`.

| Page | File | What to update |
|---|---|---|
| **Terms & Conditions** | `src/pages/info/terms.tsx` | Payment methods, delivery times |
| **Privacy Policy** | `src/pages/info/privacy.tsx` | Add your data processors |
| **Withdrawal** | `src/pages/info/widerruf.tsx` | Check if template applies |

**Newsletter:** The template has no double opt-in. GDPR requires confirmed opt-in for marketing emails — integrate an external provider (Mailchimp, Brevo, Klaviyo).

**If selling food / supplements (LMIV active):**
- Register with your national food authority before first sale
- Fill in all nutritional fields on every product page
- Only use EU-approved health claims

---

## 17. Admin Panel Setup

The admin panel is a separate project (`Admin/`) that runs independently from the shop frontend.

### What the admin panel can do

| Section | Function |
|---|---|
| **Dashboard** | Revenue, orders, customers at a glance — click any order row to open details |
| **Analytics** | Revenue and order trends, top products, order status breakdown, KPI cards — for 7, 30, or 90 days |
| **Products** | Create, edit, upload images, CSV bulk import, variants (size/color/…) |
| **Orders** | Manage status, download PDF invoice, create DHL shipping label |
| **Customers** | List, order history, GDPR export (Art. 20), ban/unban |
| **Categories** | Create, reorder, delete |
| **Reviews** | Approve, reject, or delete — with tab filter |
| **Discount Codes** | Create percentage or fixed-amount codes, set expiry and redemption limits |
| **Support** | Reply to contact requests and tickets |
| **Settings → Shipping** | Shipping costs, free shipping threshold, delivery time — live configuration |
| **Settings → Security** | Admin login log — every login is recorded |
| **Settings → Notifications** | Enable push notifications for new orders |
| **Settings → Team** | Add and remove moderator accounts (limited access) |

### Admin login setup

**Step 1 — Hash a secure password:**

```bash
cd Backend
node -e "const b = require('bcrypt'); b.hash('YOUR-PASSWORD', 12).then(h => console.log(h));"
```

Add the output (`$2b$12$...`) to `Backend/.env` as `ADMIN_PASSWORD_HASH`.

**Step 2 — Generate a JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'));"
```

Add to `Backend/.env` as `JWT_SECRET`.

> **Important:** Change the default password from the template before going live!

### Admin locally

```bash
cd Admin && npm install && npm run dev
# → http://localhost:5174
```

---

## 18. Deployment

ShopRay uses a **monorepo** with three separate Vercel projects.

### Step 1 — GitHub repository

1. Create a new **private** repository at https://github.com/new
2. In your ShopRay folder:

```bash
git remote add origin git@github.com:YOUR-USERNAME/ShopRay.git
git push -u origin main
```

### Step 2 — Three Vercel projects

Create one project per part at https://vercel.com → **"Add New Project"**:

| Vercel project | Root Directory | Framework |
|---|---|---|
| shopray (Frontend) | `Frontend` | Vite |
| shopray-backend | `Backend` | Node.js |
| shopray-admin | `Admin` | Vite |

Add all environment variables from the respective `.env` file under **Settings → Environment Variables**.

### Step 3 — Production branch

In each Vercel project: **Settings → Git → Production Branch** → set to `main`.

Now every `git push origin main` deploys to production automatically.

### Step 4 — Custom domain (recommended)

| Project | Suggested domain |
|---|---|
| Frontend | `yourshop.com` |
| Backend | `api.yourshop.com` |
| Admin | `admin.yourshop.com` |

In Vercel: **Settings → Domains → Add** → enter domain → set DNS records as instructed.

> The admin panel should never be on a publicly known URL. A custom domain with password protection is recommended.

### Step 5 — Verify after deployment

| URL | Expected result |
|---|---|
| `https://BACKEND-URL/api/health` | `{"status":"ok"}` |
| `https://SHOP-URL` | Shop homepage loads |
| `https://ADMIN-URL` | Login page appears |
| `https://SHOP-URL/register` | Registration works |
| `https://SHOP-URL/login` | Login works |

If `/api/health` does not return `{"status":"ok"}`, check the environment variables in the Vercel backend project.

### Common errors after deployment

**CORS error in admin ("Access-Control-Allow-Origin missing")**

Cause: `ADMIN_URL` or `CLIENT_URL` in the backend project do not exactly match the real URL.

Fix:
1. Vercel → **Backend project → Settings → Environment Variables**
2. Set `ADMIN_URL` to the exact URL of the admin panel (e.g. `https://admin.yourshop.com`)
3. Set `CLIENT_URL` to the exact URL of the shop (e.g. `https://yourshop.com`)
4. Redeploy backend (Vercel → **Deployments → Redeploy**)

**Admin login fails (500)**

Check that `JWT_SECRET` and `ADMIN_PASSWORD_HASH` are set in Vercel environment variables (Section 17).

### Step 6 — Demo mode (optional)

To present ShopRay as a live demo without permanent changes:

1. Vercel backend project → **Settings → Environment Variables**
2. Set `DEMO_MODE` to `true` → redeploy

In demo mode all admin write operations are blocked (HTTP 403). Login, logout, and all GET requests work normally. Reset demo data by running `database/seed.sql` in the Supabase SQL Editor.

---

## 19. Packages — What's included?

| Feature | Lite | Pro | Enterprise |
|---|---|---|---|
| Shop, cart, checkout | ✅ | ✅ | ✅ |
| 4 themes (dark + light) | ✅ | ✅ | ✅ |
| GDPR package (consent, my data) | ✅ | ✅ | ✅ |
| Customer account + order history | ✅ | ✅ | ✅ |
| Two-factor authentication (TOTP) | ✅ | ✅ | ✅ |
| Wishlist | ❌ | ✅ | ✅ |
| Product reviews | ❌ | ✅ | ✅ |
| Support tickets | ❌ | ✅ | ✅ |
| Live chat integration | ❌ | ❌ | ✅ |
| LMIV nutritional table | ❌ | ✅ | ✅ |
| **Admin panel** | ❌ | ✅ | ✅ |
| **Admin: shipping configuration** | ❌ | ✅ | ✅ |
| **Admin: category manager** | ❌ | ✅ | ✅ |
| **Admin: review moderation** | ❌ | ✅ | ✅ |
| **Admin: discount / coupon codes** | ❌ | ✅ | ✅ |
| **Admin: product variants** | ❌ | ✅ | ✅ |
| **GoBD-compliant PDF invoices** | ❌ | ✅ | ✅ |
| **DHL shipping labels** | ❌ | ✅ | ✅ |
| **Web push notifications** | ❌ | ✅ | ✅ |
| **RBAC (Owner + Moderator roles)** | ❌ | ✅ | ✅ |
| Source code | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## 20. Technology & Open Source

ShopRay is built almost entirely on open-source technologies.

| Technology | Role | License | Self-hostable |
|---|---|---|---|
| **React** | Frontend framework | MIT | — |
| **TypeScript** | Language | Apache 2.0 | — |
| **Vite** | Build tool | MIT | — |
| **Express.js** | Backend server | MIT | — |
| **Zod** | Input validation | MIT | — |
| **Nodemailer** | Email sending | MIT | — |
| **Zustand** | State management | MIT | — |
| **PostgreSQL** | Database | PostgreSQL License | ✅ |
| **Supabase** | Auth + database host | Apache 2.0 | ✅ |
| **Stripe** | Payment processing | proprietary | ❌ |

### Self-hosting Supabase

Supabase is fully open source and can be run on your own server:

- VPS with at least 4 GB RAM (Hetzner, DigitalOcean, Linode)
- Docker + official guide: https://supabase.com/docs/guides/self-hosting/docker

Swap the URL in `.env`:
```env
VITE_SUPABASE_URL=https://supabase.yourserver.com
SUPABASE_URL=https://supabase.yourserver.com
```

### Stripe alternatives

| Alternative | Highlight |
|---|---|
| **Mollie** | Popular in Europe, supports iDEAL, SEPA |
| **PayPal** | Widely accepted |
| **Lemon Squeezy** | Handles EU VAT, ideal for digital products |
| **Paddle** | Merchant of record, automatic tax handling |

---

## 21. Marketing, SEO & GEO

All marketing and SEO settings are configured in **one central file**:
`Frontend/src/config/app.ts`

After editing, redeploy to Vercel — everything goes live automatically.

---

### Google Tag Manager (GTM) — recommended

GTM is the easiest way to add **all** marketing tools without touching code:
Google Analytics 4, Meta/Facebook Pixel, TikTok Pixel, LinkedIn Insight, Hotjar — everything through the GTM interface, no code changes needed.

**Step 1 — Create a GTM account:**
1. Go to [tagmanager.google.com](https://tagmanager.google.com)
2. New account → Container type: **Web**
3. Note your Container ID — it looks like `GTM-XXXXXXX`

**Step 2 — Add the ID to `app.ts`:**
```typescript
// Frontend/src/config/app.ts
export const APP_GTM_ID = 'GTM-XXXXXXX';  // ← your ID here
```

**Step 3 — Deploy and verify:**
After deploying, use Google Tag Manager → Preview → test your shop URL.

**Then configure in GTM (no code needed):**
- **Google Analytics 4:** Tag → Google Analytics → GA4 Configuration → enter Measurement ID
- **Meta Pixel:** Tag → Custom HTML → paste Meta Pixel code
- **TikTok Pixel:** same approach as a custom HTML tag

> When `APP_GTM_ID` is empty (`''`), no GTM code is loaded — zero performance impact.

---

### Google Search Console — free, essential

Makes sure Google indexes your shop and lets you see how it ranks.

**Setup:**
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → enter your shop domain
3. Verify via **DNS record** (easiest method — done at your domain registrar)
4. Submit your sitemap:

```
https://your-api-domain.com/sitemap.xml
```

The sitemap is **automatically generated by the backend** — all active products are always included. No manual maintenance needed.

> **Note:** Update `Frontend/public/robots.txt` with your real backend domain:
> ```
> Sitemap: https://api.your-shop.com/sitemap.xml
> ```

---

### SEO — what happens automatically

ShopRay sets the following for every page:

| What | Where visible |
|---|---|
| Page title (`<title>`) | Browser tab + Google search result |
| Meta description | Google snippet below the link |
| Open Graph tags | Facebook, LinkedIn, WhatsApp preview |
| Twitter/X card | Twitter preview |
| Canonical URL | Prevents duplicate content |
| Product photo as preview image | Social share of product pages |

**JSON-LD Structured Data (for Google & AI search):**

| Schema | Page | Effect |
|---|---|---|
| `Product` + `Offer` | Product pages | Google Shopping integration, price in search results |
| `AggregateRating` | Product pages | ⭐⭐⭐⭐⭐ stars in Google search results |
| `Review` | Product pages | Individual reviews for AI search |
| `BreadcrumbList` | Product pages | Breadcrumb in Google results |
| `shippingDetails` | Product pages | Delivery time + free shipping in Google Shopping |
| `MerchantReturnPolicy` | Product pages | "30-day free returns" directly in Google |
| `Organization` | Homepage | Brand identity for AI + Google Knowledge Panel |
| `WebSite` + `SearchAction` | Homepage | Google Sitelinks Search |
| `FAQPage` | Homepage | FAQ expandable directly in Google results |

---

### OG image setup (social media preview)

The OG image appears when someone shares a link to your shop on Facebook, WhatsApp, LinkedIn, etc.

**Requirements:**
- Format: **PNG or JPG** (no SVG — not supported by social media)
- Size: **1200 × 630 px**
- Filename: `og-image.png`
- Location: `Frontend/public/og-image.png`

Create the file with your shop logo and branding and place it in `public/`.
The path is already configured in `app.ts`: `APP_OG_IMAGE = '/og-image.png'`

> On **product pages** the first product photo is automatically used as the preview image — no manual action needed.

---

### Social media links

In `Frontend/src/config/app.ts` add your real URLs:

```typescript
export const APP_SOCIALS = {
  instagram: 'https://instagram.com/your-shop',
  x:         'https://x.com/your-shop',
  facebook:  'https://facebook.com/your-shop',
  youtube:   '',    // leave empty if not present
  tiktok:    '',
};
```

Empty strings (`''`) are hidden in the footer. Placeholder `'#'` still shows the icon — better to leave empty.

---

### GEO — visibility in AI search (ChatGPT, Perplexity, Bing Copilot)

GEO (Generative Engine Optimization) makes sure AI search engines understand, cite, and recommend your shop correctly.

ShopRay ships two files for this:

**`/llms.txt`** — Quick summary for AI crawlers
- Product range, shipping, payment, returns
- Automatically read by ChatGPT, Perplexity, etc.

**`/llms-full.txt`** — Full context
- Technical architecture, legal details, SEO info
- For deeper AI processing

**What to update:**
Open both files in `Frontend/public/` and replace the placeholder text (shipping window, return policy, product categories) with your real shop details. The more accurate the information, the better AI search engines cite your shop.

---

### Google Shopping (optional)

With the correct `Product` schema on product pages, your shop is already prepared for **Google Shopping**. To appear in the Shopping tab:

1. Create a [Google Merchant Center](https://merchants.google.com) account
2. Verify your domain
3. Set up a product feed — the sitemap (`/sitemap.xml`) can serve as a starting point
4. Alternatively: set up **Google Ads Conversion Tracking** in GTM

---

## Help & Support

For questions about the template:
- GitHub Issues: https://github.com/SchubertChris/ShopRay/issues
- Email: [your support address]

For external services:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
