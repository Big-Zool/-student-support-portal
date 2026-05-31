# 📮 Postman API Testing Guide

Complete guide to testing all backend API endpoints using Postman.

---

## 🔑 Step 1: Get Your Authentication Token

Before testing any endpoint, you need a valid JWT token from Supabase.

### Method 1: Get Token from Browser (Easiest)

1. **Start your frontend:**
   ```bash
   npm run dev
   ```

2. **Login via the UI:**
   - Go to `http://localhost:5173/`
   - Login with any demo account:
     - Student: `student@demo.com` / `demo1234`
     - Sales: `sales1@demo.com` / `demo1234`
     - Manager: `manager@demo.com` / `demo1234`

3. **Extract the token:**
   - Press `F12` to open DevTools
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Navigate to **Local Storage** → `http://localhost:5173`
   - Find the key: `sb-vdzwjlaugsryljrjnpta-auth-token`
   - Click on it and copy the **`access_token`** value (it's a long string starting with `eyJ...`)

4. **Save the token:**
   - Copy this token - you'll use it in every Postman request
   - Token expires after 1 hour, so you'll need to get a new one if it expires

### Method 2: Get Token via Postman (Advanced)

You can also login directly via Supabase API:

```
POST https://vdzwjlaugsryljrjnpta.supabase.co/auth/v1/token?grant_type=password

Headers:
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkendqbGF1Z3NyeWxqcmpucHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzA5NDgsImV4cCI6MjA5NTYwNjk0OH0.LUlGjdzoztgSsSdpf9pPsK8v7NHvpUGq8s-jeEcPt4s
  Content-Type: application/json

Body (raw JSON):
{
  "email": "student@demo.com",
  "password": "demo1234"
}

Response will contain:
{
  "access_token": "eyJ...",  ← Copy this!
  "token_type": "bearer",
  "expires_in": 3600,
  ...
}
```

---

## 🚀 Step 2: Setup Postman Environment

Create a Postman environment to store your token and base URL:

1. Click **Environments** in Postman
2. Click **Create Environment**
3. Name it: `Student Support Chat - Local`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:8787/api` | `http://localhost:8787/api` |
| `token` | (paste your token here) | (paste your token here) |

5. Click **Save**
6. Select this environment from the dropdown in the top-right

---

## 📋 All API Endpoints

### Base URL
```
http://localhost:8787/api
```

### Authentication Header (Required for ALL endpoints)
```
Authorization: Bearer {{token}}
```

---

## 1️⃣ User Endpoints

### 1.1 Get Current User Profile

**Get your own profile (works for any role)**

```
GET {{base_url}}/me
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "id": "uuid-here",
  "full_name": "John Doe",
  "role": "student"
}
```

---

### 1.2 Get Team Members

**Get list of sales agents (Manager only)**

```
GET {{base_url}}/users/team
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid-1",
    "full_name": "Sales Agent 1",
    "role": "sales"
  },
  {
    "id": "uuid-2",
    "full_name": "Sales Agent 2",
    "role": "sales"
  }
]
```

**Error (403 Forbidden):**
```json
{
  "error": "Only managers can list team members"
}
```

---

## 2️⃣ Conversation Endpoints

### 2.1 List Conversations

**Get all conversations (filtered by role)**

```
GET {{base_url}}/conversations
```

**Query Parameters (all optional):**
- `status` - Filter by status: `open`, `pending`, `closed`
- `assignedTo` - Filter by assignment: `unassigned`, `me`, or user UUID
- `q` - Search by subject (case-insensitive)

**Examples:**
```
GET {{base_url}}/conversations
GET {{base_url}}/conversations?status=open
GET {{base_url}}/conversations?assignedTo=unassigned
GET {{base_url}}/conversations?assignedTo=me
GET {{base_url}}/conversations?q=payment
GET {{base_url}}/conversations?status=open&assignedTo=unassigned
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
[
  {
    "id": "thread-uuid",
    "subject": "Need help with enrollment",
    "status": "open",
    "last_message_at": "2026-05-31T10:30:00Z",
    "created_at": "2026-05-31T09:00:00Z",
    "student": {
      "id": "student-uuid",
      "full_name": "Jane Student"
    },
    "assigned": {
      "id": "sales-uuid",
      "full_name": "John Sales"
    }
  }
]
```

**Role-based filtering:**
- **Student:** Only sees their own conversations
- **Sales:** Sees conversations assigned to them OR unassigned
- **Manager:** Sees all conversations

---

### 2.2 Create Conversation

**Create a new conversation (Student only)**

```
POST {{base_url}}/conversations
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "subject": "Question about course registration",
  "message": "Hi, I need help registering for the Spring 2026 semester. Can you assist?"
}
```

**Response (201 Created):**
```json
{
  "id": "new-thread-uuid",
  "subject": "Question about course registration",
  "status": "open",
  "student_id": "your-uuid",
  "assigned_to": null,
  "last_message_at": "2026-05-31T10:45:00Z",
  "created_at": "2026-05-31T10:45:00Z"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Only students can create conversations"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Subject and message are required"
}
```

---

### 2.3 Get Single Conversation

**Get conversation details with all messages**

```
GET {{base_url}}/conversations/:threadId
```

**Example:**
```
GET {{base_url}}/conversations/123e4567-e89b-12d3-a456-426614174000
```

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response (200 OK):**
```json
{
  "thread": {
    "id": "thread-uuid",
    "subject": "Need help with enrollment",
    "status": "open",
    "student_id": "student-uuid",
    "assigned_to": "sales-uuid",
    "last_message_at": "2026-05-31T10:30:00Z",
    "created_at": "2026-05-31T09:00:00Z",
    "student": {
      "id": "student-uuid",
      "full_name": "Jane Student"
    },
    "assigned": {
      "id": "sales-uuid",
      "full_name": "John Sales"
    }
  },
  "messages": [
    {
      "id": "msg-uuid-1",
      "body": "Hi, I need help with enrollment",
      "created_at": "2026-05-31T09:00:00Z",
      "sender_type": "student",
      "sender": {
        "id": "student-uuid",
        "full_name": "Jane Student",
        "role": "student"
      }
    },
    {
      "id": "msg-uuid-2",
      "body": "Sure! I can help you with that.",
      "created_at": "2026-05-31T10:30:00Z",
      "sender_type": "team",
      "sender": {
        "id": "sales-uuid",
        "full_name": "John Sales",
        "role": "sales"
      }
    }
  ]
}
```

**Error (404 Not Found):**
```json
{
  "error": "Thread not found"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

---

### 2.4 Update Conversation Status

**Change conversation status (Sales/Manager only)**

```
PATCH {{base_url}}/conversations/:threadId/status
```

**Example:**
```
PATCH {{base_url}}/conversations/123e4567-e89b-12d3-a456-426614174000/status
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "status": "closed"
}
```

**Valid status values:**
- `open`
- `pending`
- `closed`

**Response (200 OK):**
```json
{
  "id": "thread-uuid",
  "subject": "Need help with enrollment",
  "status": "closed",
  "student_id": "student-uuid",
  "assigned_to": "sales-uuid",
  "last_message_at": "2026-05-31T10:30:00Z",
  "created_at": "2026-05-31T09:00:00Z",
  "updated_at": "2026-05-31T11:00:00Z"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Students cannot change status"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid status"
}
```

---

### 2.5 Assign Conversation

**Assign conversation to an agent (Sales/Manager)**

```
PATCH {{base_url}}/conversations/:threadId/assign
```

**Example:**
```
PATCH {{base_url}}/conversations/123e4567-e89b-12d3-a456-426614174000/assign
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**

