import { useEffect, useRef } from 'react';
import { APP_GTM_ID } from '@config/app';
import { useConsent } from '@features/consent';

/**
 * Injiziert Google Tag Manager — nur wenn:
 * 1. APP_GTM_ID gesetzt ist
 * 2. Der Nutzer analytics- oder marketing-Cookies zugestimmt hat (TTDSG § 25)
 */
export function GtmScript() {
  const { decidedAt, analytics, marketing } = useConsent();
  const injected = useRef(false);

  useEffect(() => {
    if (!APP_GTM_ID) return;
    if (!decidedAt) return;
    if (!analytics && !marketing) return;
    if (injected.current) return;

    injected.current = true;

    const script = document.createElement('script');
    script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${APP_GTM_ID}');`;
    document.head.appendChild(script);
  }, [decidedAt, analytics, marketing]);

  return null;
}
