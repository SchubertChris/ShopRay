<!-- @claude Hier soll der Tech Stack ausführlich definiert werden und die Env verbindungen erklärt werden für den Käufer dieses Produkts damit er weiß was er dort hat und ein anderer Entwickler nachvolziehen kann was das hier ist und wie es >Funktioniert -->


# 🛠️ Der Shop Tech-Stack & Kosten-Guide

Dieser Stack ist darauf ausgelegt, professionell zu starten und bei Erfolg preiswert skaliert zu werden.

---

## 💻 Der Software-Stack (Die Werkzeuge)


| Bereich | Technologie | Website | Kosten | Warum dieser Dienst? |
| :--- | :--- | :--- | :--- | :--- |
| **Framework** | React (Vite) | [vitejs.dev](https://vitejs.dev) | $0 | Standard für schnelle Web-Apps. |
| **Sprache** | TypeScript | [typescript.org](https://typescriptlang.org) | $0 | Verhindert Fehler beim Coden. |
| **State** | Zustand | [pmnd.rs](https://pmnd.rs) | $0 | Einfachster Store für Warenkörbe. |
| **Data-Fetching**| TanStack Query| [tanstack.com](https://tanstack.com) | $0 | Spart 50% des Codes für Server-Daten. |
| **Styling** | SCSS (7-1) | [sass-lang.com](https://sass-lang.com) | $0 | Beste Ordnung für große Shops. |
| **Validierung** | Zod | [zod.dev](https://zod.dev) | $0 | Sicherheit für Formulare & APIs. |

---

## ☁️ Die Hosting-Wahrheit (Cloud vs. Self-Host)

Es gibt zwei Wege, deine App online zu bringen:

### Weg A: Der bequeme Start (Cloud / SaaS)
*Ideal für den Anfang, wird aber bei viel Traffic teuer.*

*   **Frontend (Vercel):** Kostenlos bis ca. 100GB Bandbreite, danach **$20/Monat**.
*   **Backend (Railway):** Kostenlos für kleine Tests, danach **ab $5/Monat** (Pay-as-you-go).
*   **Datenbank (Supabase):** Kostenlos bis 500MB, danach **$25/Monat** (Pro Plan).
*   **Vorteil:** Alles mit 1 Klick online.
*   **Nachteil:** Hohe monatliche Fixkosten bei Erfolg.

### Weg B: Der dauerhaft günstige Weg (Self-Hosting)
*Empfohlen für produktive Shops mit fester Kalkulation.*

*   **Server (Hetzner / DigitalOcean):** Ein eigener VPS für ca. **€ 4,50 / Monat**.
*   **Verwaltung (Coolify):** Kostenlose Open-Source Software (Alternative zu Vercel).
*   **Vorteil:** Du zahlst nur den Server. Du kannst dort 10 Shops gleichzeitig hosten für denselben Preis.
*   **Nachteil:** Du musst dich selbst um Backups kümmern.

---

## 📈 Schritt-für-Schritt Anleitung zum Setup

1.  **Struktur aufbauen:** Erstelle alle Ordner laut `STRUCTURE.md`.
2.  **Dependencies installieren:**
    ```bash
    npm install zustand @tanstack/react-query zod axios
    npm install -D sass @types/node
    ```
3.  **Aliase konfigurieren:** `tsconfig.json` und `vite.config.ts` anpassen (siehe Doku).
4.  **Backend-Verbindung:** Axios-Instanz in `src/api/` anlegen.
5.  **Deployment-Vorbereitung:** Erstelle ein `Dockerfile`, um jederzeit von Vercel auf einen günstigen 5€-Server umziehen zu können.

---

## ⚖️ Langfristige Kosten-Liste (Prognose)


| Phase | Besucher / Monat | Lösung | Geschätzte Kosten |
| :--- | :--- | :--- | :--- |
| **Entwicklung** | 1 (Du) | Lokal / Free Tiers | **0 €** |
| **Launch** | bis 1.000 | Vercel + Supabase Free | **0 €** |
| **Wachstum** | 10.000+ | Cloud-Anbieter Upgrades | **~ $50+ / Monat** |
| **Profi-Weg** | Unbegrenzt | Eigener VPS + Coolify | **~ 5 € / Monat** |

---

## 💡 Goldene Regeln für Skalierbarkeit
1.  **Docker nutzen:** Verpacke deine App immer in einen Container.
2.  **Statische Daten:** Bilder in `src/assets/images` optimieren (WebP-Format nutzen!).
3.  **Keine Angst vor TypeScript:** Interfaces in `@types` sind deine Versicherung gegen teure Bugs.
