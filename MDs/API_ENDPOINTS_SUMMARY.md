# 🚀 API Endpoints - Quick Reference

## Base URL
```
http://localhost:8787/api
```

## Authentication
All endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Complete Endpoint List

### 👤 User Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/me` | All | Get current user profile |
| `GET` | `/api/users/team` | Manager | Get list of sales agents |

---

### 💬 Conversation Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/api/conversations` | All | List conversations (role-filtered) |
| `GET` | `/api/conversations?status=open` | All | Filter by status |
| `GET` | `/api/conversations?assignedTo=unassigned` | All | Filter by assignment |
| `GET` | `/api/conversations?q=search` | All | Search by subject |
| `POST` | `/api/conversations` | Student | Create new conversation |
| `GET` | `/api/conversations/:id` | All | Get conversation with messages |
| `PATCH` | `/api/conversations/:id/status` | Sales/Manager | Update status |
| `PATCH` | `/api/conversations/:id/assign` | Sales/Manager | Assign/reassign conversation |

---

### 📨 Message Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/conversations/:id/messages` | All | Send message in conversation |

---

## 🔐 Role-Based Access

### Student
- ✅ Can see only their own conversations
- ✅ Can create new conversations
- ✅ Can send messages in their conversations
- ❌ Cannot change status
- ❌ Cannot assign conversations

### Sales
- ✅ Can see unassigned conversations OR conversations assigned to them
- ✅ Can assign unassigned conversations to themselves
- ✅ Can change status of their assigned conversations
- ✅ Can send messages in their assigned conversations
- ❌ Cannot reassign to others
- ❌ Cannot see other agents' conversations

### Manager
- ✅ Can see ALL conversations
- ✅ Can assign/reassign to anyone
- ✅ Can unassign conversations
- ✅ Can change any conversation status
- ✅ Can send messages in any conversation
- ✅ Can view team member list

---

## 📦 Files Created

1. **`MDs/POSTMAN_API_TESTING_GUIDE.md`**
   - Complete guide with examples
   - Step-by-step instructions
   - All request/response formats
   - Error handling

2. **`Student-Support-Chat-API.postman_collection.json`**
   - Ready-to-import Postman collection
   - All endpoints pre-configured
   - Just add your token!

---

## 🎯 Quick Start

### 1. Get Your Token
```bash
# Start frontend
npm run dev

# Login at http://localhost:5173/
# Press F12 → Application → Local Storage
# Copy access_token from: sb-vdzwjlaugsryljrjnpta-auth-token
```

### 2. Import to Postman
- Open Postman
- Click **Import**
- Select `Student-Support-Chat-API.postman_collection.json`
- Edit collection variables:
  - `base_url`: `http://localhost:8787/api`
  - `token`: (paste your token)

### 3. Start Testing!
- Make sure backend is running: `cd worker && npm run dev`
- Try: `GET /api/me` to verify your token works
- Explore other endpoints!

---

## 🧪 Test Scenarios

### Scenario 1: Student Flow
1. Login as student
2. `POST /api/conversations` - Create conversation
3. `GET /api/conversations` - See your conversations
4. `POST /api/conversations/:id/messages` - Send message

### Scenario 2: Sales Flow
1. Login as sales
2. `GET /api/conversations?assignedTo=unassigned` - Find unassigned
3. `PATCH /api/conversations/:id/assign` - Assign to self
4. `POST /api/conversations/:id/messages` - Reply
5. `PATCH /api/conversations/:id/status` - Close conversation

### Scenario 3: Manager Flow
1. Login as manager
2. `GET /api/users/team` - Get team list
3. `GET /api/conversations` - See all conversations
4. `PATCH /api/conversations/:id/assign` - Reassign to agent

---

## 📚 Demo Accounts

```
Student:  student@demo.com  / demo1234
Sales:    sales1@demo.com   / demo1234
Manager:  manager@demo.com  / demo1234
```

---

**Happy Testing! 🎉**
