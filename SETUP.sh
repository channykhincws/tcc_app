# ════════════════════════════════════════════════════
#  School Management System — Full Setup Guide
#  Vercel + Neon PostgreSQL
# ════════════════════════════════════════════════════

# ── STEP 1: Extract & Enter Project ─────────────────
unzip school-management-system.zip
cd school-management

# ── STEP 2: Install Dependencies ────────────────────
npm install

# ── STEP 3: Create .env.local ───────────────────────
# Copy the example file
cp .env.local.example .env.local

# Then EDIT .env.local with your real values:
# DATABASE_URL="postgresql://alex:password@ep-xxx.ap-southeast-1.aws.neon.tech/schooldb?sslmode=require"
# JWT_SECRET="school-management-secret-key-2025-abc123def456"

# ── STEP 4: Push Schema to Neon ─────────────────────
npx prisma db push

# ── STEP 5: Seed Demo Data ──────────────────────────
npx prisma db seed

# ── STEP 6: Test Locally ────────────────────────────
npm run dev
# Open: http://localhost:3000

# ── STEP 7: Deploy to Vercel ────────────────────────
npm install -g vercel
vercel login

# Set environment variables on Vercel
vercel env add DATABASE_URL production
# paste: postgresql://alex:password@ep-xxx.neon.tech/schooldb?sslmode=require

vercel env add JWT_SECRET production
# paste: school-management-secret-key-2025-abc123def456

# Deploy!
vercel --prod
