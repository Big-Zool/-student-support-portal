import { Context, Next } from 'hono';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import type { Env } from '../index';

export type UserProfile = {
  id: string;
  full_name: string;
  role: 'student' | 'sales' | 'manager';
};

export type AuthVariables = {
  user: { id: string; email?: string };
  profile: UserProfile;
};

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin(c.env);

  // Verify token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  // Load profile to get the role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return c.json({ error: 'Profile not found' }, 403);
  }

  // Attach user and profile to context
  c.set('user', user);
  c.set('profile', profile as UserProfile);

  await next();
};
