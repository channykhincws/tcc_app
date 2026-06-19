# 🎓 School Management System

A complete Training Center & School Management System built with **Next.js 14**, **PostgreSQL**, **Prisma ORM**, deployable on **Vercel + Neon/Supabase**.

---

## ✨ Features

### Modules
| Module | Features |
|--------|---------|
| **Dashboard** | Stats cards, revenue chart, alerts, today's classes |
| **Students** | CRUD, profile, enrollment history, attendance, payments |
| **Teachers** | CRUD, class assignments, salary management |
| **Courses** | CRUD, card view, fee & duration management |
| **Classes** | CRUD, shift/room/teacher assignment, capacity tracking |
| **Enrollments** | Multi-course enrollment, fee calculation, discount |
| **Payments** | Invoice management, installment payments, QR/Cash/Bank |
| **Attendance** | Bulk marking, Present/Absent/Late, progress auto-update |
| **Reports** | Financial, Students, Attendance, Outstanding — Excel & PDF |

### User Roles
| Role | Access |
|------|--------|
| **Super Admin** | Full access to all modules |
| **Admin** | Students, Teachers, Courses, Classes, Enrollments |
| **Accountant** | Payments, Invoices, Reports |
| **Teacher** | Attendance only |

### Export Formats
- 📊 **Excel (.xlsx)** — Styled headers, color-coded status, summary rows
- 📄 **PDF** — Professional layout with school header, footer, page numbers
- 🖨️ **Print** — Browser print with print-optimized CSS

---

## 🛠 Tech Stack

```
Frontend:    Next.js 14 (App Router) + TypeScript
Styling:     Tailwind CSS + Custom CSS classes
Backend:     Next.js API Routes + Server Actions
Database:    PostgreSQL (Neon / Supabase)
ORM:         Prisma 5
Auth:        JWT (jsonwebtoken + bcryptjs)
Charts:      Recharts
Export:      ExcelJS + jsPDF + jspdf-autotable
Icons:       Lucide React
Hosting:     Vercel
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd school-management
npm install
```

### 2. Setup Database

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech) → Create free account
2. Create a new project → Copy connection string

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) → Create project
2. Settings → Database → Copy connection string (port 5432)

### 3. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/schooldb?sslmode=require"
JWT_SECRET="your-minimum-32-character-secret-key-here"
```

### 4. Setup Database & Seed
```bash
npm run db:push    # Push schema to database
npm run db:seed    # Seed demo data
```

### 5. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@school.com | Admin@123 |
| Admin | admin@school.com | Admin@123 |
| Accountant | accountant@school.com | Admin@123 |
| Teacher | chandara@school.com | Admin@123 |

---

## 📦 Deploy to Vercel

### Method 1: Vercel CLI
```bash
npm install -g vercel
vercel login

# Add environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# Deploy
vercel --prod
```

### Method 2: GitHub + Vercel Dashboard
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add environment variables in dashboard:
   - `DATABASE_URL` → your Neon/Supabase URL
   - `JWT_SECRET` → random 32+ char string
4. Deploy!

### Post-Deploy: Seed Production Database
```bash
# Set DATABASE_URL to production
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## 📁 Project Structure

