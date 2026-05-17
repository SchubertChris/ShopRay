import PDFDocument from 'pdfkit';

export interface InvoiceParams {
  invoiceNumber: string;
  orderNumber:   string;
  invoiceDate:   string; // ISO string
  deliveryDate:  string; // ISO string
  paidAt:        string | null;
  paymentMethod: string | null;
  items: Array<{
    name:     string;
    quantity: number;
    price:    number; // Bruttopreis pro Stück
  }>;
  total:    number; // Brutto gesamt inkl. Versand
  shipping: number; // Versandkosten
  address: {
    firstName?: string;
    lastName?:  string;
    street?:    string;
    zip?:       string;
    city?:      string;
    country?:   string;
  } | null;
  shop: {
    name:       string;
    street:     string;
    zip:        string;
    city:       string;
    country:    string;
    email:      string;
    phone?:     string;
    vatId?:     string;
    taxNumber?: string;
  };
}

const TAX_RATE = 0.19; // 19% Standard-MwSt

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function generateInvoicePdf(p: InvoiceParams): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Rechnung ${p.invoiceNumber}` } });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const L  = 56;  // left margin
    const R  = 539; // right edge
    const W  = R - L;
    let   y  = 48;

    // ── Farben ────────────────────────────────────────────────────────────────
    const BLACK   = '#111111';
    const MUTED   = '#666666';
    const LINE    = '#E5E5E5';
    const ACCENT  = '#1a1a1a';

    // ── Kopfzeile: Shopname links, "RECHNUNG" + Nummer rechts ─────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor(ACCENT)
       .text(p.shop.name, L, y);

    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
       .text(`${p.shop.street}`, L, y + 22)
       .text(`${p.shop.zip} ${p.shop.city}`, L, y + 34)
       .text(p.shop.country, L, y + 46);

    doc.font('Helvetica-Bold').fontSize(22).fillColor(BLACK)
       .text('RECHNUNG', R - 160, y, { width: 160, align: 'right' });

    doc.font('Helvetica-Mono').fontSize(10).fillColor(MUTED)
       .text(p.invoiceNumber, R - 160, y + 28, { width: 160, align: 'right' });

    // ── Trennlinie ──────────────────────────────────────────────────────────
    y += 76;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.75).stroke();
    y += 16;

    // ── Rechnungsdetails (Datum, Lieferung, Bestellung) ─────────────────────
    const cols: Array<[string, string]> = [
      ['Rechnungsdatum',    fmtDate(p.invoiceDate)],
      ['Lieferdatum',       fmtDate(p.deliveryDate)],
      ['Bestellnummer',     p.orderNumber],
    ];
    if (p.paidAt) cols.push(['Bezahlt am', fmtDate(p.paidAt)]);

    cols.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(label, L,       y);
      doc.font('Helvetica').fontSize(9).fillColor(BLACK).text(value, L + 110, y);
      y += 14;
    });

    y += 10;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.5).stroke();
    y += 18;

    // ── Rechnungsempfänger ──────────────────────────────────────────────────
    const addr  = p.address;
    const name  = [addr?.firstName, addr?.lastName].filter(Boolean).join(' ') || 'Kundenname';

    doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text('Rechnungsempfänger', L, y);
    y += 16;

    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(name, L, y); y += 14;
    if (addr?.street) { doc.text(addr.street, L, y); y += 14; }
    if (addr?.zip || addr?.city) { doc.text(`${addr?.zip ?? ''} ${addr?.city ?? ''}`.trim(), L, y); y += 14; }
    if (addr?.country) { doc.text(addr.country, L, y); y += 14; }

    y += 18;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.75).stroke();
    y += 20;

    // ── Artikel-Tabelle Header ──────────────────────────────────────────────
    const colPos = { desc: L, qty: L + 270, unit: L + 340, net: L + 410, gross: R - 40 };

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED);
    ['BEZEICHNUNG', 'MENGE', 'EINZEL (NETTO)', 'NETTO', 'BRUTTO'].forEach((h, i) => {
      const pos = [colPos.desc, colPos.qty, colPos.unit, colPos.net, colPos.gross][i];
      const align = i === 0 ? 'left' : 'right';
      doc.text(h, pos, y, { width: i === 0 ? 200 : 60, align });
    });

    y += 14;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.5).stroke();
    y += 10;

    // ── Artikel ─────────────────────────────────────────────────────────────
    let subtotalGross = 0;
    p.items.forEach(item => {
      const grossTotal = item.price * item.quantity;
      const netUnit    = item.price / (1 + TAX_RATE);
      const netTotal   = netUnit * item.quantity;
      subtotalGross   += grossTotal;

      doc.font('Helvetica').fontSize(9.5).fillColor(BLACK);
      doc.text(item.name, colPos.desc, y, { width: 255 });
      doc.text(String(item.quantity),         colPos.qty,   y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(netUnit)}`,           colPos.unit,  y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(netTotal)}`,          colPos.net,   y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(grossTotal)}`,        colPos.gross, y, { width: 40, align: 'right' });
      y += 18;
    });

    // Versandkosten
    if (p.shipping > 0) {
      const shippingNet = p.shipping / (1 + TAX_RATE);
      subtotalGross    += p.shipping;

      doc.font('Helvetica').fontSize(9.5).fillColor(MUTED);
      doc.text('Versandkosten',          colPos.desc, y, { width: 255 });
      doc.text('1',                      colPos.qty,   y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(shippingNet)}`,  colPos.unit,  y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(shippingNet)}`,  colPos.net,   y, { width: 60, align: 'right' });
      doc.text(`€ ${fmt(p.shipping)}`,   colPos.gross, y, { width: 40, align: 'right' });
      y += 18;
    }

    // subtotalGross wird berechnet, aber nicht weiter verwendet (Gesamtbetrag kommt aus p.total)
    void subtotalGross;

    y += 4;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.75).stroke();
    y += 16;

    // ── Zusammenfassung ──────────────────────────────────────────────────────
    const grossTotal = p.total;
    const netTotal   = grossTotal / (1 + TAX_RATE);
    const taxAmount  = grossTotal - netTotal;

    const sumRows: Array<[string, string, boolean]> = [
      ['Nettobetrag',       `€ ${fmt(netTotal)}`,  false],
      ['MwSt 19 %',         `€ ${fmt(taxAmount)}`, false],
      ['Rechnungsbetrag',   `€ ${fmt(grossTotal)}`, true],
    ];

    sumRows.forEach(([label, value, bold]) => {
      const font = bold ? 'Helvetica-Bold' : 'Helvetica';
      const size = bold ? 11 : 9.5;
      doc.font(font).fontSize(size).fillColor(bold ? BLACK : MUTED)
         .text(label, R - 200, y, { width: 140, align: 'right' })
         .text(value, R - 50,  y, { width: 50,  align: 'right' });
      y += bold ? 20 : 16;
    });

    y += 16;
    doc.moveTo(L, y).lineTo(R, y).strokeColor(LINE).lineWidth(0.5).stroke();
    y += 16;

    // ── Fußzeile: USt-ID / Steuernummer ────────────────────────────────────
    const footerParts: string[] = [];
    if (p.shop.vatId)     footerParts.push(`USt-IdNr.: ${p.shop.vatId}`);
    if (p.shop.taxNumber) footerParts.push(`Steuernummer: ${p.shop.taxNumber}`);
    if (p.shop.email)     footerParts.push(`E-Mail: ${p.shop.email}`);
    if (p.shop.phone)     footerParts.push(`Tel.: ${p.shop.phone}`);

    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
       .text(footerParts.join('  |  '), L, y, { width: W, align: 'center' });

    y += 14;
    doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
       .text(
         `${p.shop.name}  ·  ${p.shop.street}  ·  ${p.shop.zip} ${p.shop.city}  ·  ${p.shop.country}`,
         L, y, { width: W, align: 'center' },
       );

    doc.end();
  });
}
