import { useMemo } from 'react';
import type { Review } from '../types/review.types';

// Demo-Bewertungen — werden durch echte API-Daten ersetzt sobald das Backend angebunden ist
const DEMO_REVIEWS: Review[] = [
  { id: '1', userId: 'u1', userName: 'Anna M.',   rating: 5, title: 'Absolut begeistert!',      body: 'Traumhafte Qualität — sieht noch besser aus als auf den Fotos. Sehr schnelle Lieferung.',       createdAt: '2026-04-12' },
  { id: '2', userId: 'u2', userName: 'Lars K.',   rating: 5, title: 'Perfekte Verarbeitung',    body: 'Plastikfreie Verpackung, faire Qualität. Übertrifft alle Erwartungen. Gerne wieder.',           createdAt: '2026-03-28' },
  { id: '3', userId: 'u3', userName: 'Sophie B.', rating: 4, title: 'Sehr schönes Design',      body: 'Tolles Design, genau wie auf den Bildern. Versand war einen Tag länger als angegeben.',          createdAt: '2026-03-15' },
  { id: '4', userId: 'u4', userName: 'Marco R.',  rating: 5, title: 'Nichts auszusetzen',       body: 'Hochwertig, nachhaltig, schnell geliefert. Habe bereits das zweite Mal bestellt.',              createdAt: '2026-02-20' },
];

/** Bewertungen für ein Produkt — Demo-Daten bis Backend angebunden ist */
export function useReviews(_productId: number) {
  const data = useMemo(() => DEMO_REVIEWS, []);
  return { data, loading: false, error: null, refetch: () => {} };
}
