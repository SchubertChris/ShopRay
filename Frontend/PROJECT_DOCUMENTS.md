<!-- @claude Hier dokumentierst du bitte jede änderung in einem Oneliner mit Timestamp -->

# 📋 Änderungsprotokoll

| Datum | Änderung |
| :--- | :--- |
| 2026-05-10 | SCSS-Basis vollständig implementiert: alle 44 Dateien (Abstracts, Base, Components, Layouts, Pages, Utilities, Themes) |
| 2026-05-10 | `_functions.scss`: rem() und fluid() Funktionen mit sass:math |
| 2026-05-10 | `_breakpoints.scss`: $breakpoints Map (sm/md/lg/xl/2xl) |
| 2026-05-10 | `_mixins.scss`: respond-to, flex-center/between, transition, truncate, line-clamp, overlay, glass, focus-ring + alle @keyframes |
| 2026-05-10 | `_placeholders.scss`: %btn-reset, %icon-btn, %card-base, %visually-hidden, %link-clean, %input-base |
| 2026-05-10 | `_reset.scss`: Modern CSS Reset (Josh Comeau-basiert) |
| 2026-05-10 | `_base.scss`: html/body, Scrollbar, ::selection, reduced-motion |
| 2026-05-10 | `_typography.scss`: Fluid-Typescale h1-h6, .label, .text-muted, .text-lead |
| 2026-05-10 | `_buttons.scss`: .btn + Varianten (primary/secondary/ghost/text/danger) + Größen (sm/lg/full) + .btn-icon |
| 2026-05-10 | `_cards.scss`: .card, .product-card, .info-card, .order-card, .stat-card |
| 2026-05-10 | `_feeds.scss`: .product-feed, .list-feed, .review-feed, .notification-feed |
| 2026-05-10 | `_modals.scss`: .modal-overlay, .modal, .drawer, .toast |
| 2026-05-10 | `_post.scss`: .post (Langtext-Container) + .faq-item Accordion |
| 2026-05-10 | `_header.scss`: .header, .nav (sticky + glass), .mobile-nav |
| 2026-05-10 | `_footer.scss`: .footer mit 4-spaltigem Grid + legal links |
| 2026-05-10 | `_grid.scss`: .container, .grid (2/3/4/auto/sidebar), .section, .badge, .form-* Elemente, .spinner, .empty-state |
| 2026-05-10 | `_helpers.scss`: Utility-Klassen (display, flex, text, spacing, colors) |
| 2026-05-10 | `_accessibility.scss`: .sr-only, .skip-link, globaler :focus-visible Ring |
| 2026-05-10 | Pages: alle 15 Page-SCSS-Dateien implementiert (home, auth, cart, checkout, product-detail, search, order-success, dashboard, wishlist, orders-history, about, contact, faq, legal, error) |
| 2026-05-10 | `CLAUDE.md` mit Coding-Regeln und Workflow für dieses Projekt befüllt |
| 2026-05-10 | Deprecation-Warnings behoben: sass:map und sass:list Module korrekt genutzt |
| 2026-05-10 | 4 Farbpaletten implementiert: sage-light/dark, navy-light/dark, terra-light/dark, electric-light/dark |
| 2026-05-10 | `_root.scss` auf alle 8 data-theme Kombinationen erweitert |
| 2026-05-10 | Skeleton-Styles hinzugefügt: .skeleton, .skeleton-text, .skeleton-title, .skeleton-avatar, .skeleton-thumb |
| 2026-05-10 | `App.tsx` vollständig neu als SCSS-Showcase: alle Komponenten, alle Paletten schaltbar, interaktiv |
| 2026-05-10 | `App.tsx` als polierter Shop-Showcase neugeschrieben: editorial Hero, Trust-Marquee, Kategorien-Grid, 2× Produkt-Grids mit Skeleton/Wishlist/QuickView, Brand-Statement, 6 USP-Cards, Testimonials mit Score, FAQ-Accordion, Newsletter-Sektion, Cart-Drawer mit Versandinfo, alle 8 Themes + Dark/Light schaltbar |
| 2026-05-11 | `src/config/theme.ts` + `routes.ts`: zentralisierte Theme- und Routen-Konstanten |
| 2026-05-11 | `src/providers/ThemeProvider.tsx`: Palette + Mode als Context, localStorage-Persistenz, data-theme auf document.documentElement |
| 2026-05-11 | Layouts: `MainLayout`, `AuthLayout`, `AccountLayout`, `Header`, `Footer` mit react-router-dom, ScrollRestoration, NavLink |
| 2026-05-11 | `src/router/index.tsx`: createBrowserRouter mit 3 Layout-Tiers (Main/Auth/Account), alle Routen registriert |
| 2026-05-11 | `App.tsx` auf dünne Router-Shell reduziert (ThemeProvider + RouterProvider) |
| 2026-05-11 | Showcase-Inhalt nach `src/pages/home/home.tsx` ausgelagert |
| 2026-05-11 | Auth-Seiten: `login.tsx`, `register.tsx` |
| 2026-05-11 | Shop-Seiten: `cart.tsx`, `checkout.tsx`, `product-detail.tsx`, `search-results.tsx`, `order-success.tsx` |
| 2026-05-11 | User-Seiten: `dashboard.tsx`, `orders-history.tsx`, `wishlist.tsx` |
| 2026-05-11 | Info/Common-Seiten: `about.tsx`, `contact.tsx`, `faq.tsx`, `impressum.tsx`, `privacy.tsx`, `terms.tsx` |
| 2026-05-11 | System: `not-found.tsx` (404-Seite) |
| 2026-05-11 | TypeScript-Check bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | Zustand installiert: `zustand` mit `persist` Middleware für Cart (`sr-cart`) und Wishlist (`sr-wishlist`) |
| 2026-05-11 | `features/products`: Product-Typen mit `slug`, PRODUCTS-Daten, `useProducts`/`useProductBySlug`/`useProductSearch` Hooks |
| 2026-05-11 | `features/cart`: Zustand-Store mit `addItem`/`removeItem`/`updateQuantity`/`clearCart`/`total()`/`count()` |
| 2026-05-11 | `features/wishlist`: Zustand-Store mit `toggle`/`has`/`clear`, localStorage-Persistenz |
| 2026-05-11 | Shared UI: `Stars`, `ProductImage`, `ProductCard` (mit skeleton, revealDelay, onQuickView) aus `@components/ui` |
| 2026-05-11 | `Header.tsx`: Cart-Badge mit echtem `useCart(s => s.count())`, Ink-Drop View-Transition auf Theme-Wechsel |
| 2026-05-11 | `ThemeProvider.tsx`: `document.startViewTransition()` + `flushSync()` für Ink-Drop Effekt |
| 2026-05-11 | `_base.scss`: `@keyframes vt-reveal` + `vt-fade-out`, `::view-transition-new/old(root)` Ink-Drop Animation |
| 2026-05-11 | `home.tsx`: vollständig auf Zustand-Stores umgestellt, alle Inline-Styles in `_home.scss` ausgelagert |
| 2026-05-11 | `_home.scss`: Keyframes (marquee, scroll-pulse, blob-spin), [data-reveal], .home-hero, .trust-bar, .cat-grid/.cat-card, .section-head-row, .review-score/.review-bars/.review-card, .brand-statement mit Erweiterungen, .faq-wrap/.faq-item, .newsletter-cta, .modal-product, .drawer-overlay + Drawer-Erweiterungen, .toast-wrap |
| 2026-05-11 | `cart.tsx`: echte Cart-Items aus Zustand, Mengen-Steuerung (+/-), Entfernen, dynamischer Versandhinweis |
| 2026-05-11 | `product-detail.tsx`: echtes Produkt per `useProductBySlug(slug)`, Quantity-Selector, Store-Anbindung |
| 2026-05-11 | `search-results.tsx`: echte Filter-/Suchlogik mit `useProductSearch(query, category)` |
| 2026-05-11 | `wishlist.tsx`: echte Wunschliste aus `useWishlist().ids` + PRODUCTS-Filter, `ProductCard`-Grid |
| 2026-05-11 | `checkout.tsx`: echte Cart-Items und Total aus Zustand, Versandberechnung, `checkout-overview` |
| 2026-05-11 | `order-success.tsx`: `clearCart()` on mount via `useEffect`, vollständige `.order-success` SCSS-Klassen |
| 2026-05-11 | TypeScript-Check nach allen Änderungen bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | `SortBy`-Typ zu `product.types.ts` + Re-Export in `index.ts` hinzugefügt |
| 2026-05-11 | `useProductSearch` um `sortBy`-Parameter erweitert (popularity/price-asc/price-desc/newest) |
| 2026-05-11 | `search-results.tsx`: category-Bug ('' → null), Sort-Dropdown verkabelt, lokaler IntersectionObserver nach Filter/Sort-Änderung, alle Inline-Styles nach SCSS ausgelagert |
| 2026-05-11 | `_search-results.scss`: `.search-page__input-wrap`, `.search-page__input-icon`, `.search-page__input`, `.search-page__chips`, `.search-page__chip`, `.search-page__empty`, `.qv-price` ergänzt |
| 2026-05-11 | Z-Index-Audit: Stack korrekt (Header 200, MobileNav 300, ModalOverlay 400, Drawer 500, Toast 1000) — kein Konflikt |
| 2026-05-11 | Inline-Style-Bereinigung: alle `style={{}}` Violations aus 11 TSX-Dateien entfernt (ProductCard, Header, cart, checkout, product-detail, login, register, dashboard, orders-history, faq, about, contact) — Klassen in bestehende SCSS-Dateien ergänzt, `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | `src/types/` befüllt: `api.ts` (ApiResponse<T>, PaginatedResponse<T>, ApiError), `user.ts` (User, UserRole, Address, UserProfile), `order.ts` (Order, OrderItem, OrderStatus), `checkout.ts` (PaymentMethod, CheckoutPayload, CheckoutResponse), `delivery.ts` (DeliveryOption, DeliveryTracking, DeliveryStatus), `contact.ts` (ContactFormPayload/Response), `search.ts` (SearchFilters, SearchParams), `product.ts` + `cart.ts` als Re-Exports aus Features |
| 2026-05-11 | `features/auth` komplett: `auth.ts` (LoginPayload, RegisterPayload, AuthResponse, AuthState), `useAuth.ts` (Zustand-Store persist `sr-auth`), `authService.ts` (login/register/logout/getMe), `index.ts` Public-API |
| 2026-05-11 | `src/api/axiosinstance.ts`: axios-Instanz mit VITE_API_URL, Bearer-Token-Interceptor (liest aus sr-auth localStorage), 401-Handler (clearAuth + Redirect /login) |
| 2026-05-11 | `@providers` Alias zu vite.config.ts + tsconfig.app.json ergänzt |
| 2026-05-11 | Import-Alias-Bereinigung: Header.tsx, Footer.tsx, AuthLayout.tsx, login.tsx, register.tsx, dashboard.tsx auf @config/@providers/@features umgestellt |
| 2026-05-11 | Footer.tsx: Social-Links Inline-Styles → `.footer__socials` + `.footer__social-link` SCSS-Klassen; AuthLayout.tsx: Logo-Inline-Styles → `.auth-page__back-logo` |
| 2026-05-11 | `login.tsx` + `register.tsx`: Controlled Inputs, Submit-Handler mit authService, Loading/Error-State, `auth-form__error` SCSS-Klasse |
| 2026-05-11 | UX-Fixes: Login/Account-Link im Header (konditionell auth-abhängig), Logout-Button in AccountLayout, AccountLayout komplett ohne Inline-Styles + @config Alias |
| 2026-05-11 | UX-Fixes: Kategorie-Cards auf Home als `<Link>` mit `?category=`-Param; search-results.tsx liest URL-Param zur initialen Kategorieauswahl |
| 2026-05-11 | UX-Fixes: Breadcrumb auf product-detail.tsx (← Kollektionen / Kategorie / Produktname) |
| 2026-05-11 | SCSS-Ergänzungen: `.account-layout/.account-grid/.account-nav*` in _grid.scss; `.nav__account/.nav__login-btn` in _header.scss; `.product-detail__breadcrumb*` in _product-detail.scss |
| 2026-05-11 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | `dashboard.tsx`: useAuth() für User-Daten, useWishlist() für Wunschliste-Count, mock Orders mit `OrderStatus` typisiert |
| 2026-05-11 | `orders-history.tsx`: `OrderStatus` typisiert, alias-Imports bereinigt |
| 2026-05-11 | `src/hooks/useQuery.ts` + `useMutation.ts`: leichtgewichtige Fetch/Mutation-Hooks implementiert |
| 2026-05-11 | `features/products/api/productService.ts`: getProducts, getProductBySlug, searchProducts (backend-ready) |
| 2026-05-11 | `features/orders/` komplett: types re-export + orderStatusLabel(), orderService (getOrders/getOrderById), useOrders/useOrderById hooks, index.ts |
| 2026-05-11 | TypeScript-Check nach allen Änderungen bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | `src/types/index.ts`: Zentraler Re-Export-Hub mit vollständiger Dokumentation (global vs. feature-spezifisch) |
| 2026-05-11 | `features/consent/`: Cookie-Consent Feature (DSGVO/TTDSG-konform) — ConsentBanner, useConsent, Zustand-Store (sr-consent), 3 Optionen (Alle/Nur nötige/Individuell) |
| 2026-05-11 | `_consent.scss`: ConsentBanner + ConsentToggle vollständig gestylt, Dark/Light, Mobile-responsive |
| 2026-05-11 | `MainLayout.tsx`: ConsentBanner eingebunden |
| 2026-05-11 | `Footer.tsx`: Cookie-Einstellungen zurücksetzen (reset consent) ergänzt |
| 2026-05-11 | `impressum.tsx`: EU-OS Plattform-Link hinzugefügt (gesetzlich verpflichtend) |
| 2026-05-11 | `privacy.tsx`: Cookie-Consent-Mechanismus + TTDSG/DSGVO-Rechtsgrundlagen dokumentiert, Consent-Widerruf erklärt |
| 2026-05-11 | `terms.tsx`: Widerrufsfrist auf korrektes gesetzliches Minimum 14 Tage korrigiert, Muster-Widerrufsformular ergänzt |
| 2026-05-11 | `.claude/agents/legal-agent.md`: Neuer Agent für DSGVO/Cookie/Impressum/AGB/Lizenz-Prüfung vor Template-Verkauf |
| 2026-05-11 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-11 | `_variables.scss`: `dark-surface` + `on-dark` CSS-Vars zu allen 8 Palette-Varianten hinzugefügt |
| 2026-05-11 | `home.tsx` + `_home.scss`: Komplettes Redesign — Editorial Hero (100dvh split, Magnific-Stil), Cat-Bento (asymmetrisch), Products-Strip (horizontal scroll), Dark-Blocks (alternierend), USP-Bento, FAQ-Split, Newsletter-Dark, Theme-Dock (floating Demo-Button) |
| 2026-05-11 | `Header.tsx`: Palette-Picker-Dots + Dark/Light-Toggle aus dem Header entfernt — Theme-Dock auf der Homseite übernimmt diese Funktion |
| 2026-05-11 | `home.tsx` + `_home.scss` + `ProductCard.tsx`: Komplette Neugestaltung — keine Emojis, neues cat-bento mit echtem 3-Spalten Asymmetrie (dominant/groß/klein), usp-grid mit Metriken (100%, 24h, usw.), Toast mit farbigem Bar-Indikator, Hero-Liste nummeriert, alle emoji-Zeichen durch Text/Unicode-Symbole ersetzt |
| 2026-05-11 | `home.tsx`: products-strip → products-grid (Klassen-Mismatch behoben), beide Produkt-Sektionen korrekt innerhalb .container, direkte ProductCard-Items ohne Wrapper-Div |
| 2026-05-11 | `search-results.tsx` + `_search-results.scss`: Komplettes Redesign — Collection-Hero (dunkel, editorielle Typografie), Sticky-Filterbar, Signature-Grid (5er-Muster: Hero 2×2 + Wide 2×1, diagonal versetzt), Quick-View mit ProductImage/Stars/Cart/Wishlist, kein Emoji |
| 2026-05-11 | `_home.scss`: Scroll-Indikator auf `left: 50%; transform: translateX(-50%)` zentriert (war `left: 5%` → driftete auf breiten Screens nach links); `[data-theme$="-light"]`-Block ergänzt: Hero nutzt `--clr-surface` + zwei Palette-Farbblobs als Corner-Wash statt `--clr-dark-surface` |
| 2026-05-11 | `about.tsx` + `_about.scss`: Komplettes Redesign — 8 Sektionen: Hero (100dvh, Parallax via `--about-sy`), Manifesto (große Pull-Quote), Story-Timeline (5 Kapitel, Blog-Style alternierend, Jahres-Wasserzeichen), Values (3D-Tilt-Cards mit CSS-Perspective), Metrics (Blur-to-Sharp Reveal via IntersectionObserver), Process (4 Schritte, Verbindungslinie), Team (dark, 3D-Tilt), CTA (dark, Parallax); AG-Grafik-System (ag-float/morph/spin/orbit Keyframes, 4 Farb-Varianten); useTilt-Hook (mousemove → `--tx`/`--ty` CSS-Vars → perspective transform); mobile-first responsive |
| 2026-05-11 | `_about.scss`: Timeline-Chapter Scroll-Animationen — granulares System mit `.is-revealed` Klasse (separater IO, `threshold: 0.12`); Grafik: `scale(0.78) + blur(7px) + directional translateX` (A: −56px, B: +56px); Jahres-BG: `scale(1.24) → 1`; Meta: Bounce-Slide; Titel: Clip-Path Curtain-Reveal (`inset(0 0 108% 0) → inset(0 0 0% 0)`); Text: Slide-up; `prefers-reduced-motion` Override |
| 2026-05-11 | `contact.tsx` + `_contact.scss`: Komplettes Redesign — Split-Layout (50/50 Desktop, Stack Mobile): Links sticky Brand-Panel (dark, `height: calc(100dvh - 64px)`) mit Werbebild-Platzhalter (Dot-Grid, Crop-Mark-Ecken, professionelles Placeholder-Label), Kontaktkanäle (monospace Tags), Brand-Headline; Rechts: Formular-Panel (surface) mit controlled React-State, Custom-Select mit CSS-Pfeil, Focus-Glow, Sende-Animation, CSS-only Häkchen-Bestätigung ohne Emojis |
| 2026-05-11 | `home.tsx` + `_home.scss`: Hero rechts: `HERO_FEATURES`-Liste durch `.hero-slot` Kategorien-Ticker ersetzt — endloser vertikaler Carousel (6 × 3 Duplikate, CSS `@keyframes hero-slot-scroll` scrollt 384px = 6 × 64px, nahtloser Loop); Rail mit Pfeil-Zeiger (line + triangle, Glow-Shadow) positioniert mittig auf 3. Item; `mask-image` Gradient für Fade oben/unten; Light-Mode-Override |
| 2026-05-11 | `faq.tsx` + `_faq.scss`: Komplettes Redesign als futuristischer Support-Hub — 5 Sektionen: Hero (dark, Dot-Grid, Radar-Ringe mit Sweep-Animation + Crosshair + Pulsierenden Dots), Kanal-Bento (Asymmetrisches 3×3-Grid: Email 2×2 dominant, Phone/Chat rechts gestapelt, Web als Streifen), FAQ Split-Layout (sticky Sidebar mit Ghost-Wasserzeichen, grid-template-rows Accordion-Animation, nummerierte Fragen), Provider (dark, 5 gestaffelte Karten mit verschiedenen margin-top Offsets), CTA (dark, Radial-Glow); Futuristische Details: monospace Tags, Eck-Dekor, leuchtende Hover-Borders, Radar-Sweep Keyframe |
| 2026-05-11 | `_home.scss`: `.hero-slot__track` Animation von `linear` auf `steps(6, start)` — diskrete Ticks statt flüssiges Scrollen |
| 2026-05-11 | `routes.ts`: `ROUTES.SUPPORT` Namespace hinzugefügt (`CHAT: '/chat'`, `PORTAL: '/support'`) |
| 2026-05-11 | `faq.tsx`: Channel-Karten Chat + Support-Portal auf `to: ROUTES.SUPPORT.CHAT/PORTAL` umgestellt (statt `href: '#'`) |
| 2026-05-11 | `src/pages/support/chat.tsx`: Neue Seite — Split-Layout mit Chat-Widget-Platzhalter (dark, Bubble-Mockup, Typing-Indikator, Overlay-Hinweis) + Info-Panel (Provider-Karten: Intercom/Tidio/Crisp/Tawk.to) |
| 2026-05-11 | `src/pages/support/portal.tsx`: Neue Seite — Support-Portal-Platzhalter mit Stats-Header, Sidebar-Filter, Empty-State Ticket-Liste, Provider-Integration-Grid (Zendesk/Freshdesk/HelpScout) |
| 2026-05-11 | `_chat.scss` + `_portal.scss`: Vollständige SCSS für beide Support-Seiten; `_index.scss` um beide Forwards erweitert |
| 2026-05-11 | `router/index.tsx`: ChatPage + SupportPortalPage registriert (`/chat`, `/support`) |
| 2026-05-11 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-12 | `portal.tsx`: Provider-Sektion entfernt; Sidebar-Buttons interaktiv (`useState`, kein `disabled`); Search-Input aktiv mit Focus-Glow; "Neues Ticket" → `<Link to ROUTES.ACCOUNT.TICKET_NEW>`; Empty-State mit zwei Aktions-Buttons |
| 2026-05-12 | `_portal.scss`: Sidebar `cursor: pointer` + Hover-State; Search Focus-Ring; `portal-empty__actions` ergänzt |
| 2026-05-12 | `_home.scss`: hero-slot `mask-image` Spotlight-Gradient — mittleres Item voll, Nachbar-Items gedimmt (0.45/0.15) |
| 2026-05-12 | `PrivateRoute.tsx`: Auth-Guard — prüft `isAuthenticated`, leitet auf Login weiter mit `state.from` |
| 2026-05-12 | `routes.ts`: `ACCOUNT.TICKETS` + `ACCOUNT.TICKET_NEW` ergänzt |
| 2026-05-12 | `AccountLayout.tsx`: "🎫 Meine Tickets" in Account-Nav ergänzt |
| 2026-05-12 | `tickets.tsx`: Ticket-Liste mit interaktiven Tab-Filtern + Empty-State |
| 2026-05-12 | `ticket-new.tsx`: Ticket-Formular (Betreff, Kategorie, Priorität, Beschreibung, Datei-Upload) + Erfolgs-State |
| 2026-05-12 | `_tickets.scss`: SCSS für beide Ticket-Seiten; `_index.scss` Forward ergänzt |
| 2026-05-12 | `router/index.tsx`: Account unter `<PrivateRoute>` gesichert; `tickets` + `tickets/new` registriert |
| 2026-05-12 | TypeScript-Check bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-12 | Frontend-Hardening: `ErrorBoundary.tsx` als React-Klassenkomponente; `getErrorMessage()` Utility (AxiosError → deutsche Fehlermeldungen) |
| 2026-05-12 | Frontend-Hardening: `checkout.tsx` komplett neu — Validation, `FormErrors`, `createOrder()` API, `state.from`-Redirect, Empty-Cart-Guard |
| 2026-05-12 | Frontend-Hardening: `order-success.tsx` liest `location.state` (orderNumber + total); CSS-Only Icon statt Emoji |
| 2026-05-12 | Frontend-Hardening: `orders-history.tsx` verwendet `useOrders()`-Hook mit Skeleton-Loading, Error- und Empty-State |
| 2026-05-12 | Frontend-Hardening: `not-found.tsx` alle Inline-Styles entfernt — pure SCSS-Klassen |
| 2026-05-12 | Frontend-Hardening: `login.tsx` `state.from.pathname` Post-Login-Redirect implementiert |
| 2026-05-12 | Frontend-Hardening: `router/index.tsx` Checkout + OrderSuccess unter `<PrivateRoute>` gesichert |
| 2026-05-12 | Frontend-Hardening: `features/checkout/`, `features/tickets/`, `features/contact/`, `features/users/` API-Services angelegt |
| 2026-05-12 | Frontend-Hardening: `App.tsx` in `<ErrorBoundary>` gewrappt |
| 2026-05-12 | SCSS-Ergänzungen: `.form-input--error` (globaler Fehler-Modifier), `.checkout-form__api-error`, `.checkout-empty` in `_checkout.scss` |
| 2026-05-12 | SCSS-Ergänzungen: `.orders-history__error`, `.orders-history__empty`, `.orders-history__empty-text` in `_orders-history.scss` |
| 2026-05-12 | SCSS-Ergänzungen: `.ticket-form__api-error` in `_tickets.scss`; `.contact-form__error` in `_contact.scss` |
| 2026-05-12 | `contact.tsx`: `submitContact()` API statt `setTimeout` — async/await, Error-Handling via `getErrorMessage()` |
| 2026-05-12 | `ticket-new.tsx`: `createTicket()` API statt `setTimeout` — `TicketCategory`/`TicketPriority` Typen, Error-Handling |
| 2026-05-12 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler — Frontend backend-ready |
| 2026-05-12 | SEO-Layer: `SeoMeta.tsx` (React 19 native hoisting — kein Paket nötig) + `JsonLd.tsx` (structured data) als UI-Komponenten angelegt |
| 2026-05-12 | SEO: `SeoMeta` auf allen 20+ Seiten eingebunden — `<title>`, `<meta description>`, Open Graph, Twitter Card, `<link rel=canonical>` |
| 2026-05-12 | SEO: `noIndex` auf privaten Seiten (Kasse, Warenkorb, Account, Auth-Seiten, Bestellerfolgreich) |
| 2026-05-12 | SEO: WebSite-Schema (JSON-LD + SearchAction) auf HomePage; Product-Schema auf ProductDetailPage |
| 2026-05-12 | SEO: `robots.txt` in `/public` — Account/Cart/Checkout/Auth gesperrt, alle AI-Bots (GPTBot/PerplexityBot/ClaudeBot/Google-Extended) erlaubt, CCBot geblockt |
| 2026-05-12 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-13 | `SeoMeta` + `JsonLd` + `Pagination` als UI-Komponenten in `@components/ui` exportiert |
| 2026-05-13 | `routes.ts`: `AUTH.FORGOT_PASSWORD`, `ACCOUNT.ORDER_DETAIL`, `ACCOUNT.orderDetail()`, `ACCOUNT.SETTINGS`, `ACCOUNT.ADDRESSES` ergänzt |
| 2026-05-13 | `public/robots.txt`: AI-Bots (GPTBot/ClaudeBot/PerplexityBot/Google-Extended) explizit erlaubt; CCBot geblockt |
| 2026-05-13 | `index.html`: vollständige Meta-Tags (OG, Twitter Card, theme-color, canonical), Favicon-Links, Preconnect für Google Fonts |
| 2026-05-13 | `public/og-image.svg`: 1200×630 SVG-Placeholder für Open-Graph-Vorschau |
| 2026-05-13 | `dashboard.tsx`: `useOrders()` Hook statt Mock-Daten; echte Stats (Bestellanzahl, Gesamtsumme); Skeleton-Loading; Bestell-Cards als `<Link>` zu Order-Detail; `<Pagination>` eingebunden |
| 2026-05-13 | `orders-history.tsx`: `<Pagination>` Client-Side (PAGE_SIZE=10), Bestell-Cards als `<Link>`, `orders-history__count` |
| 2026-05-13 | `forgot-password.tsx`: E-Mail-Formular, Loading/Sent/Error-States, Sicherheit (kein E-Mail-Enumeration), SCSS `.auth-sent` Block |
| 2026-05-13 | `login.tsx`: "Passwort vergessen?" `<a href="#">` → `<Link to={ROUTES.AUTH.FORGOT_PASSWORD}>` |
| 2026-05-13 | `settings.tsx`: Profil bearbeiten (Vorname/Nachname) + Passwort ändern (POST /auth/change-password), `useAuth` Store-Update |
| 2026-05-13 | `addresses.tsx`: Lieferadresse ansehen + bearbeiten via `getProfile()` + `updateAddress()` |
| 2026-05-13 | `order-detail.tsx`: Bestelldetail-Seite — Status-Timeline (4 Schritte), Artikel-Liste, Bestellsumme, Lieferadresse; 2-Spalten-Layout (main + side) |
| 2026-05-13 | `features/reviews/`: neues Feature — `Review`/`CreateReviewPayload` Types, `reviewService.ts` (GET/POST /products/:id/reviews), `useReviews()` Hook, `index.ts` |
| 2026-05-13 | `product-detail.tsx`: Tabs "Produktdetails" + "Bewertungen" — Bewertungsliste, Durchschnittsbewertung, Review-Formular (Star-Picker, Titel, Text) für eingeloggte User |
| 2026-05-13 | SCSS: `_settings.scss`, `_addresses.scss`, `_order-detail.scss` neu angelegt; Review/Tab-Klassen in `_product-detail.scss` ergänzt |
| 2026-05-13 | SCSS `_grid.scss`: `.page-loader--inline` Modifier + `.form-hint` Klasse ergänzt |
| 2026-05-13 | `router/index.tsx`: `ForgotPasswordPage`, `SettingsPage`, `AddressesPage`, `OrderDetailPage` registriert |
| 2026-05-13 | `AccountLayout.tsx`: Adressen + Einstellungen in der Account-Nav (bereits vorhanden) |
| 2026-05-13 | `PROJECT_COMMANDS.md` vollständig neu strukturiert: alle Dev-Befehle, SCSS, Stripe, Supabase, Vercel, Debug, Git |
| 2026-05-13 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler — alle 18% fertiggestellt |
| 2026-05-13 | Vollständiger SCSS-Farb-Audit: alle hardcodierten `#ef4444`/`#dc2626`/`rgba(239,68,68,...)` und `rgba(var(--clr-primary),...)` durch CSS-Variablen ersetzt — `_grid.scss`, `_auth.scss`, `_contact.scss`, `_product-detail.scss`, `_checkout.scss`, `_addresses.scss`, `_settings.scss`, `_tickets.scss`, `_wishlist.scss`, `_cards.scss`, `_cart.scss`, `_home.scss`, `_buttons.scss`, `_placeholders.scss` (14 Dateien bereinigt) |
| 2026-05-13 | `_root.scss`: semantische CSS-Farb-Variablen für Error/Success/Warning/Info/Star als globale Basis eingeführt |
| 2026-05-13 | TypeScript-Check nach Farb-Audit bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-13 | DSGVO-Frontend: `settings.tsx` um Danger Zone erweitert (Konto löschen mit E-Mail-Bestätigung, DELETE /users/me) |
| 2026-05-13 | DSGVO-Frontend: neue Seite `my-data.tsx` (Art. 15/17/20/21 DSGVO) — Datenkategorie-Übersicht, Rechte-Hub, Speicherfristen-Tabelle, Datenschutz-Kontakt |
| 2026-05-13 | DSGVO-Frontend: `privacy.tsx` um Auftragsverarbeiter-Sektion erweitert (Supabase, Stripe, E-Mail, Hosting mit AVV-Pflicht-Hinweis) |
| 2026-05-13 | LMIV: `LmivInfo` + `NutrientRow` Types in `product.types.ts`; dritter Tab "Inhaltsstoffe & Nährwerte" in `product-detail.tsx` mit Nährwerttabelle, Zutaten, Allergenen, Warnhinweisen, Herstellerangaben |
| 2026-05-13 | `routes.ts`: `ACCOUNT.MY_DATA` ergänzt; `AccountLayout.tsx`: "Meine Daten" in Account-Nav; `router/index.tsx`: Route registriert |
| 2026-05-13 | SCSS: `_settings.scss` um `.danger-zone` + `.delete-confirm` erweitert; `_my-data.scss` neu angelegt; `_product-detail.scss` um LMIV-Styles ergänzt; `_legal.scss` um `.privacy-processor` erweitert |
| 2026-05-13 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler |
| 2026-05-14 | Zentrales Notification-System: `features/notifications/` (Zustand-Store, `notify()`, Auto-Dismiss, 5 Types) — ersetzt CartToast + WishlistToast |
| 2026-05-14 | `Toast.tsx`: Unified Toast-Komponente (card-Typ + wishlist-pill-Typ, Progress-Bar, Mount/Leave-Animation, `--toast-duration` CSS-Var) |
| 2026-05-14 | `_toast.scss`: Neue zentrale Toast-Styles ersetzt alte `_cart-toast.scss` + `_wishlist-toast.scss` |
| 2026-05-14 | `ProductCard.tsx`, `home.tsx`, `search-results.tsx`, `product-detail.tsx`: alle `useNotifications(s => s.notify)` migriert |
| 2026-05-14 | QuickView-Modal (home + search-results): "Alle Details ansehen →" Link als `btn--secondary` ergänzt |
| 2026-05-14 | `config/images.ts`: `productGalleries` Array (4 Bilder × 8 Produkte) + `getProductGallery(id)` Helper |
| 2026-05-14 | `product.types.ts`: `DealerLink`, `ProductDocument` Interfaces + optionale Felder `richDescription`, `highlights`, `certifications`, `dealerLinks`, `documents` auf `Product` |
| 2026-05-14 | `products.data.ts`: Produkte 1–3 vollständig mit `highlights`, `richDescription` (HTML), `certifications`, `lmiv`, `dealerLinks`, `documents` angereichert |
| 2026-05-14 | `features/products/components/ImageGallery.tsx`: Neue Galerie-Komponente mit Thumbnail-Leiste, `key={active}` Fade-Trick |
| 2026-05-14 | `product-detail.tsx`: komplett überarbeitet — `ImageGallery`, Highlights-Checklist, Cert-Badges, `richDescription` HTML-Tab, Händler-Links, Dokumente-Sektion |
| 2026-05-14 | `_product-detail.scss`: alle neuen CSS-Klassen ergänzt (pd-img-fade Keyframe, product-highlights, cert-badge, product-rich-description, pd-section, dealer-link, product-document) |
| 2026-05-14 | TypeScript-Check final bestanden: `npx tsc --noEmit` ohne Fehler; Build + Vercel-Prod-Deploy erfolgt |