import { Hono } from 'hono';
import type { AuthVariables, UserProfile } from '../middleware/auth';

// The Hono instance for user routes. We use AuthVariables to get typing for c.get('profile')
export const users = new Hono<{ Variables: AuthVariables }>();

users.get('/', (c) => {
  // authMiddleware guarantees that c.get('profile') is defined and typed correctly
  const profile = c.get('profile');

  // We return the user's profile which contains id, full_name, and role
  return c.json(profile);
});
