export type DeliveryStatus =
  | 'processing'
  | 'dispatched'
  | 'in-transit'
  | 'delivered'
  | 'failed';

/** Versandoption (für Checkout-Auswahl) */
export interface DeliveryOption {
  id:            string;
  label:         string;
  description:   string;
  price:         number;
  estimatedDays: number;
}

/** Live-Tracking einer Sendung */
export interface DeliveryTracking {
  orderId:           string;
  status:            DeliveryStatus;
  carrier:           string;
  trackingUrl:       string;
  estimatedDelivery: string;
  events: Array<{
    date:        string;
    description: string;
    location:    string;
  }>;
}
