import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import type { AuthVariables } from '../middleware/auth';
import type { Env } from '../index';

export const conversations = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// GET /api/conversations
// Returns threads based on the user's role
conversations.get('/', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');
  const status = c.req.query('status');
  const assignedTo = c.req.query('assignedTo');
  const search = c.req.query('q')?.trim();

  // We start a query on the conversation_threads table, joining with the student and assigned user profiles
  let query = supabase
    .from('conversation_threads')
    .select(`
      id, subject, status, last_message_at, created_at,
      student:student_id (id, full_name),
      assigned:assigned_to (id, full_name)
    `)
    .order('last_message_at', { ascending: false });

  if (status && ['open', 'pending', 'closed'].includes(status)) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.ilike('subject', `%${search}%`);
  }

  // Role-based filtering:
  if (profile.role === 'student') {
    // Students only see their own threads
    query = query.eq('student_id', profile.id);
  } else if (profile.role === 'sales') {
    // Sales users see threads assigned to them OR unassigned threads
    query = query.or(`assigned_to.eq.${profile.id},assigned_to.is.null`);
  }
  // Managers see all threads (no filtering needed)

  if (assignedTo === 'unassigned') {
    query = query.is('assigned_to', null);
  } else if (assignedTo === 'me') {
    query = query.eq('assigned_to', profile.id);
  } else if (assignedTo && assignedTo !== 'all') {
    query = query.eq('assigned_to', assignedTo);
  }

  const { data, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json(data);
});

// POST /api/conversations
// Student only. Creates a new thread and the first message.
conversations.post('/', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');

  if (profile.role !== 'student') {
    return c.json({ error: 'Only students can create conversations' }, 403);
  }

  const body = await c.req.json();
  const { subject, message } = body;

  if (!subject || !message) {
    return c.json({ error: 'Subject and message are required' }, 400);
  }

  // 1. Create the thread
  const { data: thread, error: threadError } = await supabase
    .from('conversation_threads')
    .insert({
      student_id: profile.id,
      subject,
      status: 'open',
    })
    .select()
    .single();

  if (threadError) return c.json({ error: threadError.message }, 500);

  // 2. Create the first message
  const { error: msgError } = await supabase
    .from('conversation_messages')
    .insert({
      thread_id: thread.id,
      sender_id: profile.id,
      sender_type: 'student',
      body: message,
    });

  if (msgError) return c.json({ error: msgError.message }, 500);

  return c.json(thread, 201);
});

// GET /api/conversations/:threadId
// Returns thread details and all messages
conversations.get('/:threadId', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');
  const threadId = c.req.param('threadId');

  // Fetch the thread
  const { data: thread, error: threadError } = await supabase
    .from('conversation_threads')
    .select(`
      id, subject, status, student_id, assigned_to, last_message_at, created_at,
      student:student_id (id, full_name),
      assigned:assigned_to (id, full_name)
    `)
    .eq('id', threadId)
    .single();

  if (threadError || !thread) return c.json({ error: 'Thread not found' }, 404);

  // Role enforcement
  if (profile.role === 'student' && thread.student_id !== profile.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  if (profile.role === 'sales' && thread.assigned_to !== profile.id && thread.assigned_to !== null) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // Fetch all messages
  const { data: messages, error: messagesError } = await supabase
    .from('conversation_messages')
    .select(`
      id, body, created_at, sender_type,
      sender:sender_id (id, full_name, role)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (messagesError) return c.json({ error: messagesError.message }, 500);

  return c.json({ thread, messages });
});

// PATCH /api/conversations/:threadId/status
// Update status
conversations.patch('/:threadId/status', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');
  const threadId = c.req.param('threadId');
  const { status } = await c.req.json();

  if (profile.role === 'student') {
    return c.json({ error: 'Students cannot change status' }, 403);
  }

  if (!['open', 'pending', 'closed'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const { data: thread, error: fetchError } = await supabase
    .from('conversation_threads')
    .select('assigned_to')
    .eq('id', threadId)
    .single();

  if (fetchError || !thread) return c.json({ error: 'Thread not found' }, 404);

  // Sales can only update their own threads
  if (profile.role === 'sales' && thread.assigned_to !== profile.id) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { data, error } = await supabase
    .from('conversation_threads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// PATCH /api/conversations/:threadId/assign
// Assign a conversation
conversations.patch('/:threadId/assign', async (c) => {
  const supabase = getSupabaseAdmin(c.env);
  const profile = c.get('profile');
  const threadId = c.req.param('threadId');
  const { assignedTo } = await c.req.json(); // user_uuid or null

  if (profile.role === 'student') {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { data: thread, error: fetchError } = await supabase
    .from('conversation_threads')
    .select('assigned_to')
    .eq('id', threadId)
    .single();

  if (fetchError || !thread) return c.json({ error: 'Thread not found' }, 404);

  // Sales can only assign an unassigned thread to themselves
  if (profile.role === 'sales') {
    if (thread.assigned_to !== null) {
      return c.json({ error: 'Thread is already assigned' }, 403);
    }
    if (assignedTo !== profile.id) {
      return c.json({ error: 'Sales users can only assign to themselves' }, 403);
    }
  }

  // Start transaction / sequential operations
  // 1. Update the thread
  const { data, error } = await supabase
    .from('conversation_threads')
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq('id', threadId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);

  // 2. IMPORTANT: Write a record to conversation_assignment_events
  const { error: eventError } = await supabase
    .from('conversation_assignment_events')
    .insert({
      thread_id: threadId,
      from_user_id: thread.assigned_to,
      to_user_id: assignedTo,
      changed_by: profile.id,
    });

  if (eventError) {
    console.error('Failed to write assignment event:', eventError);
    // We don't fail the request completely since assignment worked, but log it
  }

  return c.json(data);
});
