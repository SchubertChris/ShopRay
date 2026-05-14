export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'wishlist';

export interface NotificationAction {
  label: string;
  href:  string;
}

export interface NotificationItem {
  id:       string;
  type:     NotificationType;
  title:    string;
  message?: string;
  action?:  NotificationAction;
  duration: number;
}

export type NotifyOptions = Omit<NotificationItem, 'id' | 'duration'> & {
  duration?: number;
};

export interface NotificationStore {
  items:   NotificationItem[];
  notify:  (opts: NotifyOptions) => void;
  dismiss: (id: string) => void;
}
