# Product Management — Design Spec
**Datum:** 2026-05-14  
**Status:** Approved  
**Scope:** Vollständige Produktverwaltung im Admin-Panel mit Bild-Upload, MwSt. pro Produkt, und rechtskonformer Preisanzeige im Frontend-Shop.

---

## Ziel

Der Käufer des Templates kann alle Produkte komplett über das Admin-Panel verwalten — anlegen, bearbeiten, löschen, Bilder hochladen — ohne SQL, ohne externe Tools. Die Preisanzeige im Shop entspricht deutschen Rechtsvorgaben (PAngV, UWG): Brutto-Preis + MwSt.-Hinweis + Versandkostenhinweis.

---

## Architektur

```
Admin Panel (React)
  ↓ x-admin-key
Backend (Express)
  ├── POST /api/admin/products      → Supabase: INSERT
  ├── PUT  /api/admin/products/:id  → Supabase: UPDATE
  ├── DELETE /api/admin/products/:id → Supabase: DELETE + Storage cleanup
  └── POST /api/admin/upload        → Supabase Storage: Upload → gibt URL zurück

Supabase
  ├── products table (+ image_url, tax_rate)
  └── Storage Bucket: product-images (public-read, upload nur via service_role)

Frontend Shop (React)
  ↓ /api/products (bestehend, public)
  └── Preisanzeige: "39,90 € · inkl. 19% MwSt. · zzgl. Versandkosten"
```

---

## 1. Datenbank

### Migration (Supabase SQL Editor)

```sql
-- Neue Spalten
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate  DECIMAL(5,2) NOT NULL DEFAULT 19.00;

-- Supabase Storage Bucket (manuell im Dashboard: Storage → New Bucket)
-- Name: product-images
-- Public: ja (Produktbilder sind öffentlich)
```

### products-Tabelle nach Migration

| Spalte | Typ | Pflicht | Default |
|---|---|---|---|
| id | UUID | ✓ | uuid_generate_v4() |
| name | TEXT | ✓ | — |
| slug | TEXT | ✓ | — |
| description | TEXT | ✓ | — |
| price | DECIMAL(10,2) | ✓ | — |
| old_price | DECIMAL(10,2) | ✗ | null |
| badge | TEXT | ✗ | null |
| discount | TEXT | ✗ | null |
| category | TEXT | ✓ | — |
| rating | DECIMAL(3,1) | ✓ | 0 |
| reviews | INTEGER | ✓ | 0 |
| stock | INTEGER | ✓ | 0 |
| active | BOOLEAN | ✓ | true |
| **image_url** | TEXT | ✗ | null |
| **tax_rate** | DECIMAL(5,2) | ✓ | 19.00 |
| created_at | TIMESTAMPTZ | ✓ | NOW() |

---

## 2. Backend

### Neue Datei: `Backend/src/routes/admin-products.ts`

Alle Routen erfordern `x-admin-key` Header (bestehende `requireAdminKey` Middleware).

#### POST `/api/admin/products` — Produkt anlegen
- Body: `{ name, slug, description, price, old_price, badge, discount, category, stock, active, image_url, tax_rate }`
- Validierung: name, slug, description, price, category, tax_rate sind Pflicht
- Prüft ob slug bereits existiert → 409 Conflict
- Gibt neues Produkt zurück

#### PUT `/api/admin/products/:id` — Produkt bearbeiten
- Body: alle Felder optional (PATCH-Semantik)
- Prüft ob slug-Konflikt mit anderem Produkt
- Gibt aktualisiertes Produkt zurück

#### GET `/api/admin/products/:id` — Einzelprodukt für Edit-Modus laden
- Gibt alle Felder zurück (inkl. `inactive` Produkte)
- Erfordert `x-admin-key`

#### DELETE `/api/admin/products/:id` — Produkt löschen
- Löscht Produkt aus DB
- Falls `image_url` ein Supabase Storage URL ist: löscht auch die Datei aus dem Bucket
- Gibt `{ success: true }` zurück

