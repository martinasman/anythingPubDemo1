// ============================================
// SAAS STARTER EXAMPLE PROJECT
// ============================================
// Complete reference example for The Architect to learn from
// Contains all key files for a basic SaaS application with auth, dashboard, and settings

export const SAAS_STARTER_EXAMPLE = `# SaaS Starter Example

This is a complete, working SaaS application with:
- User authentication (signup/login)
- Dashboard with sidebar navigation
- User profile and settings pages
- Database schema with RLS policies
- Responsive design with dark mode

## Key Files Structure

### Authentication
- app/(auth)/login/page.tsx - Login form
- app/(auth)/signup/page.tsx - Signup form
- contexts/AuthContext.tsx - Auth state management
- hooks/useAuth.ts - Custom auth hook

### Dashboard
- app/(dashboard)/layout.tsx - Protected layout with auth check
- app/(dashboard)/dashboard/page.tsx - Main dashboard
- app/(dashboard)/settings/page.tsx - User settings
- components/layouts/Sidebar.tsx - Navigation sidebar
- components/layouts/Header.tsx - Dashboard header

### Backend
- lib/supabase/client.ts - Browser Supabase client
- lib/supabase/server.ts - Server Supabase client
- lib/supabase/middleware.ts - Auth middleware
- supabase/migrations/001_user_profiles.sql - Database schema

### Components
- components/ui/button.tsx - Button component
- components/ui/input.tsx - Input field
- components/ui/label.tsx - Form label
- components/ui/form.tsx - Form components with validation

### Configuration
- next.config.ts - Next.js config
- tsconfig.json - TypeScript config
- tailwind.config.ts - Tailwind CSS config
- package.json - Dependencies
- .env.example - Environment template

## Key Patterns Used

1. **nextjs-base** - Foundation structure
2. **shadcn-setup** - UI component library
3. **supabase-client** - Backend integration
4. **supabase-auth** - Authentication system
5. **user-profile-table** - Database with RLS
6. **dashboard-layout** - Protected dashboard
7. **data-table** - For displaying user data

## Working Features

✓ Email/password signup with validation
✓ Login with persistent session
✓ Protected dashboard routes
✓ User profile storage in Supabase
✓ Settings page to update profile
✓ Dark mode support
✓ Responsive mobile design
✓ Row Level Security policies
✓ Automatic profile creation on signup
✓ Sidebar navigation with active state

## Setup Instructions

1. Clone the generated project
2. Install: npm install
3. Create Supabase project
4. Add credentials to .env.local
5. Run migrations in SQL editor
6. Start dev server: npm run dev
7. Visit http://localhost:3000

## Extension Points

- Add billing/payment (Stripe)
- Add email notifications (Resend)
- Add file uploads (Storage)
- Add real-time features (Realtime)
- Add search functionality
- Add API endpoints
- Add scheduled tasks

This example demonstrates all key concepts for building a modern SaaS application.
`;

export default SAAS_STARTER_EXAMPLE;
