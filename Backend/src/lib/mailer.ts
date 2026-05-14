import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to:      string;
  subject: string;
  html:    string;
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  await transporter.sendMail({
    from:    `"${process.env.SMTP_FROM_NAME ?? 'Shop'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
}

// ── E-Mail-Templates ─────────────────────────────────────────────────────────

export function orderConfirmationHtml(params: {
  customerName:  string;
  orderNumber:   string;
  total:         string;
  items:         Array<{ name: string; qty: number; price: string }>;
}): string {
  const itemRows = params.items.map(i =>
    `<tr>
       <td style="padding:8px 0;border-bottom:1px solid #eee">${i.name}</td>
       <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">×${i.qty}</td>
       <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">€ ${i.price}</td>
     </tr>`,
  ).join('');

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="font-size:22px;margin-bottom:4px">Bestellbestätigung</h2>
      <p style="color:#555;margin-top:0">Bestellung ${params.orderNumber}</p>

      <p>Hallo ${params.customerName},<br>
      vielen Dank für deine Bestellung! Wir bearbeiten sie so schnell wie möglich.</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0">
        <thead>
          <tr style="border-bottom:2px solid #eee">
            <th style="text-align:left;padding-bottom:8px;font-size:12px;color:#888">ARTIKEL</th>
            <th style="text-align:center;padding-bottom:8px;font-size:12px;color:#888">MENGE</th>
            <th style="text-align:right;padding-bottom:8px;font-size:12px;color:#888">PREIS</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding-top:12px;font-weight:700">Gesamt</td>
            <td style="padding-top:12px;font-weight:700;text-align:right">€ ${params.total}</td>
          </tr>
        </tfoot>
      </table>

      <p style="color:#555;font-size:14px">
        Bei Fragen antworte einfach auf diese E-Mail oder nutze unser Support-Portal.
      </p>
    </div>
  `;
}

export function contactNotificationHtml(params: {
  name:    string;
  email:   string;
  subject: string;
  message: string;
  date:    string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="font-size:20px;margin-bottom:4px">Neue Kontaktanfrage</h2>
      <p style="color:#555;margin-top:0;font-size:14px">${params.date}</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:100px;border-radius:4px 0 0 0">Name</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${params.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">E-Mail</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">
            <a href="mailto:${params.email}" style="color:#0066cc">${params.email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Betreff</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${params.subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;vertical-align:top;border-radius:0 0 0 4px">Nachricht</td>
          <td style="padding:8px 12px;white-space:pre-wrap">${params.message}</td>
        </tr>
      </table>

      <p style="color:#888;font-size:12px;margin-top:24px">
        Diese Nachricht wurde automatisch über das Kontaktformular gesendet.<br>
        Consent: erteilt · Gespeichert in Supabase contact_inquiries.
      </p>
    </div>
  `;
}