**Assign to yourself:**
```json
{
  "assignedTo": "your-user-uuid"
}
```

**Unassign (Manager only):**
```json
{
  "assignedTo": null
}
```

**Assign to another agent (Manager only):**
```json
{
  "assignedTo": "other-agent-uuid"
}
```

**Response (200 OK):**
```json
{
  "id": "thread-uuid",
  "subject": "Need help with enrollment",
  "status": "open",
  "student_id": "student-uuid",
  "assigned_to": "sales-uuid",
  "last_message_at": "2026-05-31T10:30:00Z",
  "created_at": "2026-05-31T09:00:00Z",
  "updated_at": "2026-05-31T11:15:00Z"
}
```

**Business Rules:**
- **Sales:** Can only assign unassigned conversations to themselves
- **Manager:** Can assign/reassign to anyone or unassign

**Error (403 Forbidden):**
```json
{
  "error": "Thread is already assigned"
}
```

---

## 3️⃣ Message Endpoints

### 3.1 Send Message

**Send a new message in a conversation**

```
POST {{base_url}}/conversations/:threadId/messages
```

**Example:**
```
POST {{base_url}}/conversations/123e4567-e89b-12d3-a456-426614174000/messages
```

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "body": "Thank you for your help! I was able to register successfully."
}
```

**Response (201 Created):**
```json
{
  "id": "new-msg-uuid",
  "thread_id": "thread-uuid",
  "sender_id": "your-uuid",
  "sender_type": "student",
  "body": "Thank you for your help! I was able to register successfully.",
  "created_at": "2026-05-31T11:30:00Z"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Message body is required"
}
```

**Error (403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

**Error (404 Not Found):**
```json
{
  "error": "Thread not found"
}
```

---

## 🧪 Testing Workflow Examples

### Example 1: Student Creates and Chats

1. **Login as student** and get token
2. **Create conversation:**
   ```
   POST /api/conversations
   Body: { "subject": "Test", "message": "Hello" }
   ```
3. **Get conversation list:**
   ```
   GET /api/conversations
   ```
4. **Send another message:**
   ```
   POST /api/conversations/{threadId}/messages
   Body: { "body": "Any updates?" }
   ```

### Example 2: Sales Assigns and Responds

1. **Login as sales** and get token
2. **Get unassigned conversations:**
   ```
   GET /api/conversations?assignedTo=unassigned
   ```
3. **Assign to yourself:**
   ```
   PATCH /api/conversations/{threadId}/assign
   Body: { "assignedTo": "your-sales-uuid" }
   ```
4. **Send reply:**
   ```
   POST /api/conversations/{threadId}/messages
   Body: { "body": "I'm here to help!" }
   ```
5. **Close conversation:**
   ```
   PATCH /api/conversations/{threadId}/status
   Body: { "status": "closed" }
   ```

### Example 3: Manager Reassigns

1. **Login as manager** and get token
2. **Get team members:**
   ```
   GET /api/users/team
   ```
3. **Get all conversations:**
   ```
   GET /api/conversations
   ```
4. **Reassign conversation:**
   ```
   PATCH /api/conversations/{threadId}/assign
   Body: { "assignedTo": "other-sales-agent-uuid" }
   ```

---

## 🔒 Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Missing or invalid Authorization header"
}
```
**Fix:** Make sure you're sending `Authorization: Bearer {token}` header

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```
**Fix:** You don't have permission for this action (wrong role or not your conversation)

### 404 Not Found
```json
{
  "error": "Thread not found"
}
```
**Fix:** The conversation ID doesn't exist or you don't have access to it

### 500 Internal Server Error
```json
{
  "error": "Database error message here"
}
```
**Fix:** Check backend logs, might be a database issue

---

## 📦 Import Postman Collection

I can create a Postman collection JSON file for you! Would you like me to generate one with all these endpoints pre-configured?

---

## 🎯 Quick Reference

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/me` | GET | All | Get current user profile |
| `/api/users/team` | GET | Manager | Get sales team list |
| `/api/conversations` | GET | All | List conversations |
| `/api/conversations` | POST | Student | Create conversation |
| `/api/conversations/:id` | GET | All | Get conversation details |
| `/api/conversations/:id/status` | PATCH | Sales/Manager | Update status |
| `/api/conversations/:id/assign` | PATCH | Sales/Manager | Assign conversation |
| `/api/conversations/:id/messages` | POST | All | Send message |

---

**Happy Testing! 🚀**
