export interface WishlistStore {
  ids:    string[];
  toggle: (id: string) => void;
  has:    (id: string) => boolean;
  clear:  () => void;
}
