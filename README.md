# Student Support Chat Dashboard

A real-time support chat application that facilitates seamless communication between students, sales agents, and managers. Built with React, TypeScript, Supabase, and Cloudflare Workers.

## 🌟 Features

- **Role-based access control** - Student, Sales, and Manager roles with different permissions
- **Real-time messaging** - Instant message updates using Supabase Realtime
- **Conversation management** - Create, assign, and track support conversations
- **Status tracking** - Open, Pending, and Closed conversation states
- **Dark mode support** - Beautiful UI with light and dark themes
- **Optimistic UI** - Instant feedback for better user experience

## 🚀 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching & caching)
- Tailwind CSS + shadcn/ui (styling)
- Supabase (auth & realtime)

**Backend:**
- Cloudflare Workers + Hono (API)
- Supabase (database & auth)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Cloudflare account (for deployment)

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Big-Zool/-student-support-portal.git
cd student-support-portal
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend Worker:**
```bash
cd worker
npm install
cd ..
```

### 3. Configure Environment Variables

**Frontend - Create `.env` file in the root directory:**

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:8787/api
```

**Backend Worker - Create `worker/.dev.vars` file:**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> **Note:** Get your Supabase credentials from your [Supabase Dashboard](https://app.supabase.com) → Settings → API

### 4. Set Up Supabase Database

Run the SQL migrations in your Supabase SQL Editor to create the required tables and policies. The schema includes:

- `profiles` - User profiles with roles
- `conversation_threads` - Support conversations
- `conversation_messages` - Chat messages
- `conversation_assignment_events` - Assignment history

**Enable Realtime:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable Realtime for:
   - `conversation_threads`
   - `conversation_messages`

### 5. Seed Demo Users

Run the seed script to create demo accounts:

```bash
node scripts/seed-users.mjs
```

Or set the environment variable and run:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node scripts/seed-users.mjs
```

### 6. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Frontend runs on: `http://localhost:5173`

**Terminal 2 - Backend Worker:**
```bash
cd worker
npm run dev
```
Backend runs on: `http://localhost:8787/api`

## 🔑 Demo User Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| Student | Demo Student | `student@demo.com` | `demo1234` |
| Sales | Alex Sales | `sales1@demo.com` | `demo1234` |
| Sales | Aigerim Sales | `sales2@demo.com` | `demo1234` |
| Manager | Demo Manager | `manager@demo.com` | `demo1234` |

## 🌐 Deployed URLs

**Frontend (Vercel):**
```
https://your-app.vercel.app
```

**Backend API (Cloudflare Workers):**
```
https://your-worker.workers.dev/api
```

> **Note:** Update `VITE_API_BASE_URL` in your production `.env` to point to your deployed Worker URL

## 📚 Environment Variables Reference

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGc...` |
| `VITE_API_BASE_URL` | Backend Worker API URL | `http://localhost:8787/api` (dev)<br>`https://api.example.com` (prod) |

### Backend Worker (worker/.dev.vars)

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin) | `eyJhbGc...` |

## 🏗️ Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── auth/              # Authentication context
│   │   └── components/        # React components
│   ├── lib/
│   │   ├── apiClient.ts       # API client
│   │   ├── realtime.ts        # Realtime subscriptions
│   │   └── supabaseClient.ts  # Supabase client
│   └── styles/                # CSS styles
├── worker/
│   └── src/
│       ├── routes/            # API routes
│       ├── middleware/        # Auth middleware
│       └── index.ts           # Worker entry point
├── scripts/
│   └── seed-users.mjs         # Database seeding script
└── MDs/                       # Documentation
```

## 🧪 Testing the API

Import the Postman collection:
```
Student-Support-Chat-API.postman_collection.json
```

See `MDs/POSTMAN_API_TESTING_GUIDE.md` for detailed API documentation.

## 📖 Additional Documentation

- **API Endpoints:** `MDs/API_ENDPOINTS_SUMMARY.md`
- **Postman Guide:** `MDs/POSTMAN_API_TESTING_GUIDE.md`
- **Localhost Fix:** `MDs/LOCALHOST_FIX.md`
- **Current Status:** `MDs/CURRENT_ISSUE_AND_STATUS.md`

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Backend (Cloudflare Workers)

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy the Worker:
   ```bash
   cd worker
   wrangler deploy
   ```

4. Set production secrets:
   ```bash
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Original Figma design: [Student Support Chat Dashboard](https://www.figma.com/design/7dEJPkcwXLb6NAnErIpTF1/Student-Support-Chat-Dashboard)
- Built with [Supabase](https://supabase.com)
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com)

## 📞 Support

For issues or questions, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ by Abdalla Mshawi**