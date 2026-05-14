/** Einzelne Produktbewertung */
export interface Review {
  id:        string;
  userId:    string;
  userName:  string;
  rating:    1 | 2 | 3 | 4 | 5;
  title:     string;
  body:      string;
  createdAt: string;
}

/** Payload für eine neue Bewertung */
export interface CreateReviewPayload {
  rating: number;
  title:  string;
  body:   string;
}