```
school-management/
├── app/
│   ├── (dashboard)/          ← Protected dashboard routes
│   │   ├── layout.tsx        ← Sidebar + Header wrapper
│   │   ├── dashboard/        ← Stats, charts, alerts
│   │   ├── students/         ← Student CRUD + detail
│   │   ├── teachers/         ← Teacher CRUD
│   │   ├── courses/          ← Course cards + CRUD
│   │   ├── classes/          ← Class management
│   │   ├── enrollments/      ← Student enrollment
│   │   ├── payments/         ← Invoice + payment recording
│   │   ├── attendance/       ← Bulk attendance marking
│   │   └── reports/          ← Export reports
│   ├── api/                  ← REST API endpoints
│   │   ├── auth/             ← Login / Logout
│   │   ├── students/         ← Student CRUD API
│   │   ├── teachers/         ← Teacher CRUD API
│   │   ├── courses/          ← Course CRUD API
│   │   ├── classes/          ← Class CRUD API
│   │   ├── enrollments/      ← Enrollment API
│   │   ├── invoices/         ← Invoice API
│   │   ├── payments/         ← Payment recording API
│   │   ├── attendance/       ← Attendance bulk API
│   │   ├── reports/          ← Report + export API
│   │   └── dashboard/        ← Dashboard stats API
│   ├── login/                ← Login page
│   ├── globals.css           ← Tailwind + custom classes
│   └── layout.tsx            ← Root layout
├── components/
│   ├── layout/               ← Sidebar, Header
│   ├── shared/               ← DataTable, Modal, StatusBadge
│   └── students/             ← StudentForm
├── lib/
│   ├── prisma.ts             ← Prisma client singleton
│   ├── auth.ts               ← JWT helpers
│   ├── permissions.ts        ← Role-based access
│   ├── utils.ts              ← Formatters, helpers
│   └── export/
│       ├── excel.ts          ← ExcelJS export functions
│       └── pdf.ts            ← jsPDF export functions
├── prisma/
│   ├── schema.prisma         ← 16 database tables
│   └── seed.ts               ← Demo data seeder
├── types/index.ts            ← TypeScript types
├── middleware.ts             ← JWT auth + role guard
└── vercel.json               ← Vercel deployment config
```

---

## 🗄 Database Schema (16 Tables)

```
users              → Auth accounts with roles
shifts             → Morning / Afternoon / Evening
study_times        → 07:00-08:30, etc.
teachers           → Teacher profiles + salary
courses            → Course catalog + fees
classes            → Class schedules + rooms
students           → Student profiles + photos
enrollments        → Student ↔ Class registration
invoices           → Fee invoices (PAID/PARTIAL/UNPAID)
payments           → Multi-installment payment records
attendance         → Daily attendance tracking
enrollment_progress → Auto-calculated study progress
notifications      → System alerts
settings           → School configuration
audit_logs         → Action history
```

---

## 🔌 API Reference

```
GET  /api/dashboard              → Dashboard stats + alerts
GET  /api/students               → List (search, filter, paginate)
POST /api/students               → Create student
GET  /api/students/:id           → Student detail + enrollments
PUT  /api/students/:id           → Update student
DEL  /api/students/:id           → Soft delete (deactivate)

GET  /api/teachers               → Teacher list
POST /api/teachers               → Create teacher
PUT  /api/teachers/:id           → Update
DEL  /api/teachers/:id           → Deactivate

GET  /api/courses                → Course list
POST /api/courses                → Create
PUT  /api/courses/:id            → Update
DEL  /api/courses/:id            → Deactivate

GET  /api/classes                → Class list (filter by course)
POST /api/classes                → Create class
PUT  /api/classes/:id            → Update
DEL  /api/classes/:id            → Deactivate

POST /api/enrollments            → Enroll student (creates invoice)
GET  /api/enrollments            → List enrollments

GET  /api/invoices               → Invoice list (filter by status)
POST /api/payments               → Record payment (updates invoice)

GET  /api/attendance             → Get attendance records
POST /api/attendance             → Bulk upsert attendance

GET  /api/reports?type=financial&format=excel  → Export
GET  /api/reports?type=students&format=pdf     → Export
GET  /api/reports?type=attendance&classId=...  → Export
GET  /api/reports?type=outstanding             → Export

POST /api/auth/login             → Login → set JWT cookie
POST /api/auth/logout            → Clear cookie
```

---

## 📊 Alert Types

| Alert | Trigger Condition |
|-------|------------------|
| 💰 **Due Payment** | Invoice dueAmount > 0 |
| ⏰ **Course Ending** | Remaining days ≤ 7 |
| 🏫 **Class Full** | Enrollments ≥ maxStudent |

---

## 🔧 Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:push      # Sync Prisma schema → DB
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:reset     # Reset DB + re-seed
```

---

## 📝 License

MIT — Free for commercial and personal use.

---

Built with ❤️ for Cambodian training centers and language schools.
