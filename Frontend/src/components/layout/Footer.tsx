import { Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';
import { APP_NAME, APP_TAGLINE, APP_SOCIALS } from '@config/app';
import { useConsent } from '@features/consent';
import { IconX, IconInstagram, IconFacebook, IconYouTube, IconTikTok } from '@components/ui';

type FooterLink =
  | { label: string; to: string; action?: never }
  | { label: string; action: 'consent'; to?: never };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Alle Produkte', to: ROUTES.SHOP.SEARCH },
      { label: 'Kollektionen', to: ROUTES.SHOP.CATEGORIES },
      { label: 'Neuheiten',    to: ROUTES.SHOP.SEARCH + '?sort=newest' },
      { label: 'Sale',         to: ROUTES.SHOP.SEARCH + '?filter=sale' },
    ],
  },
  {
    title: 'Info',
    links: [
      { label: 'Über uns',           to: ROUTES.INFO.ABOUT    },
      { label: 'FAQ',                to: ROUTES.INFO.FAQ      },
      { label: 'Versand & Rückgabe', to: ROUTES.INFO.SHIPPING },
      { label: 'Kontakt',            to: ROUTES.INFO.CONTACT  },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Impressum',        to: ROUTES.INFO.IMPRESSUM },
      { label: 'Datenschutz',      to: ROUTES.INFO.PRIVACY   },
      { label: 'AGB',              to: ROUTES.INFO.TERMS     },
      { label: 'Widerrufsbelehrung', to: ROUTES.INFO.WIDERRUF },
      { label: 'Cookies',          action: 'consent'         },
    ],
  },
];

const SOCIALS = [
  { Icon: IconInstagram, label: 'Instagram', href: APP_SOCIALS.instagram },
  { Icon: IconX,         label: 'X',         href: APP_SOCIALS.x         },
  { Icon: IconFacebook,  label: 'Facebook',  href: APP_SOCIALS.facebook  },
  { Icon: IconYouTube,   label: 'YouTube',   href: APP_SOCIALS.youtube   },
  { Icon: IconTikTok,    label: 'TikTok',    href: APP_SOCIALS.tiktok    },
];

export function Footer() {
  const openConsent = useConsent(s => s.open);

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div>
            <div className="footer__brand-logo">{APP_NAME}<span>.</span></div>
            <p className="footer__brand-desc">{APP_TAGLINE}</p>
            <div className="footer__socials">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a key={label} href={href} className="footer__social-link" aria-label={label} target="_blank" rel="noopener noreferrer">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map(col => (
            <div key={col.title}>
              <div className="footer__col-title">{col.title}</div>
              <ul className="footer__links">
                {col.links.map(l => (
                  <li key={l.label}>
                    {l.action === 'consent' ? (
                      <button className="footer__link footer__legal-btn" onClick={openConsent}>
                        {l.label}
                      </button>
                    ) : (
                      <Link to={l.to} className="footer__link">{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <span className="footer__copyright">© 2026 {APP_NAME}. Alle Rechte vorbehalten.</span>
          <div className="footer__legal">
            <Link to={ROUTES.INFO.IMPRESSUM} className="footer__legal-link">Impressum</Link>
            <Link to={ROUTES.INFO.PRIVACY}   className="footer__legal-link">Datenschutz</Link>
            <Link to={ROUTES.INFO.TERMS}     className="footer__legal-link">AGB</Link>
            <Link to={ROUTES.INFO.WIDERRUF}  className="footer__legal-link">Widerruf</Link>
            <button className="footer__legal-link footer__legal-btn" onClick={openConsent}>
              Cookie-Einstellungen
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
