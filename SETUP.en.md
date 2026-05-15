# ShopRay — Setup Guide

**Version:** 1.4.0 | **Last updated:** 2026-05-16

This guide walks you through setting up your ShopRay template step by step —
from installation to a live, running shop.

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup (Supabase)](#4-database-setup-supabase)
5. [Auth Setup (Supabase)](#5-auth-setup-supabase)
6. [Connect Stripe (Payments)](#6-connect-stripe-payments)
7. [Email Setup (SMTP)](#7-email-setup-smtp)
8. [Backend Setup](#8-backend-setup)
9. [Admin Password](#9-admin-password)
10. [Shop Name & Basic Settings](#10-shop-name--basic-settings)
11. [Features (Enable / Disable)](#11-features-enable--disable)
12. [Adding Products](#12-adding-products)
13. [Legal Pages](#13-legal-pages)
14. [Admin Panel](#14-admin-panel)
15. [Deployment (Vercel Monorepo)](#15-deployment-vercel-monorepo)
16. [Package Tiers](#16-package-tiers)
17. [Tech Stack & Open Source](#17-tech-stack--open-source)

---

## 1. Requirements

Make sure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18 or higher | nodejs.org |
| **npm** | comes with Node.js | — |
| **Git** | any recent version | git-scm.com |

You will also need accounts with these services (all have free tiers):
- **Supabase** — supabase.com (database + auth)
- **Stripe** — stripe.com (payments)
- **Vercel** — vercel.com (hosting, recommended)

---

## 2. Installation

```bash
# 1. Clone the repository or unzip the downloaded archive
git clone https://github.com/your-repo/shopray.git
cd shopray

# 2. Install Frontend dependencies
cd Frontend && npm install

# 3. Install Admin dependencies (Pro/Enterprise only)
cd ../Admin && npm install

# 4. Install Backend dependencies
cd ../Backend && npm install
```

### Start locally

Open 3 terminal windows:

```bash
# Terminal 1 — Frontend (http://localhost:5173)
cd Frontend && npm run dev

# Terminal 2 — Admin (http://localhost:5174)
cd Admin && npm run dev

# Terminal 3 — Backend (http://localhost:5000)
cd Backend && npm run dev
```

---

## 3. Environment Variables

Each project has a `.env.example` file. Copy it and fill in your values.

```bash
cp Frontend/.env.example  Frontend/.env
cp Admin/.env.example     Admin/.env
cp Backend/.env.example   Backend/.env
```

**Never commit `.env` files** — they are already in `.gitignore`.

### Frontend variables (`Frontend/.env`)

| Variable | Description | Where to find |
|---|---|---|
| `VITE_API_URL` | Your Backend URL | `http://localhost:5000` locally |
| `VITE_SUPABASE_URL` | Supabase project URL | supabase.com → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | same location |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key (`pk_...`) | stripe.com → Developers → API Keys |

### Admin variables (`Admin/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Backend URL (same as Frontend) |

### Backend variables (`Backend/.env`)

| Variable | Description | Where to find |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | supabase.com → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | same location (**keep secret**) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_...`) | stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (`whsec_...`) | after creating a webhook endpoint |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of your Admin password | generate with the script below |
| `SESSION_SECRET` | Random string for cookie signing | generate: `openssl rand -base64 32` |
| `FRONTEND_URL` | Your shop URL | e.g. `https://yourshop.com` |
| `ADMIN_URL` | Your Admin panel URL | e.g. `https://admin.yourshop.com` |

---

## 4. Database Setup (Supabase)

### Create a Supabase project

1. Go to supabase.com → create a free account
2. Click **"New project"** — choose the **Frankfurt (eu-central-1)** region for GDPR compliance
3. Wait for the project to initialize (~2 minutes)

### Run the SQL files

Open the **SQL Editor** in Supabase and execute each file **in order**:

| Step | File | What it creates |
|---|---|---|
| 1 | `database/schema.sql` | All base tables (products, orders, users, contacts, settings) |
| 2 | `database/migration_002_admin_login_log.sql` | Admin login log table |
| 3 | `database/migration_003_product_images.sql` | Multiple product images (JSONB column) |
| 4 | `database/migration_005_shipping_settings.sql` | Configurable shipping settings |

For each file: **SQL Editor → New query** → paste the content → **Run**.

---

## 5. Auth Setup (Supabase)

### Enable Email Auth

**Authentication → Providers → Email** → enable.

For production, configure a custom SMTP server (see section 7) so emails arrive from your domain.

### Enable Two-Factor Authentication (MFA)

**Authentication → Sign In / Up → Multi-Factor Authentication** → turn on TOTP.

This allows customers to protect their accounts with an authenticator app.

### Set Redirect URLs (for password reset)

**Authentication → URL Configuration → Redirect URLs** → add your URLs:

```
http://localhost:5173/auth/reset-password
https://yourshop.com/auth/reset-password
```

These are required so the "Reset Password" email link works correctly.

---

## 6. Connect Stripe (Payments)

1. Create a Stripe account at stripe.com
2. Go to **Developers → API Keys**
3. Copy the **Publishable key** (`pk_...`) → `VITE_STRIPE_PUBLIC_KEY` in `Frontend/.env`
4. Copy the **Secret key** (`sk_...`) → `STRIPE_SECRET_KEY` in `Backend/.env`

### Set up Webhook

1. **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR-BACKEND-URL/api/webhook/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the **Webhook signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` in `Backend/.env`

### Test vs. Live mode

Stripe has test keys (`pk_test_...`) and live keys (`pk_live_...`).  
During development, always use test keys. Switch to live keys only before launch.

**Test card numbers:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

### Local testing with Stripe CLI

```bash
# Install Stripe CLI: stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

---

## 7. Email Setup (SMTP)

ShopRay sends transactional emails (order confirmations, password reset, etc.) via Supabase Auth.

### Recommended providers

| Provider | Free tier | Notes |
|---|---|---|
| **Resend** | 3,000 emails/month | Easiest setup |
| **Postmark** | 100 emails/month | Best deliverability |
| **AWS SES** | 62,000 emails/month | Cheapest at scale |

### Configure in Supabase

**Authentication → SMTP Settings** → enable custom SMTP → enter your provider's credentials.

| Field | Example |
|---|---|
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | Your API key |
| Sender Name | Your shop name |
| Sender Email | `noreply@yourshop.com` |

> You need a verified domain at your email provider. Follow the provider's DNS instructions.

---

## 8. Backend Setup

The Backend is an Express.js server that handles orders, admin auth, product management, and settings.

### Backend API endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Customer login (via Supabase) |
| POST | `/api/auth/logout` | Public | Customer logout |
| GET | `/api/products` | Public | Product list |
| GET | `/api/products/:slug` | Public | Single product |
| GET | `/api/settings/shipping` | Public | Current shipping config |
| POST | `/api/orders` | Customer | Create order |
| GET | `/api/orders` | Customer | Order list |
| POST | `/api/contact` | Public | Contact form |
| POST | `/api/admin/login` | Public | Admin login |
| POST | `/api/admin/logout` | Admin | Admin logout |
| GET | `/api/admin/check` | Admin | Verify admin session |
| GET | `/api/admin/products` | Admin | Product list (admin) |
| POST | `/api/admin/products` | Admin | Create product |
| PUT | `/api/admin/products/:id` | Admin | Update product |
| DELETE | `/api/admin/products/:id` | Admin | Delete product |
| POST | `/api/admin/products/upload` | Admin | Upload product image |
| PUT | `/api/admin/settings/shipping` | Admin | Update shipping config |
| GET | `/api/admin/login-log` | Admin | Admin login history |
| GET | `/api/contact` | Admin | Contact inquiries |
| PATCH | `/api/contact/:id` | Admin | Update inquiry status |

### Input validation

All Backend endpoints use **Zod** schema validation. Invalid requests get a clear error response — the server never processes malformed data.

---

## 9. Admin Password

The Admin panel uses a **single password** (no email). The password is stored as a **bcrypt hash** in `Backend/.env`.

### Setting your password

1. Temporarily set `ADMIN_PASSWORD=yourNewPassword` in `Backend/.env`
2. Start the Backend once — it will log the generated hash to the console
3. Copy that hash to `ADMIN_PASSWORD_HASH=<hash>` in `Backend/.env`
4. Remove `ADMIN_PASSWORD` from `Backend/.env`
5. Restart the Backend

For Vercel: set `ADMIN_PASSWORD_HASH` in the Backend project's Environment Variables (Settings → Environment Variables).

> **Never use the default password in production.** Change it before launch.

---

## 10. Shop Name & Basic Settings

### Shop name

Your shop name is used in the header, footer, emails, and browser tab.

**File:** `Frontend/src/config/app.ts`

```ts
export const APP_NAME = 'ShopRay'; // ← Change to your shop name
```

### Theme / Colors

ShopRay ships with 4 color palettes × 2 modes (light/dark) = **8 themes**.

| Palette | Vibe | Best for |
|---|---|---|
| **Sage** (default) | Calm, sustainable | Nature, beauty, lifestyle |
| **Navy** | Elegant, luxury | Fashion, jewelry |
| **Terra** | Warm, organic | Ceramics, food, crafts |
| **Electric** | Modern, tech | Tech, gaming, software |

To set the default: open `Frontend/src/config/theme.ts`.

### Shipping costs

Shipping settings (cost, free threshold, delivery time) are configured directly in the Admin panel under **Settings → Shipping**. Changes take effect immediately in the shop — no code change needed.

---

## 11. Features (Enable / Disable)

Open `Frontend/src/config/features.ts`:

```ts
export const FEATURES = {
  wishlist: true,   // Wishlist (heart button, wishlist page)
  reviews:  true,   // Product reviews
  tickets:  true,   // Support tickets in customer account
  lmiv:     false,  // Nutritional info (only for food shops)
};
```

Set a feature to `false` to hide it from the UI — no code deletion required.

### Fully removing a feature

| Feature | Files to delete |
|---|---|
| **Reviews** | `src/features/reviews/` + reviews tab in `product-detail.tsx` |
| **Wishlist** | `src/features/wishlist/` + `wishlist.tsx` + heart buttons in cards |
| **Support Tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` |
| **Cookie Consent** | `src/features/consent/` + import in `MainLayout.tsx` |

After any change: run `npx tsc --noEmit` to check for TypeScript errors.

---

## 12. Adding Products

### Current state (mock data)

The template ships with example products at:
`Frontend/src/features/products/data/products.data.ts`

These are for demo purposes. Replace with real data or connect to the Backend API.

### Via Admin panel (recommended)

Use the Admin panel at `/products` to create, edit, and manage products — including image uploads via Supabase Storage.

### Via direct database

You can also insert products directly via the Supabase SQL Editor or the Supabase Table Editor.

---

## 13. Legal Pages

> **Important:** The legal texts are **placeholders**. Update them before launch — ideally verified by a lawyer or a compliance service (eRecht24, Trusted Shops, etc.).

| Page | File | What to update |
|---|---|---|
| **Imprint** | `src/pages/info/impressum.tsx` | Name, address, phone, email |
| **Privacy Policy** | `src/pages/info/privacy.tsx` | Data controller, actual processors (Supabase, Stripe, etc.) |
| **Terms & Conditions** | `src/pages/info/terms.tsx` | Shop name, payment methods, delivery times |
| **Shipping & Returns** | `src/pages/info/shipping.tsx` | Your actual shipping costs and partners (auto-synced from Admin) |
| **Cookie Notice** | `src/features/consent/` | Cookie list if you add new services |

---

## 14. Admin Panel

The Admin panel is a **separate app** (`Admin/`) running independently from the customer-facing shop.

### What the Admin panel does

| Section | Function |
|---|---|
| **Products** | Create, edit, activate/deactivate, upload images |
| **Orders** | View order details and status |
| **Customers** | Customer profiles, GDPR deletion |
| **Inquiries** | Read and respond to contact form submissions |
| **Settings → Shipping** | Set shipping costs, free threshold, delivery time (applies immediately in shop) |
| **Settings → Security** | View the last 50 Admin login events |

### Product management shortcuts

- **Double-click on a row** → open the edit screen
- **Click on the status badge** → toggle product active/inactive immediately
- **Density button** in the filter bar → switch between compact and normal table view

### Start locally

```bash
cd Admin
npm install
npm run dev
# → http://localhost:5174
```

The Backend must be running at the same time.

### Admin password

See section 9.

---

## 15. Deployment (Vercel Monorepo)

ShopRay is a monorepo. Each part (Frontend, Admin, Backend) is a **separate Vercel project** pointing to the same GitHub repository.

### Step 1 — Push to GitHub

If you haven't already, push the repository to GitHub (or GitLab / Bitbucket).

### Step 2 — Create 3 Vercel projects

For each project, go to vercel.com → **"Add New Project"** → select your repository:

| Project name | Root Directory | Environment variables |
|---|---|---|
| shopray-frontend | `Frontend` | From `Frontend/.env` |
| shopray-admin | `Admin` | From `Admin/.env` |
| shopray-backend | `Backend` | From `Backend/.env` |

To set the Root Directory: **Build and Deployment Settings → Root Directory**.

### Step 3 — Add environment variables

In each Vercel project: **Settings → Environment Variables** → add each variable from the corresponding `.env` file.

> For the Backend: set `ADMIN_PASSWORD_HASH` (not `ADMIN_PASSWORD`).  
> Never commit secret keys.

### Step 4 — Connect projects

After all 3 projects are deployed:

1. Set `VITE_API_URL` in Frontend and Admin to your Backend Vercel URL (e.g. `https://shopray-backend.vercel.app`)
2. Set `FRONTEND_URL` and `ADMIN_URL` in Backend to the respective Vercel URLs
3. Add the Backend URL as the Stripe webhook endpoint (stripe.com → Developers → Webhooks)
4. Add the Frontend URL as a redirect URL in Supabase (section 5)
5. Redeploy all 3 projects

### Custom domains (optional)

In each Vercel project: **Settings → Domains → Add Domain**.

| Project | Recommended domain |
|---|---|
| Frontend | `yourshop.com` |
| Admin | `admin.yourshop.com` (keep this private) |
| Backend | `api.yourshop.com` |

---

## 16. Package Tiers

| Feature | Lite | Pro | Enterprise |
|---|---|---|---|
| Shop, cart, checkout | ✅ | ✅ | ✅ |
| 4 themes (light + dark) | ✅ | ✅ | ✅ |
| GDPR package (consent, my data, deletion) | ✅ | ✅ | ✅ |
| Customer account + order history | ✅ | ✅ | ✅ |
| Wishlist | ❌ | ✅ | ✅ |
| Product reviews | ❌ | ✅ | ✅ |
| Support tickets | ❌ | ✅ | ✅ |
| Live chat integration | ❌ | ❌ | ✅ |
| **Admin panel** | ❌ | ✅ | ✅ |
| **2FA (customer MFA via TOTP)** | ❌ | ✅ | ✅ |
| **Configurable shipping costs (Admin)** | ❌ | ✅ | ✅ |
| Source code | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## 17. Tech Stack & Open Source

| Layer | Technology | Version | License |
|---|---|---|---|
| Frontend framework | React | 19 | MIT |
| Build tool | Vite | 6 | MIT |
| Language | TypeScript | 5 | Apache 2.0 |
| State management | Zustand | 5 | MIT |
| Routing | React Router | 7 | MIT |
| HTTP client | Axios | 1 | MIT |
| CSS preprocessor | Sass/SCSS | 1.8 | MIT |
| Validation | Zod | 3 | MIT |
| Backend framework | Express | 4 | MIT |
| Password hashing | bcryptjs | 2 | MIT |
| Database / Auth | Supabase | — | Apache 2.0 |
| Payments | Stripe | — | Commercial |
| Hosting | Vercel | — | Commercial |

---

## Help & Support

For template questions:
- GitHub Issues: your repository URL
- Email: your support address

For third-party services:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
