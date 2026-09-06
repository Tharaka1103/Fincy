# FINCY – Personal Finance Management System

<div align="center">
  <br />
  <h2>✨ Intelligent Personal Finance Tracking with Glassmorphism UI ✨</h2>
  <p>A next-level, single-user personal finance management solution built on Next.js 16, Prisma ORM, NextAuth v5, PostgreSQL, and Upstash Redis.</p>
</div>

---

## 🌟 Key Features

- 🔒 **Single-Device Security & Device Enforcement**: Protects against concurrent multi-device logins with active session tracking and instant force-logout dialogs.
- 👁️ **Hidden-by-Default Balances**: Privacy-first dashboard keeps total net worth and account balances blurred/hidden until clicked with the eye toggle.
- 💳 **Multi-Account Tracking**: Manage Bank, Cash, Credit Card, Savings, and Investment accounts with real-time balance calculations.
- 💸 **Smart Transactions**: Filterable by account, category, and type (Expense, Income, Transfer), with support for split transactions and recurring schedules.
- 📊 **Dynamic Analytics**: Recharts-powered interactive visualizations including 6-month cash flow trends, category breakdown donut charts, and spending rank indicators.
- 🎯 **Category Budgets & Alerts**: Set monthly spending limits per category with visual progress meters and alert thresholds (e.g. at 80% capacity).
- 🏆 **Savings Goals**: Set financial milestones, track accumulated deposits, calculate days remaining to target deadlines, and contribute directly from linked accounts.
- ⏰ **Bills & Reminders**: Recurring and one-time bill payment alerts with email notifications via Resend.
- 📱 **Mobile-First Glassmorphism Experience**: Mobile bottom navigation bar that can be dynamically customized and re-ordered in real-time from Settings.
- 📄 **Tax & Statement Reports**: Export filtered transaction histories to Excel/Google Sheets compatible CSV files.
- 🛡️ **Comprehensive Audit Logging**: Tracks sensitive account actions, password changes, logins, and settings updates with timestamps and IP addresses.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Database & ORM** | PostgreSQL + Prisma 6 |
| **Authentication** | NextAuth.js v5 (Google OAuth + Credentials with bcryptjs) |
| **Styling & UI** | Tailwind CSS v4 + Radix UI / Shadcn + Glassmorphism Tokens |
| **Charts & Visuals** | Recharts |
| **Email Delivery** | Resend |
| **Rate Limiting** | Upstash Redis |

---

## 📋 Environment Variables (.env.local)

Create a `.env.local` file at the root of your project:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/fincy?schema=public"

# NextAuth v5
AUTH_SECRET="your-32-byte-secret-generate-with-openssl-rand-hex-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (Optional for local testing, required for Google sign-in)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Resend Email (Optional for local testing, required for email delivery)
RESEND_API_KEY="re_123456789"
RESEND_FROM_EMAIL="FINCY <noreply@fincy.app>"

# Upstash Redis (Optional for local testing, required for rate limiting)
UPSTASH_REDIS_REST_URL="https://your-redis-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Setup Database & Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Push database schema to your PostgreSQL database
npx prisma db push

# Seed realistic demo data (demo accounts, 6 months transactions, budgets, goals)
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 👤 Demo Credentials

If you seeded the database using `npx tsx prisma/seed.ts`:

- **Email**: `alex@fincy.app`
- **Password**: `Password123!`

---

## 📁 Architecture Overview

```
app/
├── (auth)/                 # Login, Register, Forgot Password
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (dashboard)/            # Authenticated pages (shared Header & Mobile BottomNav)
│   ├── dashboard/          # Primary privacy-first dashboard
│   ├── accounts/           # Financial accounts management
│   ├── transactions/       # Transaction ledger & CSV export
│   ├── analytics/          # Recharts charts & cash flow trends
│   ├── budget/             # Monthly category budget limits
│   ├── reminders/          # Bill deadlines & alerts
│   ├── goals/              # Savings milestones & contributions
│   ├── reports/            # Custom date-range statement downloads
│   └── settings/           # Profile, bottom nav customization, security
├── api/
│   ├── auth/[...nextauth]/ # NextAuth v5 route handler
│   └── v1/                 # REST APIs with validation & audit logs
lib/
├── api-client.ts           # Unified API fetch client
├── auth.ts                 # NextAuth credentials & Google config
├── email.ts                # Resend templates
├── prisma.ts               # Prisma singleton client
├── rate-limiter.ts         # Upstash rate limiting
└── validations/            # Zod validation schemas
prisma/
├── schema.prisma           # Complete database schema
└── seed.ts                 # Realistic demo data seeder
```