import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?:       string;
}

export function errorHandler(
  err:  AppError,
  _req: Request,
  res:  Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev      = process.env.NODE_ENV === 'development';

  console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);

  res.status(statusCode).json({
    error:   err.message ?? 'Interner Serverfehler',
    code:    err.code,
    ...(isDev ? { stack: err.stack } : {}),
  });
}
