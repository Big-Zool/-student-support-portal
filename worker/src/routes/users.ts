import { Hono } from 'hono';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import type { Env } from '../index';
import type { AuthVariables, UserProfile } from '../middleware/auth';

// The Hono instance for user routes. We use AuthVariables to get typing for c.get('profile')
export const users = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

users.get('/', (c) => {
  // authMiddleware guarantees that c.get('profile') is defined and typed correctly
  const profile = c.get('profile');

  // We return the user's profile which contains id, full_name, and role
  return c.json(profile);
});

users.get('/team', async (c) => {
  const profile = c.get('profile');

  if (profile.role !== 'manager') {
    return c.json({ error: 'Only managers can list team members' }, 403);
  }

  const supabase = getSupabaseAdmin(c.env);

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['sales'])
    .order('full_name', { ascending: true });

  if (error) return c.json({ error: error.message }, 500);

  return c.json(data satisfies UserProfile[]);
});
