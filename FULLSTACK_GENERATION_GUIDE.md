# Full-Stack Code Generation Guide

This guide covers how the **Anything** platform generates complete Next.js applications with Supabase integration.

## Overview

The platform intelligently detects whether you're building a simple landing page or a full-stack SaaS application, and generates appropriate code accordingly.

### Generation Modes

#### 1. HTML Mode (Landing Pages)
- Single-file HTML websites
- Perfect for: Marketing sites, portfolios, coming soon pages
- Output: Single `website.html` file
- Example request: "Create a landing page for a gym membership service"

#### 2. Next.js Mode (Full-Stack Applications)
- Complete Next.js 15 projects with TypeScript
- Backend: Supabase for authentication and data
- Frontend: React Server Components + Shadcn/UI
- Database: PostgreSQL with migrations and RLS policies
- Example request: "Build a SaaS app for task management with user authentication and teams"

## Example Prompts

### HTML Mode Examples

```
"Create a landing page for a coffee shop with hero section, menu, and contact form"

"Design a coming soon page for an AI startup with email signup"

"Build a portfolio website showcasing 5 projects with dark mode"
```

### Next.js Mode Examples

```
"Build a SaaS app where users can create and share notes with their teams"

"Create a project management dashboard with task lists, comments, and user permissions"

"Build a CRM application with contacts, companies, deals, and activity tracking"

"Create a fitness app where users can log workouts and see statistics"

"Build a collaborative document editor like Google Docs but simplified"
```

## How It Works

### 1. Mode Detection

The system analyzes your request for keywords:

**Full-Stack Signals:**
- "SaaS", "app", "dashboard", "login", "signup", "database"
- "user accounts", "manage", "admin panel", "CRUD"
- "authentication", "users can", "profiles", "settings"

**HTML Signals:**
- "landing page", "marketing site", "portfolio"
- "website", "coming soon", "static site", "one page"

If ambiguous, the system defaults to HTML (simpler, faster).

### 2. Pattern Selection

For Next.js projects, the system automatically selects code patterns based on your request:

| Pattern | When It's Used | What It Includes |
|---------|---|---|
| **nextjs-base** | All Next.js projects | Next.js 15 config, TypeScript setup, Tailwind CSS |
| **shadcn-setup** | All Next.js projects | Button, Input, Form, Table components from Shadcn/UI |
| **supabase-client** | All Next.js projects | Supabase client setup, environment variables |
| **supabase-auth** | Requests mentioning "login", "signup", "auth" | Complete authentication system with email/password |
| **user-profile-table** | Requests with auth | Database table for user profiles, RLS policies |
| **dashboard-layout** | Requests mentioning "dashboard", "admin" | Sidebar layout, navigation, header |
| **data-table** | Requests mentioning "list", "table", "manage" | Reusable data table with sorting, filtering, pagination |

### 3. File Generation

The system generates:
- **Source files** from combined patterns + LLM-generated custom code
- **Configuration files**: `package.json`, `tsconfig.json`, `next.config.ts`, etc.
- **Database migrations**: SQL files in `supabase/migrations/`
- **Environment template**: `.env.example` with required variables
- **Setup documentation**: `README.md` with step-by-step instructions
- **.gitignore**: Pre-configured for Next.js projects

**Total files**: 20-50 depending on complexity

### 4. Export & Deployment

Generated files are packaged as a ZIP file containing a complete, runnable Next.js project.

## Using Your Generated Project

### Step 1: Extract and Install

```bash
# Unzip the downloaded file
unzip nextjs-app.zip
cd nextjs-app

# Install dependencies
npm install
```

### Step 2: Set Up Supabase

1. Create a free Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → API**
4. Copy your **Project URL** and **Anon Key**

### Step 3: Configure Environment

1. Create `.env.local` file (copy from `.env.example`)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 4: Apply Database Migrations

1. Go to your Supabase dashboard
2. Open **SQL Editor**
3. Copy each migration file from `supabase/migrations/` (in order)
4. Paste and execute in Supabase
5. Verify tables appear in the **Schema** tab

### Step 5: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Deploy to Vercel

1. Push your project to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Create new project from GitHub repository
4. Add environment variables (Project Settings → Environment Variables)
5. Deploy!

## Project Structure

Generated Next.js projects follow this structure:

```
my-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, signup)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
│
├── components/
│   ├── ui/                   # Shadcn/UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── form.tsx
│   │   └── table.tsx
│   └── layouts/              # Custom layouts
│       ├── Sidebar.tsx
│       └── Header.tsx
│
├── lib/
│   ├── supabase/             # Supabase configuration
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   └── utils.ts              # Utility functions
│
├── hooks/
│   └── useAuth.ts            # Authentication hook
│
├── types/
│   └── database.ts           # Database type definitions
│
├── supabase/
│   └── migrations/           # Database migrations
│       └── 001_initial.sql
│
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .env.example
├── .gitignore
└── README.md
```

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Authentication Flow

