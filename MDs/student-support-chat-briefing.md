# Student Support Chat App — Full Project Briefing

> This document is a complete briefing for building the Student Support Chat App as part of the `sinc-dev` internship test of competence. It covers the project overview, requirements, stack, database schema, API routes, architecture, UI screens, what is already done, and what needs to be built.

---

## 1. Project Overview

Build a full-stack support chat web app where:
- **Students** sign up, start conversations, and receive replies from a support team.
- **Sales users** see incoming unassigned conversations, claim them, and reply.
- **Managers** oversee all conversations and can reassign them between sales users.

### Submission Requirements
- Fork or create a public GitHub repo with readable commits.
- Deploy frontend and backend to **Cloudflare**.
- Submit via [Google Form](https://forms.gle/DngbHjuZyfX4b3kr9).
- Include a short video demo (max 100 MB).
- Book a review meeting after submission.

### Deadline
**June 1st, 2026**

---

## 2. The 3 User Roles

### Student
- Can sign up and log in.
- Can create one or more chat threads (with a subject and first message).
- Can send messages in their own threads.
- Can see replies from the support team.
- Can see thread status (`open`, `pending`, `closed`).
- Cannot see other students' conversations.

### Sales User
- Can log in (no self-signup — pre-seeded in the database).
- Can see all **unassigned** conversations.
- Can assign an unassigned conversation to themselves.
- Can reply to conversations assigned to them.
- Can mark a conversation as `pending` or `closed`.
- Cannot see conversations assigned to other sales users (only unassigned + their own).

### Manager
- Can see **all** conversations regardless of assignment.
- Can reassign a conversation from one sales user to another.
- Can reopen a closed conversation (set status back to `open`).

---

## 3. Conversation Lifecycle

```
Student creates conversation
        ↓
   status: open, assigned_to: null
        ↓
Sales user self-assigns
        ↓
   status: open, assigned_to: <sales_user_id>
        ↓
They reply back and forth
        ↓
Sales marks as pending or closed
        ↓
Manager can reassign or reopen anytime
```

### Conversation Statuses
- `open` — active, being worked on
- `pending` — waiting on student response
- `closed` — resolved

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend bundler | Vite |
| Frontend framework | React + TypeScript |
| Routing | React Router |
| Data fetching / caching | TanStack Query |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| Backend runtime | Cloudflare Workers |
| Backend framework | Hono |
| Auth | Supabase Auth |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime |
| Deployment | Cloudflare (Pages + Workers) |

---

## 5. Database Schema

Use **Supabase Postgres**. Run the following SQL exactly as written.

### Enums

```sql
create type app_role as enum ('student', 'sales', 'manager');
create type conversation_status as enum ('open', 'pending', 'closed');
create type message_sender_type as enum ('student', 'team');
```

### Tables

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role app_role not null,
  created_at timestamptz not null default now()
);

