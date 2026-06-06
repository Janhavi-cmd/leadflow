# 🚀 LeadFlow CRM v2.0

> A production-grade Lead Management CRM with JWT authentication, real-time WebSocket updates, AI lead scoring, Kanban board, CSV import/export, activity timeline, and more.

![LeadFlow CRM](https://img.shields.io/badge/version-2.0.0-6c63ff?style=flat-square) ![Node.js](https://img.shields.io/badge/node-18+-green?style=flat-square) ![React](https://img.shields.io/badge/react-18-61dafb?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## ✨ Features

### Core (Assignment Requirements)
- ✅ Add / Edit / Delete leads
- ✅ View all leads in a dashboard
- ✅ Update lead status (New → Contacted → Qualified → Converted / Lost)
- ✅ Search by name, email, company, phone
- ✅ All required fields: Name, Email, Phone, Company, Status, Notes, Created Date

### Bonus Features
- ✅ Lead statistics dashboard with charts (area, pie, bar)
- ✅ Pagination (server-side)
- ✅ Sorting & filtering (status, source, priority, assignedTo)
- ✅ Responsive design (mobile-first)

### Advanced Features (Beyond the Spec)
- 🔐 **JWT Authentication** — Login/Register with secure token-based auth
- 👥 **Role-Based Access Control** — Admin, Manager, Sales Rep roles
- 🎯 **AI Lead Scoring** — Algorithmic score (1–99) based on deal value, source, status
- 📋 **Kanban Board** — Drag-and-drop leads across status columns
- 📊 **Activity Timeline** — Full audit log on every lead
- 🔔 **Real-Time Notifications** — Socket.io live updates when lead status changes
- 📥 **CSV Import** — Bulk upload leads via CSV file
- 📤 **CSV Export** — Export filtered leads to CSV
- 🔍 **Command Palette** — Cmd+K / Ctrl+K to jump to any lead instantly
- 🌙 **Dark Mode** — Sleek dark UI with purple accent
- 📅 **Follow-up Reminders** — Set follow-up dates, see "Due Today" / "Overdue" counts
- 💰 **Deal Value Tracking** — Revenue pipeline per lead
- 🏷️ **Tags & Priority** — Categorize and prioritize leads

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router v6, Recharts, Socket.io-client, @hello-pangea/dnd |
| Backend | Node.js, Express.js, Socket.io |
| Database | MongoDB (via Mongoose) OR In-Memory (auto-fallback, zero setup) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer |
| HTTP Client | Axios |
| Notifications | react-hot-toast |

---

## ⚡ Quick Start (Zero Setup — No Database Needed)

The app uses an **in-memory data store with 6 seeded leads** when no MongoDB URI is set, so it runs instantly out of the box.

### Step 1: Install & Start Backend

```bash
cd leadflow-v2/backend
npm install
npm start
```

You should see:
```
🚀 LeadFlow CRM v2 API running on http://localhost:5000
⚡ Running with in-memory data store (no MongoDB URI set)
📦 Seeded 3 users, 6 leads
```

### Step 2: Install & Start Frontend (new terminal)

```bash
cd leadflow-v2/frontend
npm install
npm start
```

App opens automatically at **http://localhost:3000**

### Step 3: Login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@leadflow.com | admin123 |
| Manager | manager@leadflow.com | manager123 |
| Sales Rep | rep@leadflow.com | rep123 |

---

## 🗄️ MongoDB Setup (Optional)

Create a `.env` file in the `backend/` folder:

```env
MONGODB_URI=mongodb://localhost:27017/leadflow
JWT_SECRET=your-super-secret-key-here
PORT=5000
```

Or use MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/leadflow
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /api/auth/login | Login, returns JWT token | ❌ |
| POST | /api/auth/register | Register new user | ❌ |
| GET | /api/auth/me | Get current user | ✅ |

### Leads
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/leads | Get all leads (paginated, filtered) | ✅ |
| GET | /api/leads/kanban | Get leads grouped by status | ✅ |
| GET | /api/leads/export/csv | Export leads as CSV | ✅ |
| POST | /api/leads/import/csv | Bulk import leads from CSV | ✅ |
| GET | /api/leads/:id | Get single lead with activity log | ✅ |
| POST | /api/leads | Create lead | ✅ |
| PUT | /api/leads/:id | Update full lead | ✅ |
| PATCH | /api/leads/:id/status | Update status only | ✅ |
| DELETE | /api/leads/:id | Delete lead | ✅ |
| POST | /api/leads/:id/note | Add note to lead | ✅ |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/stats | Dashboard KPIs + charts data |

### Query Parameters (GET /api/leads)
```
search=priya          # Full-text search
status=Qualified      # Filter by status
source=LinkedIn       # Filter by source
priority=High         # Filter by priority
sortBy=dealValue      # Sort field
sortOrder=desc        # asc or desc
page=1&limit=10       # Pagination
```

### Example cURL Requests

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadflow.com","password":"admin123"}'

# Create a lead (replace TOKEN)
curl -X POST http://localhost:5000/api/leads \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@acme.com","company":"Acme Corp","dealValue":50000}'

# Get all leads
curl http://localhost:5000/api/leads \
  -H "Authorization: Bearer TOKEN"

# Export CSV
curl http://localhost:5000/api/leads/export/csv \
  -H "Authorization: Bearer TOKEN" -o leads.csv
```

---

## 📂 Project Structure

```
leadflow-v2/
├── backend/
│   ├── middleware/
│   │   └── auth.js            # JWT auth + role guard middleware
│   ├── routes/
│   │   ├── auth.js            # Login, register, /me
│   │   ├── leads.js           # Full CRUD + Kanban + CSV + Notes
│   │   ├── stats.js           # Dashboard analytics
│   │   └── users.js           # User listing (admin)
│   ├── utils/
│   │   └── seedMemory.js      # In-memory store + seed data
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Express + Socket.io server
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.js   # Sidebar + layout shell
│   │   │   ├── CommandPalette.js  # Cmd+K search
│   │   │   ├── LeadModal.js   # Add/Edit lead form
│   │   │   └── NotificationBell.js # Real-time notifications
│   │   ├── context/
│   │   │   └── AuthContext.js # Auth state + JWT storage
│   │   ├── pages/
│   │   │   ├── DashboardPage.js   # KPIs + Charts
│   │   │   ├── KanbanPage.js      # Drag-and-drop board
│   │   │   ├── LeadDetailPage.js  # Lead profile + activity log
│   │   │   ├── LeadsPage.js       # Table + search + filter
│   │   │   └── LoginPage.js       # Auth page
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance + interceptors
│   │   ├── App.js
│   │   ├── index.css          # Design tokens + global styles
│   │   └── index.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Deployment

### Backend — Railway / Render / Heroku

```bash
# Set env vars on your platform:
MONGODB_URI=...
JWT_SECRET=...
PORT=5000
```

### Frontend — Vercel / Netlify

```bash
cd frontend
npm run build
# Deploy the `build/` folder
# Set REACT_APP_API_URL to your backend URL
```

---

## 🧪 Sample CSV Import Format

```csv
Name,Email,Phone,Company,Status,Source,Deal Value,Notes
John Doe,john@acme.com,+91 98765 00001,Acme Corp,New,Website,50000,From trade show
Jane Smith,jane@beta.io,+91 87654 00002,Beta Inc,Contacted,LinkedIn,30000,Warm lead
```

---

## 📊 AI Lead Score Breakdown

| Factor | Score Impact |
|--------|-------------|
| Deal value > ₹2L | +25 pts |
| Deal value > ₹1L | +18 pts |
| Source: Referral | +20 pts |
| Source: LinkedIn | +12 pts |
| Status: Qualified | +15 pts |
| Status: Converted | +20 pts |
| Status: Lost | -20 pts |
| Notes length > 50 chars | +5 pts |
| Follow-up date set | +5 pts |

---

## 📝 Submission

Built for: Full Stack Developer Internship Assignment  
Submitted to: hr@websites.co.in  
GitHub: https://github.com/Janhavi-cmd/leadflow
Live Demo: https://leadflow-plum.vercel.app/

---

*LeadFlow CRM v2.0 — Built with ❤️ to demonstrate full-stack development skills*
