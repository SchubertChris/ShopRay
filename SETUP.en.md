# ShopRay — Setup Guide

**Version:** 1.1.0 | **Last updated:** 2026-05-14

This guide walks you through setting up your ShopRay template step by step —
from installation to a live, running shop.

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Installation](#2-installation)
3. [Environment Variables](#3-environment-variables)
4. [Choosing a Theme](#4-choosing-a-theme)
5. [Connect Supabase (Database & Auth)](#5-connect-supabase)
6. [Connect Stripe (Payments)](#6-connect-stripe)
7. [Email Setup](#7-email-setup)
8. [Shop Name & Basic Settings](#8-shop-name--basic-settings)
9. [Enable or Disable Features](#9-enable-or-disable-features)
10. [Adding Products](#10-adding-products)
11. [Legal Pages](#11-legal-pages)
12. [Admin Panel](#12-admin-panel)
13. [Deployment](#13-deployment)
14. [Package Tiers](#14-package-tiers)

---

## 1. Requirements

Make sure you have the following installed before you start:

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
cd Frontend
npm install

# 3. Install Admin dependencies (Pro/Enterprise only)
cd ../Admin
npm install
```

### Start locally

```bash
# Frontend (Shop)
cd Frontend && npm run dev
# → http://localhost:5173

# Admin
cd Admin && npm run dev
# → http://localhost:5174
```

---

## 3. Environment Variables

Each project has a `.env.example` file. Copy it to `.env` and fill in your values.

```bash
# Frontend
cp Frontend/.env.example Frontend/.env

# Admin
cp Admin/.env.example Admin/.env
```

**Never commit `.env` files.** They are already excluded via `.gitignore`.

### Frontend variables

| Variable | Description | Where to find |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL | supabase.com → Project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | same location |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key (starts with `pk_`) | dashboard.stripe.com → Developers → API Keys |
| `VITE_APP_NAME` | Your shop name | set yourself |
| `VITE_APP_URL` | Your shop's domain | set yourself |

### Admin variables

Same as Frontend, plus:

| Variable | Description | Important |
|---|---|---|
| `VITE_SUPABASE_SERVICE_KEY` | Supabase service role key | **Admin only — never use in Frontend** |
| `VITE_ADMIN_URL` | Admin panel URL | e.g. `https://admin.yourshop.com` |

---

## 4. Choosing a Theme

ShopRay ships with 4 color palettes × 2 modes (light/dark) = **8 themes**.

| Palette | Vibe | Best for |
|---|---|---|
| **Sage** (default) | Calm, sustainable, premium | Nature, beauty, lifestyle |
| **Navy** | Elegant, luxury | Fashion, jewelry, high-end |
| **Terra** | Warm, organic, handmade | Ceramics, food, crafts |
| **Electric** | Modern, digital, energetic | Tech, gaming, software |

To set the default theme, open `Frontend/src/providers/ThemeProvider.tsx`:

```ts
// Change 'sage' to: 'navy' | 'terra' | 'electric'
const [palette, setPaletteState] = useState<Palette>('sage');

// Change 'light' to: 'dark'
const [mode, setMode] = useState<Mode>('light');
```

Users can switch the theme live using the button in the header.

---

## 5. Connect Supabase

### Create a Supabase project

1. Go to supabase.com and create a free account
2. Create a new project — choose the **Frankfurt (eu-central-1)** region for GDPR compliance
3. Wait for the project to initialize (~2 minutes)
4. Go to **Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `VITE_SUPABASE_SERVICE_KEY` (Admin only)

### Enable Email Auth

In Supabase: **Authentication → Providers → Email** → enable it.

For production, configure a custom SMTP server (see section 7) so emails come from your domain.

---

## 6. Connect Stripe

1. Create a Stripe account at stripe.com
2. Go to **Developers → API Keys**
3. Copy the **Publishable key** (starts with `pk_`) → `VITE_STRIPE_PUBLIC_KEY`
4. The **Secret key** (starts with `sk_`) goes into your **Backend** — never in the Frontend

### Test vs. Live mode

Stripe has test keys (`pk_test_...`) and live keys (`pk_live_...`).
During development, always use test keys. Switch to live keys only before launch.

**Test card numbers:**
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

---

## 7. Email Setup

ShopRay sends transactional emails (order confirmations, password reset, etc.).

### Recommended providers

| Provider | Free tier | Notes |
|---|---|---|
| **Resend** | 3,000 emails/month | Easiest setup, great DX |
| **Postmark** | 100 emails/month | Best deliverability |
| **AWS SES** | 62,000 emails/month | Cheapest at scale |

All of these can be configured in Supabase under **Settings → Auth → SMTP Settings**.

---

## 8. Shop Name & Basic Settings

Open `Frontend/src/config/app.ts` and adjust:

```ts
export const APP = {
  name:        'Your Shop Name',
  description: 'Your shop description',
  url:         'https://yourshop.com',
  email:       'hello@yourshop.com',
};
```

---

## 9. Enable or Disable Features

Open `Frontend/src/config/features.ts`:

```ts
export const FEATURES = {
  wishlist:     true,   // Wishlist
  reviews:      true,   // Product reviews
  tickets:      true,   // Support tickets
  liveChat:     false,  // Live chat
  newsletter:   false,  // Newsletter signup
};
```

Set a feature to `false` to hide it from the UI without deleting any code.

### Fully removing a feature (for Lite package)

| Feature | Files to delete |
|---|---|
| **Reviews** | `src/features/reviews/` + reviews tab in `product-detail.tsx` |
| **Wishlist** | `src/features/wishlist/` + `wishlist.tsx` + heart buttons in cards |
| **Support Tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` + nav entry |
| **Live Chat** | `src/pages/support/chat.tsx` + route in `router/index.tsx` |
| **Cookie Consent** | `src/features/consent/` + import in `MainLayout.tsx` |

After any changes: run `npx tsc --noEmit` to check for TypeScript errors.

---

## 10. Adding Products

### Current state (mock data)

The template ships with example products at:
`Frontend/src/features/products/data/products.data.ts`

These are for demo purposes and need to be replaced with real data.

### Option A — Backend API (recommended)

API functions are already prepared in `src/features/products/api/productService.ts`.
Connect your backend and product data will come from the database automatically.

### Option B — Static data

Open `products.data.ts` and edit the array directly:

```ts
export const PRODUCTS: Product[] = [
  {
    id:          1,
    slug:        'my-product',
    name:        'My Product',
    price:       '29.99',
    oldPrice:    '39.99',   // null if no discount
    badge:       'NEW',     // null if no badge
    discount:    '-25%',    // null if no discount
    rating:      4.7,
    reviews:     128,
    category:    'Wohnen',
    description: 'Product description here…',
  },
];
```

---

## 11. Legal Pages

> **Important:** The legal texts in the template are **placeholders**. You must update them before launch — ideally with a lawyer or a service like eRecht24 or Trusted Shops.

### What you must update

| Page | File | What to change |
|---|---|---|
| **Imprint** | `src/pages/info/impressum.tsx` | Name, address, phone, email |
| **Privacy Policy** | `src/pages/info/privacy.tsx` | Your name as controller, privacy email, actual processors |
| **Terms & Conditions** | `src/pages/info/terms.tsx` | Shop name, payment methods, delivery times |
| **Shipping & Returns** | `src/pages/info/shipping.tsx` | Your actual shipping costs and partners |

---

## 12. Admin Panel

The Admin panel is a **separate project** (`Admin/`) running independently from the shop frontend.

### What the Admin panel does

| Section | Function |
|---|---|
| **Dashboard** | Revenue, orders, customers at a glance |
| **Products** | Create, edit, upload images |
| **Orders** | Manage status (New → Paid → Shipped → Delivered) |
| **Customers** | Customer list, order history, GDPR export & deletion |
| **Support** | Reply to incoming tickets |
| **Settings** | Shop name, theme, shipping costs, SMTP |

### Default login — change this before launch!

```
Email:    admin@shop.de
Password: admin123
```

To change permanently: open `Admin/src/stores/authStore.ts` and replace the placeholder check with real Supabase Auth (see section 5).

### Start Admin locally

```bash
cd Admin
npm install
npm run dev
# → http://localhost:5174
```

### Deploy Admin (Vercel)

The Admin is deployed as a **separate Vercel project** — independent from the shop:

1. Go to vercel.com → **"Add New Project"**
2. Select the same repository
3. Set **Root Directory** to: `Admin`
4. Click **"Deploy"**
5. Add a custom domain, e.g. `admin.yourshop.com` (Settings → Domains)

> The Admin URL should not be publicly known. A custom domain with password protection is recommended.

### URLs

| Environment | URL |
|---|---|
| Local | `http://localhost:5174` |
| Vercel (example) | `https://shopray-admin.vercel.app` |
| Production (recommended) | `https://admin.yourshop.com` |

---

## 13. Deployment

### Recommended: Vercel

**Shop (Frontend):**
1. Go to vercel.com → **"Add New Project"**
2. Select your ShopRay repository
3. Set **Root Directory** to: `Frontend`
4. Add all environment variables from your `.env` file (Settings → Environment Variables)
5. Click **"Deploy"**

**Admin:**
1. Add another new project from the same repository
2. Set **Root Directory** to: `Admin`
3. Add Admin environment variables
4. Deploy

### Build commands

```bash
# Frontend
cd Frontend && npm run build
# Output: Frontend/dist

# Admin
cd Admin && npm run build
# Output: Admin/dist
```

### Other hosting options

| Provider | Notes |
|---|---|
| **Netlify** | Similar to Vercel, also free tier |
| **GitHub Pages** | Static only, limited |
| **Hetzner / VPS** | Full control, requires more technical knowledge |

---

## 14. Package Tiers

ShopRay is modular. Depending on the package, you can add or remove features:

| Feature | Lite | Pro | Enterprise |
|---|---|---|---|
| Shop, cart, checkout | ✅ | ✅ | ✅ |
| 4 themes (dark + light) | ✅ | ✅ | ✅ |
| GDPR package (consent, my data) | ✅ | ✅ | ✅ |
| Customer account + order history | ✅ | ✅ | ✅ |
| Wishlist | ❌ | ✅ | ✅ |
| Product reviews | ❌ | ✅ | ✅ |
| Support tickets | ❌ | ✅ | ✅ |
| Live chat integration | ❌ | ❌ | ✅ |
| **Admin panel** | ❌ | ✅ | ✅ |
| Source code | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## Help & Support

For template questions:
- GitHub Issues: [link to your repo]
- Email: [your support address]

For third-party services:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
