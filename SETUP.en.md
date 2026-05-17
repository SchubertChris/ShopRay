# ShopRay — Setup Guide

**Version:** 1.6.0 | **Last updated:** 2026-05-17

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
9. [Choosing a Theme](#9-choosing-a-theme)
10. [Shop Name & Company Details](#10-shop-name--company-details)
11. [Enabling or Disabling Features](#11-enabling-or-disabling-features)
12. [Adding Products](#12-adding-products)
13. [Legal Pages](#13-legal-pages)
14. [Admin Panel Setup](#14-admin-panel-setup)
15. [Deployment](#15-deployment)
16. [Packages — What's included?](#16-packages--whats-included)
17. [Technology & Open Source](#17-technology--open-source)

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
cp ShopRay/Backend/.env.example ShopRay/Backend/.env
cp ShopRay/Admin/.env.example ShopRay/Admin/.env
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
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxx            # Stripe publishable key
```

### Backend/.env

```env
SUPABASE_URL=https://xxxx.supabase.co          # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # Supabase service_role key (secret!)
STRIPE_SECRET_KEY=sk_live_xxxx                 # Stripe secret key (secret!)
STRIPE_WEBHOOK_SECRET=whsec_xxxx               # Stripe webhook signing secret
JWT_SECRET=a-very-long-random-string
ADMIN_PASSWORD_HASH=$2b$12$...                 # bcrypt hash of your admin password
CLIENT_URL=https://yourshop.com                # Shop URL (for Stripe redirect after payment)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxx
SMTP_FROM_EMAIL=orders@yourshop.com
ADMIN_URL=https://admin.yourshop.com
NODE_ENV=production
DEMO_MODE=false                                # true = all admin writes are blocked
```

### Admin/.env

```env
VITE_API_URL=https://api.yourshop.com          # Your backend URL
```

---

## 4. Database Setup

All database changes are stored as SQL files in the `database/` folder. They need to be run once in the Supabase SQL Editor.

### Step 1 — Create the schema

1. Go to **supabase.com → Your Project → SQL Editor**
2. Open `database/schema.sql`, copy the contents, and click **"Run"**

This creates the following tables:

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
| `database/migration_001_products_detail.sql` | Extended product fields (highlights, certificates, nutritional info) |
| `database/migration_002_admin_login_log.sql` | Login log for the admin panel |
| `database/migration_003_product_images.sql` | Supabase Storage bucket for product images |
| `database/migration_004_grants.sql` | Permissions for all tables |
| `database/migration_005_shipping_settings.sql` | Shipping cost configuration |
| `database/migration_006_admin_totp.sql` | Admin 2FA table (TOTP) |
| `database/migration_007_categories.sql` | Categories table for the admin panel |

> **Order matters:** Always run migrations in order 001 → 002 → … → 007.

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
2. Copy **"Publishable key"** → `Frontend/.env` as `VITE_STRIPE_PUBLIC_KEY`
3. Copy **"Secret key"** → `Backend/.env` as `STRIPE_SECRET_KEY`

> **Important:** Never put the secret key in the frontend — backend only!

### Step 2 — Test mode

During development use test keys (`pk_test_...`, `sk_test_...`).
Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

### Step 3 — Production webhook

After deployment (see Step 7):

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

1. Create account → verify domain (DNS records)
2. Create API key
3. Add to `Backend/.env`:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_xxxx
   SMTP_FROM_EMAIL=orders@yourshop.com
   ```

---

## 9. Choosing a Theme

4 color palettes × 2 modes (dark/light) = **8 themes**.

| Palette | Character | Best for |
|---|---|---|
| **sage** | Natural green, calming | Organic, wellness, health |
| **navy** | Dark blue, professional | Premium, B2B, electronics |
| **terra** | Earth tones, warm | Fashion, lifestyle, home |
| **electric** | Bright blue, modern | Streetwear, gaming, tech |

Change the default in [Frontend/src/providers/ThemeProvider.tsx](Frontend/src/providers/ThemeProvider.tsx):

```tsx
() => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'  // default palette
() => (localStorage.getItem('sr-mode') as ThemeMode) ?? 'light'  // default mode
```

---

## 10. Shop Name & Company Details

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
  ustId:   '',
};

export const APP_CONTACT = {
  email:   'hello@your-domain.com',
  phone:   '+1 555 000 0000',
  address: '123 Main Street, 10001 New York',
};
```

Changes automatically apply to the header, footer, imprint, privacy policy, and withdrawal form.

> **Important:** Use real data — placeholders are not suitable for a live shop.

---

## 11. Enabling or Disabling Features

Edit `Frontend/src/config/features.ts`:

```ts
export const FEATURES = {
  wishlist: true,   // Wishlist — customers can save products for later
  reviews:  true,   // Product reviews — star ratings and comments
  tickets:  true,   // Support tickets — customers can submit requests in their account
  lmiv:     true,   // EU nutritional info — ONLY enable for food / supplements
};
```

Set to `false` to hide a feature. The code stays, nothing breaks. To remove completely, delete the corresponding folder under `src/features/<name>/`.

---

## 12. Adding Products

### Via Admin panel (recommended)

1. Admin panel → **Products → New Product**
2. Fill in name, price, description, images, category
3. Click **Save** — visible in the shop immediately

### Via seed data (testing)

Run `database/seed.sql` in the Supabase SQL Editor to populate with sample products.

---

## 13. Legal Pages

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

## 14. Admin Panel Setup

### What the admin panel can do

| Section | Function |
|---|---|
| **Dashboard** | Revenue, orders, customers at a glance |
| **Products** | Create, edit, upload images |
| **Orders** | Manage status (New → Paid → Shipped → Delivered) |
| **Customers** | List, order history, GDPR export + deletion |
| **Categories** | Create, reorder, delete |
| **Reviews** | Approve, reject, delete |
| **Support** | Reply to contact requests and tickets |
| **Settings → Shipping** | Shipping costs, free shipping threshold, delivery time |
| **Settings → Security** | Admin login log |

### Admin login setup

**Hash a secure password:**

```bash
cd Backend
node -e "const b = require('bcrypt'); b.hash('YOUR-PASSWORD', 12).then(h => console.log(h));"
```

Add the output (`$2b$12$...`) to `Backend/.env` as `ADMIN_PASSWORD_HASH`.

**Generate a JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'));"
```

Add to `Backend/.env` as `JWT_SECRET`.

---

## 15. Deployment

ShopRay uses a **monorepo** with three separate Vercel projects.

### Step 1 — GitHub repository

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

In each Vercel project: **Settings → Environments → Production** → set Branch Tracking to `main`.

Now every `git push origin main` deploys to production automatically.

### Step 4 — Custom domain (recommended)

| Project | Suggested domain |
|---|---|
| Frontend | `yourshop.com` |
| Backend | `api.yourshop.com` |
| Admin | `admin.yourshop.com` |

In Vercel: **Settings → Domains → Add**.

### Step 5 — Verify after deployment

| URL | Expected result |
|---|---|
| `https://BACKEND-URL/api/health` | `{"status":"ok"}` |
| `https://SHOP-URL` | Shop homepage loads |
| `https://ADMIN-URL` | Login page appears |

### Step 6 — Demo mode (optional)

Set `DEMO_MODE=true` in Vercel backend environment variables → redeploy.
All admin writes are blocked (HTTP 403). Reset data with `database/seed.sql`.

---

## 16. Packages — What's included?

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
| LMIV nutritional table | ❌ | ✅ | ✅ |
| **Admin panel** | ❌ | ✅ | ✅ |
| **Admin: shipping configuration** | ❌ | ✅ | ✅ |
| **Admin: category manager** | ❌ | ✅ | ✅ |
| **Admin: review moderation** | ❌ | ✅ | ✅ |
| Source code | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## 17. Technology & Open Source

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

- VPS with at least 4 GB RAM (Hetzner, DigitalOcean, Linode)
- Docker + official guide: https://supabase.com/docs/guides/self-hosting/docker
- Swap the URL in `.env`: `VITE_SUPABASE_URL=https://supabase.yourserver.com`

### Stripe alternatives

| Alternative | Highlight |
|---|---|
| **Mollie** | Popular in Europe, supports iDEAL, SEPA |
| **PayPal** | Widely accepted |
| **Lemon Squeezy** | Handles EU VAT, ideal for digital products |
| **Paddle** | Merchant of record, automatic tax handling |

---

## Help & Support

For questions about the template:
- GitHub Issues: https://github.com/SchubertChris/ShopRay/issues
- Email: [your support address]

For external services:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
