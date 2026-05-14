/** Payload an POST /contact */
export interface ContactFormPayload {
  name:    string;
  email:   string;
  subject: string;
  message: string;
}

/** Backend-Antwort nach Kontaktformular-Absenden */
export interface ContactFormResponse {
  success: boolean;
  message: string;
}
