# AI Handoff - Student Support Chat Dashboard

Use this file together with:

- `MDs/student-support-chat-briefing.md`
- `MDs/ABDALLA_AI_SKILL.md`

The briefing explains the project requirements. `ABDALLA_AI_SKILL.md` explains how to work with Abdalla: be a coding partner and teacher, explain the why, and avoid dumping code without context.

## Current Date / Context

Current work is happening around **Step 5 - Realtime**.

The app is a React + TypeScript + Vite frontend with a Cloudflare Worker + Hono backend. Auth and database are Supabase. Data fetching/caching is TanStack Query.

## Current Runtime Setup

Frontend:

```bash
npm run dev
```

The dev script was changed to:

```json
"dev": "vite --port 5173 --strictPort"
```

This was done because Vite was sometimes silently jumping from `5173` to `5174`, which confused testing. Now the frontend should use only:

```txt
http://localhost:5173/
```

Backend Worker:

```txt
http://localhost:8787/api
```

The frontend `.env` currently points to:

```txt
VITE_API_BASE_URL=http://localhost:8787/api
```

## What Was Completed Before Step 5

Step 4 - Frontend Data Layer was completed and committed.

Commit:

```txt
21d4023 Complete frontend data layer wiring
```

Step 4 included:

- Typed API client in `src/lib/apiClient.ts`
- Student inbox wired to real backend data
- Sales inbox wired to real backend data
- Manager queue wired to real backend data
- Conversation view wired to real backend data
- Basic loading, empty, and error states
- Backend `/api/users/team` endpoint for manager reassignment
- Backend conversation list query params for `status`, `assignedTo`, and `q`
- Old mock conversation data removed from `src/app/components/types.ts`

Verification at that time:

```bash
npm run build
worker\node_modules\.bin\tsc.cmd --noEmit -p worker\tsconfig.json
```

Both passed.

## Step 5 Work Done So Far

Step 5 requirement from the briefing:

- Enable Realtime in Supabase dashboard for:
  - `conversation_threads`
  - `conversation_messages`
- Subscribe to `conversation_messages` inside a thread
- Subscribe to `conversation_threads` on inbox pages
- Invalidate TanStack Query cache on realtime events
- Clean up subscriptions on component unmount

Code added/changed:

- Added `src/lib/realtime.ts`
- Updated `src/app/components/StudentInbox.tsx`
- Updated `src/app/components/SalesManagerInbox.tsx`
- Updated `src/app/components/ChatArea.tsx`

`src/lib/realtime.ts` contains two helpers:

- `subscribeToConversationList(onChange)`
  - listens to `conversation_threads`
  - used by inbox pages
- `subscribeToConversationThread(threadId, onChange)`
  - listens to `conversation_messages` filtered by `thread_id`
  - listens to `conversation_threads` filtered by `id`
  - used by the selected chat view

The pattern is intentionally simple:

1. Supabase emits a realtime database event.
2. The app invalidates TanStack Query cache.
3. TanStack Query refetches from the Worker API.

This keeps the Worker API as the source of truth.

## Important Fix During Step 5

After realtime was added, sending a message made the chat feel untouchable for a few seconds. The reason was:

1. User sent a message.
2. UI waited for `sendMessage()`.
3. Query invalidation happened.
4. The chat waited for refetch before showing the new message.

This felt slow, especially if realtime/refetch lagged.

Fix added in `ChatArea.tsx`:

- Optimistic UI for sending messages
- Message appears immediately in TanStack Query cache
- If API fails, cache rolls back to the previous message list
- Textarea is no longer disabled while the send request is pending
- Send button still disables during pending request to avoid double-submit

This makes the local sender experience feel like a real chat app.

## Localhost / Browser Issue We Solved

Problem:

- App sometimes loaded on `5173`
- Sometimes Vite started on `5174`
- Browser tab sometimes showed blank
- Console showed `404 Not Found`

Findings:

- Two frontend dev servers were running at once.
- `5174` was caused by Vite auto-selecting a new port.
- The confirmed 404 was `/favicon.ico`, which was harmless.
- Headless Chrome rendered the app correctly, so React was not broken.
- The in-app browser tab was likely stale after stopping/restarting Vite.

Fixes:

- Changed `package.json` dev script to strict port `5173`
- Restarted the stale Vite process
- Added favicon files:
  - Inline favicon in `index.html`
  - `public/favicon.ico`

Current expected URL:

```txt
http://localhost:5173/
```

If the in-app browser looks blank, hard refresh:

```txt
Ctrl + Shift + R
```

or open a fresh browser tab.

## How To Test Realtime

Do not test student and sales in two normal tabs of the same browser session, because they share Supabase auth session.

Use one of these:

- Normal browser + incognito/private window
- Chrome + Edge
- Two different Chrome profiles

Suggested test:

1. In Chrome normal window, open `http://localhost:5173/`
2. Log in as:

```txt
student@demo.com
demo1234
```

3. In incognito or a different browser, open `http://localhost:5173/`
4. Log in as:

```txt
sales1@demo.com
demo1234
```

5. Student creates or opens a conversation.
6. Sales assigns the conversation if needed.
7. Student sends a message.
8. Sales should see it without refreshing.
9. Sales sends a reply.
10. Student should see it without refreshing.

If messages do not appear live, check Supabase dashboard and ensure Realtime is enabled for:

- `conversation_threads`
- `conversation_messages`

## Current Git Status Notes

As of this handoff, Step 5 changes have not been committed yet.

Expected modified/untracked files include:

- `package.json`
- `index.html`
- `src/app/components/ChatArea.tsx`
- `src/app/components/StudentInbox.tsx`
- `src/app/components/SalesManagerInbox.tsx`
- `src/lib/realtime.ts`
- `public/favicon.ico`

Also note:

- `src/app/components/LoginPage.tsx` was already modified before Step 5 work. Do not assume those changes belong to Step 5 unless Abdalla confirms.
- `worker/.wrangler/tmp/...` folders are generated temporary files and should not be committed.

## Verification Already Run

Frontend build:

```bash
npm run build
```

This passed after Step 5 changes.

Worker type check was run earlier and passed:

```bash
worker\node_modules\.bin\tsc.cmd --noEmit -p worker\tsconfig.json
```

No backend code was changed during Step 5 after that.

## Recommended Next Actions

1. Manually test realtime with two separate browser sessions.
2. Confirm Supabase Realtime is enabled for both required tables.
3. If realtime works, commit Step 5 changes separately.
4. Do not include `worker/.wrangler/tmp/...` in the commit.
5. Decide separately whether `LoginPage.tsx` should be committed, since it predates this Step 5 work.

Suggested Step 5 commit message:

```txt
Add realtime conversation updates
```

## Mental Model For The Next AI

Step 4 made the app talk to real backend data.

Step 5 makes the app react when the database changes.

Optimistic UI makes the sender see their own message immediately.

Supabase Realtime makes the other logged-in user see updates without refreshing.
