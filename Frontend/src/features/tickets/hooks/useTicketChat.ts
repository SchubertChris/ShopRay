import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getTicketMessages, sendTicketMessage } from '../api/ticketService';
import type { TicketMessage } from '../types/ticket.types';

export function useTicketChat(ticketId: string) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    setLoading(true);
    getTicketMessages(ticketId)
      .then(setMessages)
      .catch(() => setError('Nachrichten konnten nicht geladen werden.'))
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`ticket_messages:${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const validSenders = new Set(['customer', 'admin']);
          const msg: TicketMessage = {
            id:        String(raw.id ?? ''),
            ticketId:  String(raw.ticket_id ?? ''),
            sender:    validSenders.has(String(raw.sender)) ? (raw.sender as 'customer' | 'admin') : 'customer',
            text:      String(raw.text ?? ''),
            createdAt: String(raw.created_at ?? ''),
          };
          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const send = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendTicketMessage(ticketId, trimmed);
      // Realtime fügt die Nachricht automatisch zum State hinzu
    } catch {
      setError('Nachricht konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  }, [ticketId, sending]);

  return { messages, loading, sending, error, send };
}
