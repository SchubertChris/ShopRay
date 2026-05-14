/** Generischer Wrapper für alle erfolgreichen API-Antworten */
export interface ApiResponse<T> {
  data:    T;
  message: string;
  success: boolean;
}

/** Wrapper für paginated Listen-Antworten */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total:      number;
    page:       number;
    limit:      number;
    totalPages: number;
  };
  message: string;
  success: boolean;
}

/** Fehler-Antwort vom Backend */
export interface ApiError {
  message:    string;
  statusCode: number;
  /** Feldbezogene Validierungsfehler */
  errors?: Record<string, string[]>;
}
