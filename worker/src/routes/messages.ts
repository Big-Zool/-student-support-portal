import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import type { AuthVariables } from '../middleware/auth';
import type { Env } from '../index';

export const messages = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// POST /api/conversations/:threadId/messages
// Send a new message in a thread
messages.post('/:threadId/messages', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');
  const threadId = c.req.param('threadId');
  const { body } = await c.req.json();

  if (!body) {
    return c.json({ error: 'Message body is required' }, 400);
  }

  // Fetch thread to check permissions
  const { data: thread, error: fetchError } = await supabase
    .from('conversation_threads')
    .select('student_id, assigned_to')
    .eq('id', threadId)
    .single();

  if (fetchError || !thread) return c.json({ error: 'Thread not found' }, 404);

  // Role enforcement
  if (profile.role === 'student' && thread.student_id !== profile.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  if (profile.role === 'sales' && thread.assigned_to !== profile.id && thread.assigned_to !== null) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const senderType = profile.role === 'student' ? 'student' : 'team';

  // Start transaction / sequential operations
  // 1. Insert message
  const { data: message, error: msgError } = await supabase
    .from('conversation_messages')
    .insert({
      thread_id: threadId,
      sender_id: profile.id,
      sender_type: senderType,
      body,
    })
    .select()
    .single();

  if (msgError) return c.json({ error: msgError.message }, 500);

  // 2. Update thread's last_message_at
  await supabase
    .from('conversation_threads')
    .update({ 
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', threadId);

  return c.json(message, 201);
});
