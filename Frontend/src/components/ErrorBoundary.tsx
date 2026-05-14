import React from 'react';
import { ROUTES } from '@config/routes';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <span className="label">Technischer Fehler</span>
          <h1 className="error-page__code">500</h1>
          <p className="error-page__subtitle">
            Etwas ist schiefgelaufen. Bitte lade die Seite neu oder geh zur Startseite.
          </p>
          <div className="error-page__actions">
            <button
              className="btn btn--ghost"
              onClick={() => this.setState({ hasError: false })}
            >
              Erneut versuchen
            </button>
            <a href={ROUTES.HOME} className="btn btn--primary">Zur Startseite</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
