import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { users } from './routes/users';
import { conversations } from './routes/conversations';
import { messages } from './routes/messages';

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Allow frontend to communicate with this API
app.use('/api/*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://student-support-chat-5sm.pages.dev',
    ];
    // Allow production + preview deployments (*.student-support-chat-5sm.pages.dev)
    if (
      !origin ||
      allowed.includes(origin) ||
      origin.endsWith('.student-support-chat-5sm.pages.dev')
    ) {
      return origin;
    }
    return null;
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Apply auth middleware to all /api routes
app.use('/api/*', authMiddleware);

// Register routes
app.route('/api/me', users);
app.route('/api/users', users);
app.route('/api/conversations', conversations);
app.route('/api/conversations', messages); // messages are nested under /conversations/:threadId/messages

export default app;