import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?:       string;
}

export function errorHandler(
  err:  AppError,
  req:  Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev      = process.env.NODE_ENV === 'development';

  // Log mit Request-Kontext — URL auf maximal 200 Zeichen begrenzen (Log-Injection-Schutz)
  const safeUrl = (req.originalUrl ?? '').slice(0, 200).replace(/[\r\n]/g, '');
  console.error(`[${new Date().toISOString()}] ${req.method} ${safeUrl} → ${statusCode} — ${err.message}`);

  if (statusCode >= 500) {
    // 5xx: Keine internen Details an den Client — weder message noch code
    res.status(statusCode).json({
      error: 'Interner Serverfehler',
      ...(isDev ? { detail: err.message, stack: err.stack } : {}),
    });
  } else {
    // 4xx: message und code sind für den Client bestimmt
    res.status(statusCode).json({
      error: err.message ?? 'Unbekannter Fehler',
      code:  err.code,
    });
  }
}
