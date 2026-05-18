import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

interface SitemapEntry { loc: string; changefreq: string; priority: string; lastmod?: string; }

const STATIC_URLS: SitemapEntry[] = [
  { loc: '/',           changefreq: 'weekly',  priority: '1.0' },
  { loc: '/shop',       changefreq: 'daily',   priority: '0.9' },
  { loc: '/kategorien', changefreq: 'weekly',  priority: '0.8' },
  { loc: '/ueber-uns',  changefreq: 'monthly', priority: '0.7' },
  { loc: '/faq',        changefreq: 'monthly', priority: '0.7' },
  { loc: '/kontakt',    changefreq: 'monthly', priority: '0.6' },
  { loc: '/versand',    changefreq: 'monthly', priority: '0.5' },
  { loc: '/impressum',  changefreq: 'yearly',  priority: '0.3' },
  { loc: '/datenschutz',changefreq: 'yearly',  priority: '0.3' },
  { loc: '/agb',        changefreq: 'yearly',  priority: '0.3' },
  { loc: '/widerruf',   changefreq: 'yearly',  priority: '0.3' },
];

// GET /sitemap.xml — dynamisch generiert, alle aktiven Produkte enthalten
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const base = process.env.FRONTEND_URL ?? 'https://deine-domain.de';

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)
    .order('updated_at', { ascending: false });

  const productEntries = (products ?? []).map(p => ({
    loc:        `/produkt/${p.slug}`,
    lastmod:    (p.updated_at as string | null)?.split('T')[0],
    changefreq: 'weekly',
    priority:   '0.8',
  }));

  const allUrls = [...STATIC_URLS, ...productEntries];

  const urlTags = allUrls.map(u => [
    '  <url>',
    `    <loc>${base}${u.loc}</loc>`,
    u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
    `    <changefreq>${u.changefreq}</changefreq>`,
    `    <priority>${u.priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n')).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlTags}\n</urlset>`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

export default router;
