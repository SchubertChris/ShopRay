export interface WishlistStore {
  ids:    number[];
  toggle: (id: number) => void;
  has:    (id: number) => boolean;
  clear:  () => void;
}
