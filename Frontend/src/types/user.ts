/** Rolle eines Benutzers im System */
export type UserRole = 'customer' | 'admin';

/** Liefer- und Rechnungsadresse */
export interface Address {
  firstName: string;
  lastName:  string;
  street:    string;
  zip:       string;
  city:      string;
  country:   string;
}

/** Eingeloggter Benutzer (kommt vom Backend nach Login/Me) */
export interface User {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      UserRole;
  createdAt: string;
}

/** Erweitertes Profil — für /account/profile Endpunkt */
export interface UserProfile extends User {
  address:    Address | null;
  phone:      string | null;
  avatarUrl:  string | null;
  orderCount: number;
  totalSpent: number;
}
