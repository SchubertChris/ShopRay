import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoMeta } from '@components/ui';
import { useAuth } from '@features/auth';
import { ROUTES } from '@config/routes';
import { getErrorMessage } from '@/utils/errorMessage';
import { supabase } from '@/lib/supabase';
import api from '@/api/axiosinstance';
import { APP_CONTACT } from '@config/app';

const DATA_CATEGORIES = [
  {
    label: 'Kontodaten',
    desc:  'Vorname, Nachname, E-Mail-Adresse, verschlüsseltes Passwort',
    basis: 'Art. 6 Abs. 1 lit. b DSGVO',
  },
  {
    label: 'Lieferadresse',
    desc:  'Straße, Hausnummer, PLZ, Ort, Land — nur wenn von dir hinterlegt',
    basis: 'Art. 6 Abs. 1 lit. b DSGVO',
  },
  {
    label: 'Bestellhistorie',
    desc:  'Bestellnummern, Artikel, Preise, Zeitstempel, Zahlungsstatus, Lieferstatus',
    basis: 'Art. 6 Abs. 1 lit. c DSGVO + § 257 HGB',
  },
  {
    label: 'Support-Tickets',
    desc:  'Ticketinhalt, Kategorie, Kommunikationsverlauf',
    basis: 'Art. 6 Abs. 1 lit. b DSGVO',
  },
  {
    label: 'Technische Daten',
    desc:  'Session-Token (localStorage), Cookie-Einwilligungen (TTDSG § 25)',
    basis: 'Art. 6 Abs. 1 lit. b DSGVO',
  },
  {
    label: 'Wunschliste',
    desc:  'Gespeicherte Produkt-IDs — lokal im Browser, nicht auf unseren Servern',
    basis: 'Nur lokal, kein Upload',
  },
];

interface RightItem {
  art:    string;
  title:  string;
  desc:   string;
  action: string;
  type:   'auskunft' | 'export' | 'link';
}

const RIGHTS: RightItem[] = [
  {
    art:    'Art. 15',
    title:  'Auskunftsrecht',
    desc:   'Du hast das Recht zu erfahren, welche Daten wir über dich verarbeiten, zu welchem Zweck und wie lange sie gespeichert werden.',
    action: 'Vollständige Auskunft anfordern',
    type:   'auskunft',
  },
  {
    art:    'Art. 20',
    title:  'Datenportabilität',
    desc:   'Du kannst deine Daten in einem strukturierten, maschinenlesbaren Format (JSON) erhalten und zu einem anderen Anbieter mitnehmen.',
    action: 'Daten exportieren',
    type:   'export',
  },
  {
    art:    'Art. 17',
    title:  'Recht auf Löschung',
    desc:   'Du hast das Recht, dein Konto und alle personenbezogenen Daten löschen zu lassen ("Recht auf Vergessenwerden").',
    action: 'Zu Konto löschen →',
    type:   'link',
  },
  {
    art:    'Art. 21',
    title:  'Widerspruchsrecht',
    desc:   'Du hast das Recht, der Verarbeitung deiner Daten zu widersprechen — insbesondere bei direkter Werbung oder Profiling.',
    action: 'Widerspruch einlegen',
    type:   'auskunft',
  },
];