If your project includes authentication:

### Sign Up
1. User enters email and password
2. Supabase creates user account
3. Auto-login and redirect to dashboard
4. User profile created in database

### Login
1. User enters credentials
2. Supabase verifies and creates session
3. Redirect to dashboard

### Protected Routes
- Dashboard pages check authentication status
- Unauthenticated users redirected to login
- Session persists across page refreshes

## Database Access

### In Server Components

```tsx
// app/dashboard/page.tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Query data
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div>
      {tasks.map(task => <div key={task.id}>{task.title}</div>)}
    </div>
  )
}
```

### In Client Components

```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@/lib/supabase/client'

export function TaskForm() {
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const handleSubmit = async (title: string) => {
    await supabase.from('tasks').insert({
      user_id: user.id,
      title
    })
  }

  return (
    <form onSubmit={() => handleSubmit('New Task')}>
      {/* form fields */}
    </form>
  )
}
```

## Customization

### Adding Database Tables

1. Create new SQL file in `supabase/migrations/`
2. Use naming: `002_table_name.sql`
3. Example:

```sql
-- supabase/migrations/002_tasks.sql

CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tasks
CREATE POLICY "Users can see own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

4. Go to Supabase and run the migration
5. Update TypeScript types in `types/database.ts`

### Adding API Routes

Create files in `app/api/`:

```tsx
// app/api/tasks/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)

  return Response.json(data)
}
```

### Adding Components

Use Shadcn/UI or build custom components:

```tsx
// components/TaskList.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function TaskList({ tasks: initialTasks }) {
  const [tasks, setTasks] = useState(initialTasks)

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center gap-2">
          <input type="checkbox" />
          <span>{task.title}</span>
        </div>
      ))}
    </div>
  )
}
```

## Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Database Connection Issues
- Verify `.env.local` has correct Supabase URL and key
- Check that migrations have been applied
- Ensure RLS policies are set correctly

### Port Already in Use
```bash
npm run dev -- -p 3001
```

### Authentication Not Working
- Verify Supabase auth is enabled
- Check that user profile migration ran
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is public (correct key)

### RLS Policy Errors
- Go to Supabase Dashboard
- Check **Authentication → Policies**
- Verify `auth.uid()` is being used correctly
- Test policies with Supabase SQL Editor

## Code Patterns Explained

### Pattern: supabase-auth

Provides complete email/password authentication:
- Sign up with email validation
- Login with persistent session
- Logout and session cleanup
- Protected routes via middleware
- User context hook for easy access

**Used when:** Request mentions "auth", "login", "signup", or "user accounts"

### Pattern: dashboard-layout

Provides a production-ready dashboard structure:
- Responsive sidebar navigation
- Header with user menu
- Protected root layout
- Page transitions and animations

**Used when:** Request mentions "dashboard", "admin", or similar

### Pattern: data-table

Provides reusable table component:
- Sortable columns
- Filterable columns
- Pagination
- Row selection
- Responsive design

**Used when:** Request mentions "list", "table", "manage", or "CRUD"

## Performance Tips

### 1. Database Queries
- Use `.select()` to only fetch needed columns
- Add `.limit()` for pagination
- Create database indexes on frequently filtered columns

### 2. Images
- Use `next/image` for automatic optimization
- Serve from Supabase Storage or CDN
- Use responsive sizes

### 3. Caching
- Server components cache by default
- Use `revalidatePath()` to update after mutations
- Consider `Cache-Control` headers for API routes

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key NOT in frontend code
- [ ] RLS policies enabled on all tables
- [ ] HTTPS enforced on production
- [ ] Supabase custom domains configured
- [ ] Rate limiting enabled for auth endpoints

## Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Getting Help

### Common Issues

**"NEXT_PUBLIC_SUPABASE_URL is not defined"**
- Check `.env.local` exists and has correct value
- Restart dev server after adding env vars

**"Cannot find module '@/lib/supabase/client'"**
- Verify file exists at `src/lib/supabase/client.ts`
- Check `tsconfig.json` path alias configuration

**"RLS policy prevents update"**
- Add RLS policy in Supabase for the operation
- Use `auth.uid()` to match current user

### Support Resources

- Supabase Discord: https://discord.supabase.io
- Next.js Discussions: https://github.com/vercel/next.js/discussions
- This project's documentation in README.md

---

**Generated by Anything Platform** | [Learn more about code generation](../README.md)
