import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getTicketMessages, sendTicketMessage } from '../api/ticketService';
import type { TicketMessage } from '../types/ticket.types';

export function useTicketChat(ticketId: string) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!ticketId) return;

    setLoading(true);
    getTicketMessages(ticketId)
      .then(setMessages)
      .catch(() => setError('Nachrichten konnten nicht geladen werden.'))
      .finally(() => setLoading(false));

    const channel = supabase
      .channel(`ticket_messages:ticket_id=eq.${ticketId}`)
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const send = useCallback(async (text: string): Promise<void> => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      await sendTicketMessage(ticketId, trimmed);
    } catch {
      setError('Nachricht konnte nicht gesendet werden.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [ticketId]);

  return { messages, loading, sending, error, send };
}