create table conversation_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  assigned_to uuid references profiles(id),
  subject text not null,
  status conversation_status not null default 'open',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  sender_type message_sender_type not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table conversation_assignment_events (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references conversation_threads(id) on delete cascade,
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  changed_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
```

### Indexes

```sql
create index conversation_threads_student_id_idx on conversation_threads(student_id);
create index conversation_threads_assigned_to_idx on conversation_threads(assigned_to);
create index conversation_threads_status_idx on conversation_threads(status);
create index conversation_threads_last_message_at_idx on conversation_threads(last_message_at desc);
create index conversation_messages_thread_id_created_at_idx on conversation_messages(thread_id, created_at);
```

### Access Rules (enforce in backend, not just frontend)
- Student can read only their own threads and messages.
- Sales can read unassigned threads and threads assigned to them.
- Manager can read all threads.
- Only manager can reassign a thread from one sales user to another.

### Seed Data (required)
Pre-create these users so reviewers can log in immediately:

| Role | Email | Password |
|---|---|---|
| Student | student@demo.com | demo1234 |
| Sales 1 | sales1@demo.com | demo1234 |
| Sales 2 | sales2@demo.com | demo1234 |
| Manager | manager@demo.com | demo1234 |

> Insert matching rows in the `profiles` table after creating these users in Supabase Auth.

---

## 6. API Routes

**Base URL:** `/api`

All protected routes require:
```
Authorization: Bearer <supabase_access_token>
```

### Auth / Profile

```
GET /me
```
Returns the current user's profile (id, full_name, role).

---

### Conversations

```
GET /conversations
```
Query params: `status`, `assignedTo`, `q` (search)

Role behavior:
- **Student** → returns only their own conversations
- **Sales** → returns unassigned + assigned-to-self conversations
- **Manager** → returns all conversations

---

```
POST /conversations
```
Student only. Creates a new thread with a first message.

Body:
```json
{
  "subject": "Question about admission",
  "message": "I need help choosing a university."
}
```

---

```
GET /conversations/:threadId
```
Returns thread details and all messages. Enforces role-based access.

---

```
PATCH /conversations/:threadId/status
```
Body:
```json
{
  "status": "pending"
}
```
Sales can set `pending` or `closed`. Manager can also set `open` (reopen).

---

```
PATCH /conversations/:threadId/assign
```
Body:
```json
{
  "assignedTo": "user_uuid"
}
```
- Sales can only assign an **unassigned** thread **to themselves**.
- Manager can assign or reassign to **any** sales user.
- Always write a record to `conversation_assignment_events`.

---

### Messages

```
POST /conversations/:threadId/messages
```
Body:
```json
{
  "body": "Thanks, we will help you with that."
}
```
Any authenticated user with access to the thread can send a message.
Set `sender_type` based on the sender's role: `student` or `team`.

---

## 7. Realtime Subscriptions

Use **Supabase Realtime**.

Enable Realtime on these tables in the Supabase dashboard:
- `conversation_threads`
- `conversation_messages`

### Inside a conversation thread
```
conversation_messages:thread_id=eq.<threadId>    ← listen for new messages
conversation_threads:id=eq.<threadId>            ← listen for status/assignment changes
```

### On inbox pages
```
conversation_threads                             ← subscribe broadly, then invalidate TanStack Query cache
```

### Important
- Clean up subscriptions when the component unmounts (prevent memory leaks).
- Use TanStack Query's `invalidateQueries` to refetch lists when realtime events fire.

---

## 8. Frontend Architecture

### Folder Structure

```
src/
  app/
    router.tsx          ← React Router setup with role-based redirects
    queryClient.ts      ← TanStack Query client config
  components/
    layout/             ← Navbar, Sidebar, page shells
    ui/                 ← shadcn/ui re-exports
  features/
    auth/               ← Login, Signup, auth context/hook
    conversations/      ← Conversation list, thread view, message input
    dashboard/          ← Role-aware dashboard landing
  lib/
    apiClient.ts        ← All fetch calls to the Worker API
    supabaseClient.ts   ← Supabase JS client (auth + realtime)
    realtime.ts         ← Realtime subscription helpers
  pages/
    LoginPage.tsx
    StudentInboxPage.tsx
    SalesInboxPage.tsx
    ConversationPage.tsx
    ManagerQueuePage.tsx
```

### Routing Rules
- Unauthenticated → redirect to `/login`
- Student → redirect to `/student`
- Sales → redirect to `/sales`
- Manager → redirect to `/manager`

### shadcn/ui Components Used
`Button`, `Card`, `Input`, `Textarea`, `Badge`, `Tabs`, `Table`, `Dialog`, `Select`, `ScrollArea`, `Avatar`, `DropdownMenu`, `Sheet`

---

## 9. Backend Architecture

### Folder Structure

```
worker/
  src/
    index.ts                        ← Hono app entry, register routes
    middleware/
      auth.ts                       ← Verify Supabase JWT, load profile
    routes/
      conversations.ts              ← All /conversations routes
      messages.ts                   ← POST /conversations/:id/messages
      users.ts                      ← GET /me
    services/
      conversationsService.ts       ← Business logic for conversations
      messagesService.ts            ← Business logic for messages
    lib/
      supabaseAdmin.ts              ← Supabase admin client (service role key)
```

### Auth Middleware
Every protected route must:
1. Extract the Bearer token from the `Authorization` header.
2. Verify it with Supabase (`supabase.auth.getUser(token)`).
3. Load the user's `profiles` row to get their role.
4. Attach `user` and `profile` to the request context.
5. Return `401` if token is missing or invalid.

### Role Enforcement (backend only — do not rely on frontend)
- Check `profile.role` in every route handler before executing logic.
- Return `403` if the user's role doesn't have permission.

---

## 10. UI Screens

### Login Page
- Email + password fields
- Login button + Sign up button
- On login: redirect based on role (student → `/student`, sales → `/sales`, manager → `/manager`)

### Student Inbox
- Split layout: conversation list (left) + selected conversation (right)
- Tabs: Open / Pending / Closed
- "New Conversation" button → opens dialog
- New Conversation Dialog: Subject field + Message textarea + Cancel/Create buttons
- Conversation view: scrollable message history + reply input + Send button

### Sales Inbox
- Split layout: queue (left) + selected conversation (right)
- Tabs/filters: Unassigned / Mine
- Status filter dropdown + search bar
- Selected conversation shows:
  - "Assign to me" button (if unassigned)
  - Status change controls
  - Reply input + Send button

### Manager Queue
- Same as Sales Inbox but shows all conversations
- "Reassign" button on each conversation → opens Reassign Dialog
- Reassign Dialog: shows current owner, dropdown of sales users, Cancel/Reassign buttons
- Can also reopen closed conversations

---

## 11. What Is Already Done

- ✅ UI/UX design completed in Figma Make

---

## 12. What Needs to Be Built

### Step 1 — Supabase Setup
- [ ] Create Supabase project
- [ ] Run SQL for all 4 tables + enums + indexes
- [ ] Enable Realtime on `conversation_threads` and `conversation_messages`
- [ ] Create seed users (1 student, 2 sales, 1 manager) via Supabase Auth + insert into `profiles`
- [ ] Copy Supabase URL, anon key, and service role key for env vars

### Step 2 — Auth (Frontend)
- [ ] Install and configure Supabase JS client
- [ ] Build Login page (wire to Supabase Auth)
- [ ] Build Signup page (students only)
- [ ] Create auth context/hook (`useAuth`) to expose user + profile
- [ ] Protect routes — redirect unauthenticated users to `/login`
- [ ] Redirect after login based on role

### Step 3 — Backend (Cloudflare Worker + Hono)
- [ ] Initialize Cloudflare Worker project with Hono
- [ ] Set up environment variables (Supabase URL + service role key)
- [ ] Build auth middleware (verify JWT, load profile)
- [ ] Implement all 7 API routes with role enforcement
- [ ] Test routes with a REST client (e.g. Hoppscotch or Postman)

### Step 4 — Frontend Data Layer
- [ ] Set up TanStack Query client
- [ ] Write `apiClient.ts` with all fetch functions
- [ ] Wire Student Inbox to real data
- [ ] Wire Sales Inbox to real data
- [ ] Wire Manager Queue to real data
- [ ] Wire Conversation view to real data
- [ ] Add loading states, empty states, and error states

### Step 5 — Realtime
- [ ] Enable Realtime subscriptions in Supabase dashboard
- [ ] Subscribe to `conversation_messages` when inside a thread
- [ ] Subscribe to `conversation_threads` on inbox pages
- [ ] Invalidate TanStack Query cache on realtime events
- [ ] Clean up subscriptions on component unmount

### Step 6 — Deployment
- [ ] Deploy Worker to Cloudflare Workers
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Set all environment variables in Cloudflare dashboard
- [ ] Verify deployed app works end-to-end

### Step 7 — README + Submission
- [ ] Write README with: setup instructions, env vars list, demo user credentials, deployed frontend URL, deployed Worker/API URL
- [ ] Record short video demo (max 100 MB) showing the full core demo flow
- [ ] Submit via Google Form

---

## 13. Core Demo Flow (Must Work)

1. Student signs up or logs in → lands on Student Inbox
2. Student clicks "New Conversation" → fills subject + message → submits
3. Sales user logs in → sees the new unassigned conversation in their queue
4. Sales user clicks "Assign to me"
5. Sales user types a reply and sends it
6. Student sees the reply appear **in realtime** (without refreshing)
7. Manager logs in → sees all conversations → reassigns the conversation to the other sales user
8. Conversation is marked `closed`

---

## 14. Evaluation Scoring

| Area | Points |
|---|---:|
| Auth and roles | 15 |
| Conversation CRUD | 20 |
| Assignment / reassignment | 15 |
| Realtime messages | 20 |
| UI quality | 15 |
| Code organization | 10 |
| README / setup | 5 |
| **Total** | **100** |

### Minimum to Pass
- App runs from README instructions
- Auth works
- Student can create a conversation
- Student and sales can exchange messages
- Realtime works
- Sales can self-assign, manager can reassign
- Status changes work
- UI uses shadcn/ui
- Deployed to Cloudflare with URLs in README

### Strong Submission Extras
- Role permissions enforced **on the backend** (not just hidden in UI)
- TypeScript types are clean (no `any`)
- Loading, empty, and error states everywhere
- Realtime subscriptions cleaned up on unmount
- TanStack Query used properly
- Readable commit history

---

## 15. Environment Variables

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev/api
```

### Backend (Cloudflare Worker secrets)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 16. Out of Scope

Do **not** build any of the following:
- File uploads
- Email notifications
- Payments
- AI chatbot
- Mobile native app
- Multi-company / multi-tenant support
- Advanced analytics

---

*This document covers the complete project. Build in the order listed in Section 12. The core demo flow in Section 13 is the primary thing the reviewer will test.*