#### POST `/api/admin/upload` — Bild hochladen
- Multipart/form-data mit Feld `image`
- Validierung: max 5 MB, nur `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- Dateiname: `{uuid}.{ext}` (kein Original-Dateiname → XSS-safe)
- Upload via `supabase.storage.from('product-images').upload()`
- Gibt `{ url: "https://..." }` zurück

### Middleware: `requireAdminKey`
Bereits vorhanden — prüft `req.headers['x-admin-key'] === process.env.ADMIN_API_KEY`.

### Datei-Upload-Package
`multer` für multipart parsing (bereits üblich im Express-Ökosystem, klein, stabil).

### Bestehende Datei: `Backend/src/index.ts`
Einbinden: `app.use('/api/admin', adminProductsRouter)`

---

## 3. Admin Panel

### `Admin/src/pages/products/index.tsx` (Produktliste)
- Lädt Produkte von `GET /api/products` (bestehend, public) statt MOCK_PRODUCTS
- Delete-Button ruft `DELETE /api/admin/products/:id` auf
- Nach Delete: Produkt aus lokalem State entfernen (optimistic) + Fehler-Fallback
- Zeigt Bild-Thumbnail wenn `imageUrl` vorhanden

### `Admin/src/pages/products/product-form.tsx` (Formular)
- Neue Felder: `imageUrl` (automatisch gesetzt nach Upload), `taxRate` (Dropdown: 0 / 7 / 19)
- Upload-Zone: Klick oder Drag & Drop → POST zu `/api/admin/upload` → URL setzt sich automatisch
- Bild-Vorschau sofort nach Upload
- Bei Edit-Modus: lädt bestehendes Produkt von `GET /api/products/:slug`
- Submit: POST (neu) oder PUT (edit) auf `/api/admin/products`
- Validierung im Frontend: alle Pflichtfelder + Preis > 0

### API-Client in Admin
Neue Datei: `Admin/src/api/adminProducts.ts`
- Alle Fetch-Calls mit `x-admin-key` aus localStorage (`sr-admin-key`)
- Wiederverwendbare `apiFetch()` Helper-Funktion

---

## 4. Frontend Shop

### Typen: `Frontend/src/features/products/types/product.types.ts`
```typescript
export interface Product {
  // bestehende Felder ...
  imageUrl: string | null;  // NEU
  taxRate:  number;          // NEU (z.B. 19)
}
```

### Mapper: `Frontend/src/features/products/api/productService.ts`
```typescript
imageUrl: raw.image_url != null ? String(raw.image_url) : null,
taxRate:  Number(raw.tax_rate ?? 19),
```

### `ProductImage.tsx`
Wenn `imageUrl` vorhanden → echtes Bild anzeigen, kein Picsum-Fallback.
```tsx
// Priorität: imageUrl aus DB > Picsum-Platzhalter
const src = product.imageUrl ?? getProductImage(product.id);
```

### Preis-Anzeige (PAngV-konform)
Auf Produktkarte und Detailseite:
```
39,90 €
inkl. 19% MwSt. · zzgl. Versandkosten
```

- Neues SCSS-Element `.price-meta` unter dem Preis
- Link bei "zzgl. Versandkosten" → `/versand`
- `taxRate` kommt aus dem Produkt-Objekt

### Betroffene Komponenten
- `ProductCard.tsx` — `.price-meta` unter Preis
- `product-detail.tsx` — Preis-Block erweitern

---

## 5. Sicherheit & DSGVO

| Aspekt | Maßnahme |
|---|---|
| Upload-Auth | `x-admin-key` Pflicht auf allen Admin-Routes |
| File-Type | Whitelist: jpeg, png, webp, avif |
| File-Size | Max 5 MB (Multer-Limit) |
| Dateiname | UUID generiert → kein Originalname, XSS-safe |
| Storage-Zugriff | public-read (Produktbilder öffentlich) — kein PII |
| EU-Hosting | Supabase Frankfurt (eu-central-1) |
| DSGVO | Produktbilder = keine personenbezogenen Daten |
| Kundenbilder | Kommen nicht in diesen Bucket |

---

## 6. Offene Punkte (Scope Out)

- Grundpreis (€/100g, €/Stück) — nur bei Mengenware nötig, nicht im Template-Scope
- Multi-Bild-Galerie-Upload — Galerie bleibt über `images.ts` konfiguriert
- Produkt-Kategorien dynamisch (aktuell hardcoded: Wohnen, Deko, Küche, Textilien, Kunst)
- Bestands-Benachrichtigungen / Low-Stock-Alerts

---

## Implementierungsreihenfolge

```
1. DB Migration (SQL manuell im Supabase Dashboard)
2. Supabase Storage Bucket anlegen (Dashboard: Storage → New Bucket)
3. Backend: multer installieren
4. Backend: admin-products.ts (GET by ID + CRUD + Upload-Route)
5. Backend: index.ts einbinden
6. Frontend: Product type + Mapper erweitern
7. Frontend: ProductImage.tsx (imageUrl-Priorität)
8. Frontend: ProductCard + product-detail (MwSt.-Anzeige)
9. Admin: adminProducts.ts API-Client
10. Admin: products/index.tsx (real data + delete)
11. Admin: product-form.tsx (Upload + alle Felder + submit)
12. TypeScript-Check überall
13. Manueller Test: Produkt anlegen → im Shop sichtbar mit Bild + MwSt.
```
