import { AxiosError } from 'axios';

/** Wandelt beliebige Fehler in eine lesbare deutsche Fehlermeldung um */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const msg    = error.response?.data?.message as string | undefined;

    switch (status) {
      case 400: return msg || 'Ungültige Eingabe — bitte Felder prüfen';
      case 401: return 'Bitte melde dich an';
      case 403: return 'Du hast keine Berechtigung für diese Aktion';
      case 404: return 'Diese Ressource wurde nicht gefunden';
      case 409: return msg || 'Konflikt — bitte Seite neu laden';
      case 422: return msg || 'Validierungsfehler — bitte Eingaben prüfen';
      case 429: return 'Zu viele Anfragen — bitte warte einen Moment';
      case 500:
      case 502:
      case 503: return 'Serverfehler — bitte versuche es später erneut';
    }

    if (!error.response) return 'Netzwerkfehler — bitte prüfe deine Internetverbindung';
  }

  if (error instanceof Error) return error.message;
  return 'Ein unbekannter Fehler ist aufgetreten';
}
