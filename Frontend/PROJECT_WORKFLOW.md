<!-- @claude Das wird unser Workflow hier muss nachgearbeitet werden der Workflow muss so optimiert werden das er dsarauf abzielt die Shop App als default als template produkt fertigzustellen wo der user/ käufer alles individualisieren kann
Das bedeutet Admin bereich zum Verwalten der Datenbank des Bestandes uvm. also ein Vollständigiges CRM und so gebaut das man nur noch die jeweiligen provider anbinden muss fertig so das selbst der größte depp das mit einer simplen erklärung anbinden kann am ende deswegen müssen immer alle types korrekt gelistet sein also ÜBERALL die dokumentation
 -->

# 📈 Entwicklungs-Workflow

Schritte zum Aufbau eines neuen Features oder Projekts:

### Phase 1: Daten & Typen (Brain)
1.  **Types:** Interfaces in `src/types/` definieren.
2.  **Routes:** Pfade in `src/config/routes.ts` festlegen.
3.  **Validation:** Zod-Schemata für Formulare/API erstellen.

### Phase 2: Infrastruktur
1.  **API:** Axios-Instanz in `src/api/` konfigurieren.
2.  **Layout:** Header/Footer Grundgerüst in `src/components/layout/`.

### Phase 3: Feature-Bau (Isolated)
1.  **Store:** Lokalen Zustand anlegen.
2.  **Hooks:** Logik extrahieren (z. B. `useCart.ts`).
3.  **UI:** Komponenten bauen und mit Hooks verbinden.
4.  **Export:** Alles Relevante in der `index.ts` des Features freigeben.

### Phase 4: Integration
1.  **API-Sync:** Frontend mit echten Backend-Endpunkten verbinden.
2.  **Errors:** Fehlerzustände und Feedback (Toasts) implementieren.

### Phase 5: Polishing
1.  **Theming:** SCSS-Variablen finalisieren.
2.  **Perf:** Bilder optimieren und Code-Splitting prüfen.