export default function MyDataPage() {
  const { user } = useAuth();
  const [sent,    setSent]    = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function handleAction(type: 'auskunft' | 'export') {
    setLoading(type);
    setError(null);
    try {
      if (type === 'export') {
        // Alle Daten des Users direkt aus Supabase laden und als JSON downloaden
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Nicht eingeloggt');

        const [profileRes, ordersRes, reviewsRes, ticketsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', authUser.id).single(),
          supabase.from('orders').select('*, order_items(*)').eq('user_id', authUser.id),
          supabase.from('reviews').select('*').eq('user_id', authUser.id),
          supabase.from('tickets').select('*').eq('user_id', authUser.id),
        ]);

        const exportData = {
          exportedAt:  new Date().toISOString(),
          gdprVersion: 'Art. 20 DSGVO',
          account: {
            id:    authUser.id,
            email: authUser.email,
            createdAt: authUser.created_at,
          },
          profile:  profileRes.data,
          orders:   ordersRes.data  ?? [],
          reviews:  reviewsRes.data ?? [],
          tickets:  ticketsRes.data ?? [],
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `meine-daten-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else {
        // Auskunftsanfrage per Kontaktformular an den Datenschutzbeauftragten
        await api.post('/contact', {
          name:    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          email:   user?.email ?? '',
          subject: 'DSGVO Art. 15 Auskunftsanfrage',
          message: `Hiermit beantrage ich gemäß Art. 15 DSGVO vollständige Auskunft über alle zu meiner Person gespeicherten personenbezogenen Daten.\n\nKonto-ID: ${user?.id}\nE-Mail: ${user?.email}`,
          consent: true,
        });
      }

      setSent(prev => ({ ...prev, [type]: true }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <SeoMeta title="Meine Daten" noIndex />
      <div className="my-data">

        <div className="my-data__header">
          <h1 className="my-data__title">Meine Daten</h1>
          <p className="my-data__sub">
            Transparenz über deine gespeicherten Daten und deine Rechte nach DSGVO
          </p>
        </div>

        {/* ── Was wir speichern ── */}
        <section className="my-data-section">
          <div className="my-data-section__head">
            <div className="my-data-section__title">Was wir über dich speichern</div>
            <div className="my-data-section__note">
              Alle Daten werden ausschließlich in der EU verarbeitet und nach Ablauf der gesetzlichen
              Aufbewahrungsfristen gelöscht.
            </div>
          </div>

          <div className="my-data-grid">
            {DATA_CATEGORIES.map(c => (
              <div key={c.label} className="data-category-card">
                <div className="data-category-card__body">
                  <div className="data-category-card__label">{c.label}</div>
                  <div className="data-category-card__desc">{c.desc}</div>
                </div>
                <div className="data-category-card__basis">{c.basis}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DSGVO-Rechte ── */}
        <section className="my-data-section">
          <div className="my-data-section__head">
            <div className="my-data-section__title">Deine DSGVO-Rechte</div>
            <div className="my-data-section__note">
              Anfragen werden innerhalb von 30 Tagen bearbeitet (Art. 12 DSGVO).
              Wir antworten an: <strong>{user?.email}</strong>
            </div>
          </div>

          {error && <p className="my-data__error">{error}</p>}

          <div className="rights-grid">
            {RIGHTS.map(r => (
              <div key={r.art} className="rights-card">
                <div className="rights-card__art">{r.art}</div>
                <div className="rights-card__title">{r.title}</div>
                <p className="rights-card__desc">{r.desc}</p>

                {r.type === 'link' ? (
                  <Link to={ROUTES.ACCOUNT.SETTINGS} className="btn btn--ghost btn--sm">
                    {r.action}
                  </Link>
                ) : sent[r.type] ? (
                  <span className="rights-card__sent">
                    {r.type === 'export' ? 'Download gestartet' : 'Anfrage gesendet — wir melden uns per E-Mail'}
                  </span>
                ) : (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={!!loading}
                    onClick={() => handleAction(r.type as 'auskunft' | 'export')}
                  >
                    {loading === r.type ? 'Wird verarbeitet…' : r.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Aufbewahrungsfristen ── */}
        <section className="my-data-section">
          <div className="my-data-section__head">
            <div className="my-data-section__title">Speicherfristen</div>
          </div>
          <div className="retention-table-wrap"><div className="retention-table">
            <div className="retention-table__row retention-table__row--head">
              <span>Datenkategorie</span>
              <span>Frist</span>
              <span>Rechtsgrundlage</span>
            </div>
            <div className="retention-table__row">
              <span>Kontodaten</span>
              <span>Bis zur Kontolöschung</span>
              <span>Art. 6 Abs. 1 lit. b DSGVO</span>
            </div>
            <div className="retention-table__row">
              <span>Rechnungen / Bestellungen</span>
              <span>10 Jahre</span>
              <span>§ 257 HGB, § 147 AO</span>
            </div>
            <div className="retention-table__row">
              <span>Support-Tickets</span>
              <span>3 Jahre</span>
              <span>§ 195 BGB (Verjährung)</span>
            </div>
            <div className="retention-table__row">
              <span>Cookie-Einwilligungen</span>
              <span>3 Jahre</span>
              <span>§ 25 TTDSG</span>
            </div>
          </div></div>
        </section>

        {/* ── Kontakt ── */}
        <div className="my-data-contact">
          <div className="my-data-contact__left">
            <div className="my-data-contact__label">Datenschutz-Kontakt</div>
            <a href={`mailto:${APP_CONTACT.email}`} className="my-data-contact__email">
              {APP_CONTACT.email}
            </a>
          </div>
          <div className="my-data-contact__right">
            <div className="my-data-contact__label">Zuständige Aufsichtsbehörde</div>
            <a
              href="https://www.bfdi.bund.de"
              target="_blank"
              rel="noopener noreferrer"
              className="my-data-contact__link"
            >
              Bundesbeauftragter für den Datenschutz (BfDI)
            </a>
          </div>
        </div>

      </div>
    </>
  );
}
