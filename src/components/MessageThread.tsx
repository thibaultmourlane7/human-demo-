import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import type { HumanMessage } from '../domain/request';
import { supabase } from '../lib/supabase';
import { humanApi } from '../services/humanApi';

interface Props {
  session: Session;
  requestId: string;
  canSend: boolean;
  defaultOpen?: boolean;
}

const senderLabel: Record<HumanMessage['sender_kind'], string> = {
  user: 'Utilisateur',
  expert: 'Expert',
  admin: 'HUMAN',
};

export function MessageThread({ session, requestId, canSend, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<HumanMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await humanApi.getMessages(session, requestId);
    setMessages(data);
  }, [session, requestId]);

  useEffect(() => {
    if (!open) return;

    let disposed = false;
    setError(null);
    load().catch((err) => {
      if (!disposed) setError(err instanceof Error ? err.message : 'Impossible de charger les messages');
    });

    void supabase.realtime.setAuth(session.access_token);
    const nextChannel = supabase
      .channel(`request:${requestId}`, { config: { private: true } })
      .on('broadcast', { event: 'message_created' }, () => {
        void load().catch(() => undefined);
      })
      .subscribe((status) => {
        if (!disposed && status === 'CHANNEL_ERROR') {
          setError('Connexion temps réel indisponible. Le fil reste accessible.');
        }
      });

    setChannel(nextChannel);

    return () => {
      disposed = true;
      setChannel(null);
      void supabase.removeChannel(nextChannel);
    };
  }, [open, requestId, session.access_token, load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy || !canSend) return;

    setBusy(true);
    setError(null);
    try {
      await humanApi.sendMessage(session, requestId, message);
      setDraft('');
      await load();

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'message_created',
          payload: { requestId },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’envoyer le message');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return <button className="chat-toggle" type="button" onClick={() => setOpen(true)}>
      Discussion privée
    </button>;
  }

  return <section className="chat-panel">
    <div className="chat-heading">
      <div><strong>Discussion privée</strong><small>Utilisateur ↔ expert sélectionné</small></div>
      {!defaultOpen && <button className="text-button" type="button" onClick={() => setOpen(false)}>Fermer</button>}
    </div>

    <div className="message-list" aria-live="polite">
      {!messages.length && <p className="muted">Aucun message pour le moment.</p>}
      {messages.map((item) => <article className={`message-bubble ${item.is_mine ? 'mine' : ''}`} key={item.id}>
        <small>{item.is_mine ? 'Vous' : senderLabel[item.sender_kind]}</small>
        <p>{item.message}</p>
        <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</time>
      </article>)}
    </div>

    {error && <div className="chat-error">{error}</div>}

    {canSend ? <form className="chat-form" onSubmit={submit}>
      <textarea
        rows={3}
        maxLength={4000}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Posez une question ou demandez une précision…"
      />
      <div className="chat-form-footer">
        <small>{draft.length}/4000</small>
        <button className="primary-button" disabled={busy || !draft.trim()} type="submit">
          {busy ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
    </form> : <div className="notice">La discussion est en lecture seule pour ce statut de mission.</div>}
  </section>;
}
