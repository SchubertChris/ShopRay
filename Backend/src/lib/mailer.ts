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

interface MailWithAttachmentOptions extends MailOptions {
  filename: string;
  content:  Buffer;
}

export async function sendMailWithAttachment({ to, subject, html, filename, content }: MailWithAttachmentOptions): Promise<void> {
  await transporter.sendMail({
    from:        `"${process.env.SMTP_FROM_NAME ?? 'Shop'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
    attachments: [{ filename, content, contentType: 'application/pdf' }],
  });
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
       <td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(i.name)}</td>
       <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">×${i.qty}</td>
       <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">€ ${i.price}</td>
     </tr>`,
  ).join('');

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="font-size:22px;margin-bottom:4px">Bestellbestätigung</h2>
      <p style="color:#555;margin-top:0">Bestellung ${params.orderNumber}</p>

      <p>Hallo ${escapeHtml(params.customerName)},<br>
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

export function adminLoginAlertHtml(params: {
  ip:        string;
  userAgent: string;
  date:      string;
  adminUrl:  string;
}): string {
  const ua = escapeHtml(params.userAgent || 'Unbekannt');
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888">ShopRay Admin</p>
        <h2 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em">Neuer Admin-Login</h2>
      </div>
      <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:28px">
        <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6">
          Jemand hat sich erfolgreich im Admin-Bereich deines Shops eingeloggt.
          Falls das nicht du warst, ändere sofort dein Admin-Passwort.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;width:110px;border-bottom:1px solid #eee;border-radius:6px 0 0 0">Zeitpunkt</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222">${params.date}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;border-bottom:1px solid #eee">IP-Adresse</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:monospace;color:#222">${escapeHtml(params.ip)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;vertical-align:top;border-radius:0 0 0 6px">Browser</td>
            <td style="padding:10px 12px;color:#555;font-size:13px;word-break:break-all">${ua}</td>
          </tr>
        </table>

        <a href="${params.adminUrl}/settings" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">
          Login-Protokoll anzeigen →
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#aaa;line-height:1.6">
          Diese E-Mail wurde automatisch gesendet.<br>
          Wenn du dich selbst eingeloggt hast, ist alles in Ordnung.
        </p>
      </div>
    </div>
  `;
}

export function accountBannedHtml(params: {
  customerName: string;
  reason:       string;
  permanent:    boolean;
  until?:       string; // formatiertes Datum, nur bei temporärer Sperre
  shopName:     string;
  contactEmail: string;
}): string {
  const durationRow = params.permanent
    ? `<tr>
         <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;border-bottom:1px solid #eee">Dauer</td>
         <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#b91c1c;font-weight:700">Dauerhaft</td>
       </tr>`
    : `<tr>
         <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;border-bottom:1px solid #eee">Gesperrt bis</td>
         <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#92400e;font-weight:700">${escapeHtml(params.until ?? '—')}</td>
       </tr>`;

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#b91c1c;border-radius:12px 12px 0 0;padding:24px 28px">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fecaca">${params.shopName}</p>
        <h2 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em">Konto gesperrt</h2>
      </div>
      <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:28px">
        <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6">
          Hallo ${escapeHtml(params.customerName)},<br><br>
          dein Konto wurde von unserem Team gesperrt. Du kannst dich während der Sperre
          nicht einloggen und hast keinen Zugriff auf deine Bestellungen oder andere Funktionen.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;width:110px;border-bottom:1px solid #eee;border-radius:6px 0 0 0">Grund</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;color:#222">${escapeHtml(params.reason)}</td>
          </tr>
          ${durationRow}
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;border-radius:0 0 0 6px">Kontakt</td>
            <td style="padding:10px 12px">
              <a href="mailto:${params.contactEmail}" style="color:#0066cc">${params.contactEmail}</a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6">
          Wenn du glaubst, dass diese Sperrung ein Fehler ist, antworte auf diese E-Mail
          oder wende dich direkt an unseren Support.
        </p>

        <a href="mailto:${params.contactEmail}"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">
          Support kontaktieren →
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#aaa;line-height:1.6">
          Diese E-Mail wurde automatisch gesendet.<br>
          ${params.shopName} — Kundenservice
        </p>
      </div>
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
  const name    = escapeHtml(params.name);
  const email   = escapeHtml(params.email);
  const subject = escapeHtml(params.subject);
  const message = escapeHtml(params.message);

  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h2 style="font-size:20px;margin-bottom:4px">Neue Kontaktanfrage</h2>
      <p style="color:#555;margin-top:0;font-size:14px">${params.date}</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:100px;border-radius:4px 0 0 0">Name</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${name}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">E-Mail</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">
            <a href="mailto:${email}" style="color:#0066cc">${email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Betreff</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f5f5f5;font-weight:600;vertical-align:top;border-radius:0 0 0 4px">Nachricht</td>
          <td style="padding:8px 12px;white-space:pre-wrap">${message}</td>
        </tr>
      </table>

      <p style="color:#888;font-size:12px;margin-top:24px">
        Diese Nachricht wurde automatisch über das Kontaktformular gesendet.<br>
        Consent: erteilt · Gespeichert in Supabase contact_inquiries.
      </p>
    </div>
  `;
}

export function modInviteHtml(params: {
  shopName:     string;
  adminUrl:     string;
  tempPassword: string;
  email:        string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
      <div style="background:#111;border-radius:12px 12px 0 0;padding:24px 28px">
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#888">${params.shopName}</p>
        <h2 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.03em">Du wurdest eingeladen</h2>
      </div>
      <div style="border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;padding:28px">
        <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.6">
          Du wurdest als Mitarbeiter im Admin-Bereich von <strong>${params.shopName}</strong> eingerichtet.
          Melde dich mit deinen Zugangsdaten an und ändere das Passwort beim ersten Login.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px">
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;width:130px;border-bottom:1px solid #eee;border-radius:6px 0 0 0">E-Mail</td>
            <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:monospace;color:#222">${escapeHtml(params.email)}</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;background:#f8f8f8;font-weight:600;border-radius:0 0 0 6px">Startpasswort</td>
            <td style="padding:10px 12px;font-family:monospace;font-size:16px;font-weight:700;color:#111;letter-spacing:0.05em">${params.tempPassword}</td>
          </tr>
        </table>

        <p style="margin:0 0 20px;font-size:13px;color:#e53e3e;font-weight:600">
          Bitte ändere dein Passwort sofort nach dem ersten Login — das Startpasswort ist temporär.
        </p>

        <a href="${params.adminUrl}/login"
           style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;font-weight:700">
          Zum Admin-Login →
        </a>

        <p style="margin:24px 0 0;font-size:12px;color:#aaa;line-height:1.6">
          Diese E-Mail wurde automatisch gesendet. Bewahre sie sicher auf.
        </p>
      </div>
    </div>
  `;
}
