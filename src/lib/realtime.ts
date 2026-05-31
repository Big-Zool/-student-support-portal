import { supabase } from './supabaseClient';

type RealtimeHandler = () => void;

export function subscribeToConversationList(onChange: RealtimeHandler) {
  const channel = supabase
    .channel('conversation-list')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_threads',
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToConversationThread(threadId: string, onChange: RealtimeHandler) {
  const channel = supabase
    .channel(`conversation-thread-${threadId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      onChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_threads',
        filter: `id=eq.${threadId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
