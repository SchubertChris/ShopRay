# ShopRay — Setup Guide

**Version:** 2.1.0 | **Last updated:** 2026-06-28

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
12. [Newsletter (Brevo)](#12-newsletter-brevo)
13. [Choosing a Theme](#13-choosing-a-theme)
14. [Shop Name & Company Details](#14-shop-name--company-details)
15. [Enabling or Disabling Features](#15-enabling-or-disabling-features)
16. [Adding Products](#16-adding-products)
17. [Legal Pages](#17-legal-pages)
18. [Admin Panel Setup](#18-admin-panel-setup)
19. [Deployment](#19-deployment)
20. [Packages — What's included?](#20-packages--whats-included)
21. [Technology & Open Source](#21-technology--open-source)
22. [Security](#22-security)
23. [Marketing, SEO & GEO](#23-marketing-seo--geo)
24. [Help & Support](#24-help--support)

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

### Step 4 — Tests & type-checking (recommended)

The backend ships with **Vitest unit tests**. Before every deploy it's worth running a quick local check:

```bash
cd Backend
npm run check   # TypeScript type-check (tsc --noEmit)
npm test        # Run unit tests (vitest run)
```

In addition, a **GitHub Actions CI** runs automatically on every push and pull request to the `main` and `dev` branches (`.github/workflows/ci.yml`, Node 24): it checks the backend (type-check + tests) and builds both the Frontend and Admin. If CI fails, you should not deploy.

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
# Encrypts 2FA/TOTP secrets at rest in the database (AES-256-GCM).
# Generate: openssl rand -hex 32
# If left empty, secrets are stored in PLAINTEXT (backward-compatible). Strongly recommended.
# After setting it: re-enroll existing 2FA once OR log in once —
# the secrets are then encrypted automatically.
# In production (Vercel) this key MUST be set, otherwise 2FA secrets are
# cloneable by anyone with DB or backup access.
TOTP_ENC_KEY=

# ── URLs ──────────────────────────────────────────────────────────────────────
CLIENT_URL=https://yourshop.com                # Shop URL (for Stripe redirect after payment)
FRONTEND_URL=https://yourshop.com              # Base URL for internal links in emails
PORT=5000                                      # Server port (default 5000)
NODE_ENV=production
DEMO_MODE=false                                # true = all admin writes are blocked

# ── Email (SMTP) ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxx
SMTP_FROM_EMAIL=orders@yourshop.com
SMTP_FROM_NAME=My Shop                         # Sender name in emails

# ── Shop data for invoice PDF (§14 UStG — German VAT invoicing law) ───────────
# These details appear on every generated invoice
SHOP_NAME=My Shop LLC
SHOP_STREET=123 Main Street
SHOP_ZIP=10001
SHOP_CITY=Anytown
SHOP_COUNTRY=United States
SHOP_EMAIL=info@yourshop.com
SHOP_PHONE=+1 555 000 0000                     # optional
SHOP_VAT_ID=DE123456789                        # VAT ID (recommended)
SHOP_TAX_NUMBER=12/345/67890                   # Tax number (alternative to VAT ID)
INVOICE_PREFIX=INV                             # Invoice number prefix (INV-2026-00001)

# ── DHL Shipping Labels ───────────────────────────────────────────────────────
# Credentials from the DHL Business Customer Portal (developer.dhl.com)
DHL_API_KEY=your-dhl-api-key                   # DHL Business API key
DHL_BILLING_NUMBER=12345678012082              # 14-digit billing number from your DHL contract
DHL_SHIPPER_NAME=My Shop LLC                   # Sender name on the label
DHL_SHIPPER_STREET=123 Main Street             # Sender street + house number
DHL_SHIPPER_ZIP=10001                          # Sender ZIP code
DHL_SHIPPER_CITY=Anytown                       # Sender city
DHL_SANDBOX=true                               # set to false for real labels in production

# ── Push Notifications (VAPID) ───────────────────────────────────────────────
# Generate once: node -e "require('web-push').generateVAPIDKeys()"
VAPID_PUBLIC_KEY=BGJBw...                      # VAPID public key (starts with B)
VAPID_PRIVATE_KEY=FazEa...                     # VAPID private key (secret!)
VAPID_EMAIL=mailto:admin@yourshop.com          # Contact email for the push service

# ── Newsletter (Brevo) ───────────────────────────────────────────────────────
# optional — newsletter signups, details in Section 12
BREVO_API_KEY=xkeysib-...                      # Brevo API key
BREVO_LIST_ID=3                                # Brevo list ID
BREVO_DOI_TEMPLATE_ID=1                        # Double opt-in template ID (recommended for EU)
BREVO_REDIRECT_URL=https://yourshop.com/newsletter-confirmed
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
2. Open `database/schema.sql`, copy the entire contents, and click **"Run"**

This creates the following tables:

| Table | Contents |
|---|---|
| `profiles` | Customer data (name, address, role) |
| `products` | Products (price, description, stock) |
| `orders` | Orders with status history |
| `order_items` | Individual items per order |
| `reviews` | Product reviews |
| `tickets` | Support tickets |

### Step 2 — Migrations (only for updating existing databases)

> **Fresh installation:** `schema.sql` from Step 1 already includes **all** migrations (001–035, including the security hardening in 035). There is **nothing more to do** here — skip this step and continue with "What happens automatically".
>
> **Updating an existing database:** Run any migrations you haven't run yet, one at a time, in the order listed. **Important:** `migration_035` (security hardening) must be run on **every** database — including already-existing installations.

#### Full migration list (for existing DB updates)

| File | What it does |
|---|---|
| `database/migration_001_products_detail.sql` | Extended product fields (highlights, certificates, nutritional info, rich text) |
| `database/migration_002_admin_login_log.sql` | Login log for the admin panel |
| `database/migration_003_product_images.sql` | Supabase Storage bucket for product images |
| `database/migration_004_grants.sql` | Permissions for all tables |
| `database/migration_005_shipping_settings.sql` | Shipping cost configuration |
| `database/migration_006_admin_totp.sql` | Admin 2FA table (TOTP) |
| `database/migration_007_categories.sql` | Categories table for the admin panel |
| `database/migration_008_profiles_email.sql` | Email column in customer profiles + automatic trigger |
| `database/migration_009_profiles_roles.sql` | Role extension (team lead role) |
| `database/migration_010_order_payment_method.sql` | Payment method + product image in orders |
| `database/migration_011_user_ban.sql` | Customer ban/unban system |
| `database/migration_012_push_subscriptions.sql` | Web push notifications |
| `database/migration_013_invoice_label.sql` | Invoice numbers + DHL tracking columns |
| `database/migration_014_shop_settings_categories_image.sql` | Shop settings + category images |
| `database/migration_014b_ticket_messages.sql` | Ticket chat (message history) |
| `database/migration_015_mod_invites_admin_config.sql` | Staff invitations + admin configuration in DB |
| `database/migration_016_must_change_password.sql` | Password change requirement on first login |
| `database/migration_017_service_role_grants.sql` | Missing backend permissions (service_role) |
| `database/migration_018_tickets_guest.sql` | Guest tickets (support without an account) |
| `database/migration_019_ticket_priority.sql` | Ticket priority levels (low / normal / high / urgent) |
| `database/migration_020_cleanup_testdata.sql` | Cleanup of test data |
| `database/migration_021_missing_grants.sql` | Additional missing permissions |
| `database/migration_022_stripe_payment_intent.sql` | Stripe Payment Intent ID in orders |
| `database/migration_023_return_requests.sql` | Return requests table |
| `database/migration_024_return_items.sql` | Items in return requests (JSONB) |
| `database/migration_025_discount_codes.sql` | Discount / coupon code system |
| `database/migration_026_product_variants.sql` | Product variants (size, color — with per-variant stock) |
| `database/migration_027_login_log_user.sql` | Role + email in the login log |
| `database/migration_028_notifications_tasks.sql` | Notification center + task management system |
| `database/migration_029_invoice_sequence.sql` | Atomic invoice number sequence (GoBD-compliant — German audit-proof bookkeeping standard) |
| `database/migration_030_discount_atomic.sql` | Atomic discount counter (race-condition-safe) |
| `database/migration_031_team_lead_refund_requests.sql` | Team lead role + refund requests |
| `database/migration_032_mod_totp.sql` | 2FA for staff members |
| `database/migration_033_stock_reservation.sql` | Stock reservations + atomic stock decrement (race-condition- and oversell-safe) |
| `database/migration_034_discount_claim.sql` | Atomic discount reservation (TOCTOU fix — prevents double redemption when max_uses=1) |
| `database/migration_035_security_hardening.sql` | **Security-critical:** RLS hardening (no role escalation to owner, no fake "paid" orders via direct insert, contact-spam protection) + ratings count only verified reviews — **run on every DB** |

> **Order matters:** Always run migrations in the order listed above. All files are idempotent — running them more than once will not cause errors.
>
> **Note on number 014:** Migration 014 is split into two files — `migration_014_shop_settings_categories_image.sql` and `migration_014b_ticket_messages.sql`. **Both** must be run (only relevant for existing DB updates).

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
3. Under **Redirect URLs** add the following entries:
   ```
   https://myshop.com/auth/reset-password
   http://localhost:5173/auth/reset-password
   ```
   This URL is needed for the password-reset link in the email Supabase sends to your customers.

### Step 4 — Disable email confirmation

By default, Supabase sends a confirmation email after registration. Until you have your own SMTP server set up, you should disable this:

1. In Supabase: **Authentication → Sign In / Providers → Email**
2. Turn off the **"Confirm email"** toggle
3. Click **Save**

> Once you set up your own SMTP provider later (Section 8), you can re-enable this.

### Step 5 — Enable two-factor authentication (recommended)

ShopRay supports TOTP-based 2FA (Google Authenticator, Authy, etc.) for customer accounts.

1. In Supabase: **Authentication → Sign In / Up**
2. Under **Multi-Factor Authentication** → set **TOTP** to **Enabled**

Customers can then enable 2FA themselves in their account settings.

### Step 6 — Set up Google login (optional)

ShopRay supports login and registration with a Google account. For this you need a Google Cloud app.

**Google Cloud Console:**

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. **APIs & Services → OAuth consent screen** → choose "External" → fill in app name + email
4. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add the authorized redirect URI:
   ```
   https://YOUR-SUPABASE-URL.supabase.co/auth/v1/callback
   ```
   (You'll find the URL in Supabase under Settings → API → Project URL)
7. Copy the **Client ID** and **Client Secret**

**In Supabase:**

1. **Authentication → Sign In / Providers → Google**
2. Turn on the **"Enable"** toggle
3. Enter the **Client ID** and **Client Secret** from Google
4. **Save**

After this step, the "Sign in with Google" and "Sign up with Google" buttons in the shop work automatically.

### Step 7 — Customize email templates (optional)

1. In Supabase: **Authentication → Email Templates**
2. Customize the templates for "Confirm signup", "Reset Password", and "Magic Link" with your shop name and branding.

---

## 6. Connecting Stripe

### Step 1 — Account and keys

1. Go to https://stripe.com and sign in
2. In the dashboard: **Developers → API Keys**
3. Copy the **"Publishable key"** (starts with `pk_live_`) → `Frontend/.env` as `VITE_STRIPE_PUBLIC_KEY`
4. Copy the **"Secret key"** (starts with `sk_live_`) → `Backend/.env` as `STRIPE_SECRET_KEY`

> **Important:** Never put the secret key in the frontend — backend only!

### Step 2 — Test mode

During development, work with test keys (`pk_test_...`, `sk_test_...`). Test card that always works: `4242 4242 4242 4242`, any future expiry date, any CVC.

### Step 3 — Set up the webhook

The webhook is set up after the backend deployment (see Step 7).

---

## 7. Backend & Webhook

> **Note:** The backend has built-in rate limiting (100 requests / 15 minutes globally, with stricter limits for login and checkout). The limits reset on a server restart.

### Step 1 — Start the backend locally

```bash
cd Backend
npm install
npm run dev
# Test: http://localhost:5000/api/health → {"status":"ok"}
```

### Step 2 — Test the Stripe webhook locally

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/webhook/stripe
```

The CLI prints a **webhook signing secret** (`whsec_...`) — add it to `Backend/.env` as `STRIPE_WEBHOOK_SECRET`.

### Step 3 — Deploy the backend (Vercel)

See Section 19 for the full deployment guide with Vercel.

### Step 4 — Stripe webhook in production

After deployment:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://YOUR-BACKEND-URL.vercel.app/api/webhook/stripe`
3. Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`, `charge.refunded`
4. Copy the **Signing Secret** → into the Vercel backend project as `STRIPE_WEBHOOK_SECRET`

> **About the `checkout.session.expired` event:** When a Stripe checkout session expires, the backend automatically releases the reserved stock (Migration 033) and the discount reservation (Migration 034), and sets the associated `pending` order to `cancelled`. This way no stock stays artificially blocked.

### Backend endpoints overview

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Status check |
| POST | `/api/webhook/stripe` | Stripe events (internal) |
| GET | `/api/products` | All active products |
| GET | `/api/products/:slug` | Single product |
| GET | `/api/settings/shipping` | Shipping cost settings (public) |
| POST | `/api/orders/checkout` | Start Stripe checkout |
| GET | `/api/orders` | Own orders (auth) |
| GET | `/api/customers/me` | Own profile (auth) |
| GET | `/api/customers/me/export` | GDPR data export (auth) |
| DELETE | `/api/customers/me` | Delete account (GDPR Art. 17) |
| POST | `/api/contact` | Send contact request |
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/products` | All products (admin) |
| GET | `/api/admin/categories` | Categories list (admin) |
| POST | `/api/admin/categories` | Create category (admin) |
| DELETE | `/api/admin/categories/:id` | Delete category (admin) |
| GET | `/api/admin/reviews` | Manage reviews (admin) |
| PATCH | `/api/admin/reviews/:id/verify` | Approve review (admin) |
| PATCH | `/api/admin/reviews/:id/reject` | Reject review (admin) |
| DELETE | `/api/admin/reviews/:id` | Delete review (admin) |
| GET | `/api/admin/customers` | Customer list (admin) |
| GET | `/api/admin/customers/:id` | Customer profile + GDPR export (admin) |
| PATCH | `/api/admin/customers/:id/role` | Change customer role (admin) |
| DELETE | `/api/admin/customers/:id` | Delete customer (admin) |
| GET | `/api/admin/orders` | Orders (admin) |
| PATCH | `/api/admin/orders/:id/status` | Change order status (admin) |
| PUT | `/api/admin/settings/shipping` | Save shipping settings (admin) |

---

## 8. Email Setup

The shop automatically sends emails for order confirmations, password resets, and ticket replies.

### Recommended providers

| Provider | Free tier | Link |
|---|---|---|
| **Resend** | 3,000 emails/month | https://resend.com |
| **Postmark** | 100 emails/month | https://postmarkapp.com |
| **AWS SES** | 62,000 emails/month | https://aws.amazon.com/ses |

### Setup (example: Resend)

1. Create an account at https://resend.com
2. Verify your domain (set DNS records — Resend walks you through it step by step)
3. Create an **API key**
4. Add to `Backend/.env`:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=587
   SMTP_USER=resend
   SMTP_PASS=re_xxxx
   SMTP_FROM_EMAIL=orders@yourshop.com
   ```

> **Note:** SMTP is only used in the backend — no API key goes in the frontend.

---

## 9. Invoice Setup

ShopRay automatically generates a GoBD-compliant (German audit-proof bookkeeping standard) PDF invoice as soon as an order is paid. The invoice is:
- sent **automatically** to the customer by email (via the Stripe webhook)
- available as a download in the **admin panel** on the order detail page

### Required fields (§14 UStG — German VAT invoicing law)

Add your company details to `Backend/.env` — they appear on every invoice:

```env
SHOP_NAME=My Shop LLC
SHOP_STREET=123 Main Street
SHOP_ZIP=10001
SHOP_CITY=Anytown
SHOP_COUNTRY=United States
SHOP_EMAIL=info@yourshop.com
SHOP_PHONE=+1 555 000 0000       # optional
SHOP_VAT_ID=DE123456789          # VAT ID (e.g. DE123456789)
SHOP_TAX_NUMBER=12/345/67890     # Tax number (from the tax authority)
INVOICE_PREFIX=INV               # Invoice number prefix (INV-2026-00001, INV-2026-00002, …)
```

> **VAT ID vs. Tax Number:** For B2C shops, the tax number is enough. If you also issue B2B invoices or sell across the EU, we recommend adding the VAT ID as well. Just enter both — the invoice automatically shows whatever is present.

### Invoice numbers

Invoice numbers are assigned sequentially (e.g. `INV-2026-00001`, `INV-2026-00002`, …). The assignment is idempotent — if the same order is fetched more than once, the number stays the same. This satisfies the GoBD requirement of immutability.

### Download an invoice manually

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
DHL_SHIPPER_STREET=123 Main Street  # street + house number
DHL_SHIPPER_ZIP=10001
DHL_SHIPPER_CITY=Anytown
DHL_SANDBOX=true                    # For testing: true. For real labels: false
```

**Where do I find the billing number?** In the DHL Business Customer Portal under **My DHL → Products & Contracts**. It is 14 digits and starts with your 8-digit EKP number.

### Step 2 — Test with sandbox

With `DHL_SANDBOX=true`, labels are created against the DHL test environment. The labels are not valid for real shipping, but are perfect for testing.

Sandbox credentials for testing: https://developer.dhl.com/api-reference/parcel-de-shipping-post-parcel-germany-v2#section/Authentication/ApiKeyAuth

### Step 3 — Switch to production

```env
DHL_SANDBOX=false
```

After this, real labels are created and the customer's order status is automatically set to **"Shipped"** on label creation.

### Create a label (Admin panel)

Admin panel → **Orders** → open an order → **"DHL Label"** button → enter package weight → **"Create & Download Label"**

The label is downloaded as a PDF. The DHL tracking number is saved in the order and shown as a tracking link.

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

> **Important:** Only generate the keys once. If you generate new keys, all existing push subscriptions must be renewed (users must re-subscribe).

### Step 2 — Enable in the admin panel

1. Open the admin panel → **Settings → Notifications**
2. Click **"Enable Notifications"**
3. Confirm the browser permission

After this, a push notification appears for every new order — even when the browser is minimized.

---

## 12. Newsletter (Brevo)

The template ships with a ready-made backend route for newsletter signups. All you need is a free Brevo account.

> **Why Brevo?** Brevo is EU-hosted, GDPR-compliant, and has double opt-in built in — legally required in Germany under §7 UWG (German anti-spam / consent law, specifically § 7 (2) No. 3 UWG).

### Step 1 — Create a Brevo account

1. Go to **https://www.brevo.com** and create a free account
2. Confirm your email address and log in

### Step 2 — Create a contact list

1. In the Brevo dashboard: **Contacts → Lists → Create a list**
2. Give it a name (e.g. "Shop Newsletter")
3. Note the **List ID** — a number visible in the URL (e.g. `/lists/3` → the ID is `3`)

### Step 3 — Create an API key

1. Click your **account name** in the top right → **SMTP & API**
2. Go to the **API Keys** tab → **Generate a new API key**
3. Give it a name (e.g. "ShopRay") and click **Generate**
4. Copy the displayed key immediately — it is only shown once!

### Step 4 — Set the environment variables

Add these values to `Backend/.env` and to Vercel (**Settings → Environment Variables**):

```env
# Required
BREVO_API_KEY=xkeysib-...           # your API key from Step 3
BREVO_LIST_ID=3                     # list ID from Step 2

# Optional — double opt-in (recommended for the EU / Germany)
BREVO_DOI_TEMPLATE_ID=1             # template ID (see Step 5)
BREVO_REDIRECT_URL=https://your-domain.com/newsletter-confirmed
```

### Step 5 — Set up double opt-in (recommended)

Double opt-in means: after signing up, the customer receives an email and must click a link inside it. Only then are they added to the list. This is legally required in Germany (§7 UWG — German anti-spam / consent law).

**Create a template in Brevo:**

1. **Campaigns → Email Templates → Create a template**
2. Template type: **Confirmation** (confirmation email)
3. Write some text, for example:
   > *Hi, click the button to confirm your subscription.*
4. Link the button to the placeholder `{{ doubleoptin }}` — Brevo automatically replaces it with the confirmation link
5. Save the template → note the **Template ID** (shown in the URL)
6. Enter this ID as `BREVO_DOI_TEMPLATE_ID`

> **Without `BREVO_DOI_TEMPLATE_ID`:** The contact is added to the list directly (no confirmation email). Only use this if you can prove consent some other way.

### Step 6 — Enable the newsletter feature

In `Frontend/src/config/features.ts`:

```ts
newsletter: true,   // show the newsletter form on the homepage
```

### How it works in the background

When a visitor enters their email and clicks "Subscribe":

1. The frontend sends the email to `POST /api/newsletter/subscribe`
2. The backend validates the email address (format, max. 254 characters)
3. Brevo is called — with DOI: a confirmation email is sent; without DOI: direct assignment to the list
4. Already-subscribed addresses are silently ignored (no error)
5. The visitor sees "Almost done! Check your inbox…"

### What happens if `BREVO_API_KEY` is not set?

The route still returns `200 OK` — the shop works normally and the signup is silently discarded. This way there are no visible errors if you haven't configured the newsletter yet.

---

## 13. Choosing a Theme

ShopRay comes with **4 color palettes**, each in **dark and light mode** — making 8 themes in total.

| Palette | Character | Best for |
|---|---|---|
| **sage** | Natural green, calming | Organic, wellness, health |
| **navy** | Dark blue, professional | Premium, B2B, electronics |
| **terra** | Earth tones, warm | Fashion, lifestyle, home |
| **electric** | Bright blue, modern | Streetwear, gaming, tech |

### Change the default theme

Open [Frontend/src/providers/ThemeProvider.tsx](Frontend/src/providers/ThemeProvider.tsx) and change the default value:

```tsx
// Palette: 'sage' | 'navy' | 'terra' | 'electric'
() => (localStorage.getItem('sr-palette') as Palette) ?? 'sage'

// Mode: 'light' | 'dark'
() => (localStorage.getItem('sr-mode') as ThemeMode) ?? 'light'
```

> Users can change the theme themselves via the theme toggle in the shop. Your setting only applies as the default for new visitors.

---

## 14. Shop Name & Company Details

All shop and company data is configured in one central file:
[Frontend/src/config/app.ts](Frontend/src/config/app.ts)

Changes there are automatically applied to the header, footer, imprint, privacy policy, and withdrawal form.

```ts
export const APP_NAME    = 'Your Shop Name';
export const APP_URL     = 'https://your-domain.com';
export const APP_TAGLINE = 'Short slogan for the footer';

export const APP_COMPANY = {
  owner:   'John Doe',
  street:  '123 Main Street',
  zip:     '10001',
  city:    'Anytown',
  country: 'United States',
  ustId:   'DE 123 456 789',
  hrb:     '',
};

export const APP_CONTACT = {
  email:   'hello@your-domain.com',
  phone:   '+1 555 000 0000',
  address: '123 Main Street, 10001 Anytown',
};
```

> **Important:** Use real data — placeholders are not suitable for a live shop. Incorrect imprint data can result in legal warnings.

---

## 15. Enabling or Disabling Features

Edit the values in `Frontend/src/config/features.ts`:

```ts
export const FEATURES = {
  reviews:    true,   // Product reviews
  wishlist:   true,   // Wishlist
  tickets:    true,   // Support tickets
  lmiv:       false,  // Nutritional info (only for food / supplements)
  newsletter: true,   // Newsletter form on the homepage (requires Brevo — Section 12)
};
```

### Removing features completely

| Feature | What to remove |
|---|---|
| **Reviews** | `src/features/reviews/` + tab in `product-detail.tsx` |
| **Wishlist** | `src/features/wishlist/` + `wishlist.tsx` + heart buttons |
| **Support tickets** | `src/features/tickets/` + `tickets.tsx` + `ticket-new.tsx` |
| **Live chat** | `src/pages/support/chat.tsx` + route in `router/index.tsx` |

After any change: run `npx tsc --noEmit` to check for TypeScript errors.

---

## 16. Adding Products

Products are created via the **admin panel** (recommended) or inserted directly into the database via SQL.

### Option A — Admin panel (recommended)

1. Open the admin panel → **Products → New Product**
2. Fill in all fields: name, price, description, images, category
3. Click **"Save"** — the product is visible in the shop immediately

### Setting up product variants (size, color, material …)

If your product comes in different variations (e.g. sizes S/M/L or colors Red/Blue), you can set up variants. Each variant has its own stock.

**Prerequisite:** Migration 026 must have been run (see Section 4).

**How to set up:**

1. Open an existing product: Admin panel → **Products → Edit product**
2. On the right side, find the **"Variants"** section
3. Click **"Add option group"** — e.g. "Size"
4. Enter the values (e.g. S, M, L, XL) and confirm each value with Enter
5. Add more option groups if needed (e.g. "Color" → Red, Blue) — up to 3 groups
6. Click **"Generate SKU matrix"** — the system automatically creates all combinations (e.g. S/Red, S/Blue, M/Red, …)
7. For each combination, enter stock and optionally a price surcharge
8. Click **"Save variants"**

**What happens in the shop:**
- The customer sees selection fields for each option group
- Sold-out combinations are automatically struck through
- The price adjusts instantly if you set a price surcharge
- Each variant has its own stock — automatically deducted after an order

**No variant system needed?** Products without variants work exactly as before — the feature is fully optional.

### Creating discount codes

With discount codes you can create discounts for customers. A code can be configured as a percentage (e.g. 10% off the order total) or a fixed amount (e.g. $5 off).

**Prerequisite:** Migration 025 must have been run (see Section 4).

**How to set up:**

1. Admin panel → **Discount Codes → New Code**
2. Fill in the following fields:
   - **Code** — e.g. `SUMMER10` (customers enter this code at checkout, case-insensitive)
   - **Type** — Percent (%) or fixed amount (€/$)
   - **Value** — e.g. 10 for 10% or 5 for $5
   - **Minimum order value** — e.g. $30 (optional, 0 = no minimum)
   - **Max redemptions** — how many times the code can be redeemed in total (empty = unlimited)
   - **Valid until** — optional expiry date
3. Click **"Save"**

**What happens in the shop:** The customer enters the code at checkout — the discount is shown immediately and deducted from the order total. After a successful payment, the redemption counter is automatically incremented.

### Option B — Seed data (for testing)

The `database/seed.sql` file contains sample products. You can run it once in the SQL Editor to populate the shop with test data.

---

## 17. Legal Pages

> **Important:** The legal texts in the template are placeholders. Update them before launch — ideally with a lawyer or a service like eRecht24 or Trusted Shops (or, outside Germany, an equivalent like Termly or iubenda).

### Company data — applied automatically

When you enter your data in `Frontend/src/config/app.ts` (Section 14), it is automatically applied to the following pages:
- `/impressum` (imprint) — name, address, VAT ID, contact
- `/datenschutz` (privacy policy) — name of the responsible party, contact email
- `/widerruf` (withdrawal) — company address in the withdrawal form

### Check the remaining texts manually

| Page | File | What to update |
|---|---|---|
| **Terms & Conditions** | `src/pages/info/terms.tsx` | Payment methods, delivery times |
| **Privacy Policy** | `src/pages/info/privacy.tsx` | Add your data processors |
| **Withdrawal** | `src/pages/info/widerruf.tsx` | Check if the template applies |
| **Shipping** | Automatic from the admin panel | No manual changes needed |

### Newsletter — legal note

The template includes a ready-made Brevo integration WITH double opt-in (§7 UWG — German anti-spam / consent law). Set up Brevo as described in **Section 12** and set `BREVO_DOI_TEMPLATE_ID` — this fulfills the legal consent requirement. Without a DOI template, contacts are added directly, which is only permitted if you can prove consent some other way.

### Additional steps for food supplements

- **National food authority registration** before the first sale (in Germany: BfR notification)
- **LMIV details** (EU Food Information Regulation 1169/2011) filled in completely on every product page
- **Health claims** checked: only use EU-approved claims

---

## 18. Admin Panel Setup

The admin panel is a separate project (`Admin/`) and runs independently from the shop frontend.

### What the admin panel can do

| Section | Function |
|---|---|
| **Dashboard** | Revenue, orders, customers at a glance — click an order to open its details |
| **Analytics** | Revenue and order trends as charts, top products, order status breakdown, KPI cards — for 7, 30, or 90 days |
| **Products** | Create, edit, upload images, CSV bulk import, variants (size/color/…) |
| **Orders** | Manage status, download PDF invoice, create DHL shipping label |
| **Customers** | Customer list, order history, GDPR export (Art. 20), ban/unban customers |
| **Categories** | Create categories, set their order, delete |
| **Reviews** | Approve, reject, or delete — with a tab filter |
| **Discount Codes** | Create discount codes (percentage or fixed amount), validity period, minimum order value, max redemptions |
| **Support** | Reply to incoming contact requests and tickets |
| **Settings → Shipping** | Configure shipping costs, free-shipping threshold, delivery time live |
| **Settings → Security** | Login log — every admin login is recorded |
| **Settings → Notifications** | Enable push notifications (new orders on your smartphone) |

### Configure shipping costs

Shipping costs are configured **exclusively in the admin panel** — no code change needed:

1. Admin panel → **Settings → Shipping**
2. Set the standard shipping, express shipping, free-shipping threshold, and delivery time
3. Click **"Save"**

Changes are immediately visible at checkout and on the shop's shipping info page.

### Admin login setup

**Step 1 — Hash a secure password:**

```bash
cd Backend
node -e "const b = require('bcryptjs'); b.hash('YOUR-PASSWORD', 12).then(h => console.log(h));"
```

Add the hash (`$2b$12$...`) to `Backend/.env` as `ADMIN_PASSWORD_HASH`.

**Step 2 — Generate a JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'));"
```

Add the value to `Backend/.env` as `JWT_SECRET`.

> **Important:** The default password from the template must be changed before launch!

### Start the admin locally

```bash
cd Admin && npm install && npm run dev
# → http://localhost:5174
```

---

## 19. Deployment

ShopRay consists of three separate Vercel projects in the same GitHub repository (**monorepo**).

### Step 1 — Set up the GitHub repository

1. Create a new **private** repository at https://github.com/new
2. Do not check README or .gitignore
3. In your ShopRay folder:

```bash
git remote add origin git@github.com:YOUR-USERNAME/ShopRay.git
git push -u origin main
```

### Step 2 — Create three Vercel projects

Create a separate Vercel project for **Frontend**, **Backend**, and **Admin**:

1. https://vercel.com → **"Add New Project"**
2. Select the GitHub repository
3. Set the **Root Directory** — this is critical:

| Vercel project | Root Directory | Framework |
|---|---|---|
| shopray (Frontend) | `Frontend` | Vite |
| shopray-backend | `Backend` | Node.js |
| shopray-admin | `Admin` | Vite |

4. Add all environment variables from the respective `.env` file in Vercel (**Settings → Environment Variables**)
5. Deploy

> ### ⚠️ MANDATORY before going live: replace the backend URL in the rewrite
>
> In production, the Frontend and Admin route **all** `/api/*` requests through a rewrite
> to your backend. This rewrite is **hard-coded** in two files:
>
> - `Frontend/vercel.json`
> - `Admin/vercel.json`
>
> They currently contain the backend domain of the ShopRay template:
>
> ```json
> { "source": "/api/:path*", "destination": "https://shopray-backend.vercel.app/api/:path*" }
> ```
>
> **Change `shopray-backend.vercel.app` in BOTH files to the URL of your own
> backend project** (e.g. `https://your-backend.vercel.app` or `https://api.yourshop.com`).
> If you don't, your shop sends every API request — including login and order data —
> to someone else's backend. After changing it: commit and redeploy.

### Step 3 — Connect GitHub to existing Vercel projects

If you already have Vercel projects and are connecting GitHub afterward:

1. Vercel → Your project → **Settings → Git**
2. **"Connect Git Repository"** → GitHub → select your repo
3. Vercel → **Settings → Build and Deployment → Root Directory** → enter the right folder
4. Click **Save**

From now on, Vercel deploys automatically on every `git push`.

### Step 4 — Custom domain (recommended)

| Project | Suggested domain |
|---|---|
| Frontend | `yourshop.com` |
| Backend | `api.yourshop.com` |
| Admin | `admin.yourshop.com` |

In Vercel: **Settings → Domains → Add** → enter the domain → set the DNS records as instructed.

> The admin panel should never be on a publicly known URL. A custom domain with password protection is recommended.

### Step 5 — Verify after deployment

Open these URLs and check that everything works:

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
4. Redeploy the backend (Vercel → **Deployments → Redeploy**)

> **Tip:** Vercel also creates a preview URL on every deployment (e.g. `shopray-admin-xxxx.vercel.app`). The admin panel automatically allows all `*.vercel.app` subdomains — so you only need to enter your own domain in `ADMIN_URL`.

**Admin login fails (500)**

Check that `JWT_SECRET` and `ADMIN_PASSWORD_HASH` are set in the Vercel environment variables (Section 18).

### Step 6 — Demo mode (optional)

To present ShopRay as a live demo without permanent changes:

1. Vercel backend project → **Settings → Environment Variables**
2. Set `DEMO_MODE` to `true` → redeploy

In demo mode all admin write operations are blocked (HTTP 403). Login, logout, and all GET requests work normally. Reset demo data by running `database/seed.sql` in the Supabase SQL Editor.

---

## 20. Packages — What's included?

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
| **Discount / coupon codes** | ❌ | ✅ | ✅ |
| **Product variants (size/color)** | ❌ | ✅ | ✅ |
| **GoBD-compliant PDF invoices** | ❌ | ✅ | ✅ |
| **DHL shipping labels** | ❌ | ✅ | ✅ |
| **Web push notifications** | ❌ | ✅ | ✅ |
| **RBAC (Owner / Team Lead / Mod roles)** | ❌ | ✅ | ✅ |
| Source code | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

---

## 21. Technology & Open Source

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
| **PostgreSQL** | Database | PostgreSQL License | ✅ yes |
| **Supabase** | Auth + database host | Apache 2.0 | ✅ yes |
| **Stripe** | Payment processing | proprietary | ❌ no |

### Self-hosting Supabase

Supabase is fully open source and can be run on your own server:

- VPS with at least 4 GB RAM (e.g. Hetzner, Contabo, DigitalOcean)
- Docker
- Official guide: https://supabase.com/docs/guides/self-hosting/docker

Just swap the URL in `.env`:
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

## 22. Security

Security is built into ShopRay from the start — not bolted on afterward. This section sums up what the template protects automatically and what you still need to do before going live. You don't need any security knowledge to run the shop safely; the important safeguards are built in.

### Admin login: cookie + CSRF protection

The admin signs in via an **httpOnly session cookie** (`adminSession`, `sameSite=lax`, HTTPS-only in production, 8-hour lifetime). "httpOnly" means: malicious code in the browser cannot read the login token.

In addition, a **CSRF protection** (Cross-Site Request Forgery — forged requests from other websites) is in place. State-changing admin requests that rely only on the cookie require an extra `X-Requested-With` header — the admin frontend sets it automatically, so you don't have to do anything. **Guest and customer actions** (checkout, contact form, newsletter) are never affected by this.

### Two-factor authentication (2FA / TOTP)

The owner and staff members can secure their login with an authenticator app (Google Authenticator, Authy, …). The associated secrets are stored **encrypted with AES-256-GCM** in the database — the key for this is `TOTP_ENC_KEY` (see Section 3). Without a key set, the secrets are stored in plaintext (backward-compatible) — **in production you should always set the key.**

### Database hardening (Row Level Security)

All tables have **Row Level Security (RLS)** — every user only sees and changes their own data. `migration_035` hardens this further:

- Users **cannot** escalate their own role to "owner" (no privilege escalation).
- It is **not possible to write fake "paid" orders** via a direct insert into the database — an order is only marked paid via the verified Stripe webhook.
- Contact requests run exclusively through the rate-limited backend (spam protection).

> **Mandatory:** `migration_035` must be run on **every** database — including already-existing installations, not just on a fresh installation (see Section 4).

### Amounts are calculated server-side

**Shipping costs and discounts** are calculated exclusively in the backend and passed to the payment as real Stripe line items (`shipping_option`). Values from the customer's browser are **never** trusted — a manipulated cart cannot change the amount to be paid.

### Stripe webhook: signed and idempotent

Incoming payment confirmations from Stripe are verified via a **signature check** (`STRIPE_WEBHOOK_SECRET`) — forged confirmations are rejected. Processing is **idempotent**: the transition from `pending` to `paid` happens exactly once per order, even if Stripe sends an event multiple times.

### Protection against race conditions

- **Stock** (`migration_033`) and **discount codes** (`migration_034`) are reserved atomically — even with many simultaneous orders, nothing can be sold twice or redeemed twice.
- **Refunds** follow the **4-eyes principle**: a refund must be confirmed by a team lead (`migration_031`).

### Further protection mechanisms

- **Rate limiting** on login, checkout, contact, newsletter, and discount-code validation — slows down automated attacks and spam.
- **`SUPABASE_SERVICE_ROLE_KEY`** belongs exclusively in the backend, **never** in the frontend or admin — this key bypasses RLS and has full database access.
- **Demo mode** (`DEMO_MODE=true`) blocks all write access (HTTP 403) — ideal for a publicly reachable demo instance.
- **Security headers** (CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, and more) are set via `vercel.json` and the `helmet` middleware.
- **vercel.json rewrite:** Enter your **own** backend URL in `Frontend/vercel.json` and `Admin/vercel.json`, otherwise API requests go to someone else's backend (see Section 19).

### Before go-live — security checklist

- [ ] `TOTP_ENC_KEY` set (mandatory in production — otherwise 2FA secrets are in plaintext)
- [ ] `migration_035` run on the production database
- [ ] Your own backend URL entered in **both** `vercel.json` files (Frontend + Admin)
- [ ] Real company data in `Frontend/src/config/app.ts` and `Backend/.env` (no placeholders)
- [ ] Stripe **Live** keys set instead of test keys
- [ ] Default admin password from the template changed (`ADMIN_PASSWORD_HASH`)
- [ ] `npm run check` + `npm test` green in the backend locally (see Section 2)

---

## 23. Marketing, SEO & GEO

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
| Category name in the title | e.g. "Kitchen \| Your Shop" instead of "All Products" |

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

## 24. Help & Support

For questions about the template:
- GitHub Issues: https://github.com/SchubertChris/ShopRay/issues
- Email: [your support address]

For external services:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
