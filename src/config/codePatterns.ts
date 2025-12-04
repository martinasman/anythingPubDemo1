// ============================================
// CODE PATTERNS LIBRARY FOR FULL-STACK GENERATION
// ============================================
// Reusable code patterns that can be composed into complete Next.js applications
// Each pattern includes all necessary files, dependencies, and configuration

export interface CodePatternFile {
  path: string;
  content: string;
  description: string;
  type: 'tsx' | 'ts' | 'json' | 'css' | 'sql' | 'env';
}

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  category: 'base' | 'auth' | 'database' | 'api' | 'component' | 'layout';
  dependencies: {
    npm: string[];
    patterns: string[];
  };
  envVars: {
    required: string[];
    optional: string[];
  };
  files: CodePatternFile[];
  usage: string;
  relatedPatterns: string[];
}

// ============================================
// PATTERN 1: NEXT.JS BASE SETUP
// ============================================

export const NEXTJS_BASE_PATTERN: CodePattern = {
  id: 'nextjs-base',
  name: 'Next.js 15 Base Setup',
  description: 'Foundation Next.js 15 project with App Router, TypeScript, and Tailwind CSS',
  category: 'base',
  dependencies: {
    npm: [
      'next@15.1.0',
      'react@19.0.0-rc.1',
      'react-dom@19.0.0-rc.1',
      'typescript@5.7.0',
      'tailwindcss@4.0.0',
      '@types/node@20.15.1',
      '@types/react@18.3.3',
      '@types/react-dom@18.3.0',
    ],
    patterns: [],
  },
  envVars: {
    required: [],
    optional: [],
  },
  files: [
    {
      path: '/next.config.ts',
      type: 'ts',
      description: 'Next.js configuration',
      content: `import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;
`,
    },
    {
      path: '/tsconfig.json',
      type: 'json',
      description: 'TypeScript configuration with strict mode',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "dom", "dom.iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["node", "jest", "@testing-library/jest-dom"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`,
    },
    {
      path: '/tailwind.config.ts',
      type: 'ts',
      description: 'Tailwind CSS configuration for v4',
      content: `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      },
      fontFamily: {
        sans: ['var(--font-family)'],
      },
    },
  },
  plugins: [],
};

export default config;
`,
    },
    {
      path: '/postcss.config.js',
      type: 'ts',
      description: 'PostCSS configuration for Tailwind',
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    },
    {
      path: '/app/layout.tsx',
      type: 'tsx',
      description: 'Root layout component',
      content: `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '{{PROJECT_NAME}}',
  description: 'Generated with Anything Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
`,
    },
    {
      path: '/app/page.tsx',
      type: 'tsx',
      description: 'Home page',
      content: `import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to {{PROJECT_NAME}}</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          Your Next.js application is ready to go
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="#"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="#"
            className="px-6 py-3 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Learn More
          </Link>
        </div>
      </div>
    </main>
  );
}
`,
    },
    {
      path: '/app/globals.css',
      type: 'css',
      description: 'Global styles',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #3b82f6;
  --color-secondary: #1f2937;
  --color-accent: #10b981;
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition;
  }

  .card {
    @apply bg-white dark:bg-slate-900 rounded-lg shadow-md p-6;
  }

  .input {
    @apply w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500;
  }
}
`,
    },
    {
      path: '/package.json',
      type: 'json',
      description: 'Package configuration',
      content: `{
  "name": "{{PROJECT_SLUG}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0-rc.1",
    "react-dom": "19.0.0-rc.1"
  },
  "devDependencies": {
    "@types/node": "20.15.1",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "4.0.0",
    "typescript": "5.7.0"
  }
}
`,
    },
  ],
  usage: 'Always use as base pattern for all Next.js projects',
  relatedPatterns: [],
};

// ============================================
// PATTERN 2: SHADCN/UI SETUP
// ============================================

export const SHADCN_SETUP_PATTERN: CodePattern = {
  id: 'shadcn-setup',
  name: 'Shadcn/UI Setup',
  description: 'Complete Shadcn/UI configuration with essential UI components',
  category: 'component',
  dependencies: {
    npm: [
      '@radix-ui/react-dialog@1.1.1',
      '@radix-ui/react-dropdown-menu@2.1.1',
      '@radix-ui/react-label@2.0.2',
      '@radix-ui/react-popover@1.0.7',
      '@radix-ui/react-slot@2.0.2',
      'class-variance-authority@0.7.0',
      'clsx@2.1.0',
      'cmdk@0.2.0',
      'react-hook-form@7.51.4',
      'tailwind-merge@2.3.0',
      'zod@3.22.4',
    ],
    patterns: [],
  },
  envVars: {
    required: [],
    optional: [],
  },
  files: [
    {
      path: '/components.json',
      type: 'json',
      description: 'Shadcn/UI configuration',
      content: `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "aliasPrefix": "@",
  "baseColor": "slate"
}
`,
    },
    {
      path: '/lib/utils.ts',
      type: 'ts',
      description: 'Utility functions for class merging',
      content: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
    },
    {
      path: '/components/ui/button.tsx',
      type: 'tsx',
      description: 'Button component',
      content: `import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
`,
    },
    {
      path: '/components/ui/input.tsx',
      type: 'tsx',
      description: 'Input component',
      content: `import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
`,
    },
    {
      path: '/components/ui/label.tsx',
      type: 'tsx',
      description: 'Label component',
      content: `'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
`,
    },
    {
      path: '/components/ui/form.tsx',
      type: 'tsx',
      description: 'Form components with React Hook Form integration',
      content: `'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Controller, FieldPath, FieldValues, FormProvider, useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: FieldValues) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: \`\${id}-form-item\`,
    formDescriptionId: \`\${id}-form-item-description\`,
    formMessageId: \`\${id}-form-item-message\`,
    ...fieldState,
  };
};

interface FormItemContextValue {
  id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    );
  }
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      htmlFor={formItemId}
      className={error ? 'text-destructive' : ''}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<Slot, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? \`\${formDescriptionId}\` : \`\${formDescriptionId} \${formMessageId}\`}
        aria-invalid={!!error}
        {...props}
      />
    );
  }
);
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <p
        ref={ref}
        id={formDescriptionId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : null;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn('text-sm font-medium text-destructive', className)}
        {...props}
      >
        {body}
      </p>
    );
  }
);
FormMessage.displayName = 'FormMessage';

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField };
`,
    },
  ],
  usage: 'Include when UI components are needed. Provides Button, Input, Label, and Form components',
  relatedPatterns: [],
};

// ============================================
// PATTERN 3: SUPABASE CLIENT SETUP
// ============================================

export const SUPABASE_CLIENT_PATTERN: CodePattern = {
  id: 'supabase-client',
  name: 'Supabase Client Setup',
  description: 'Supabase client initialization for browser and server usage',
  category: 'database',
  dependencies: {
    npm: ['@supabase/supabase-js@2.47.0', '@supabase/auth-helpers-nextjs@0.10.0'],
    patterns: [],
  },
  envVars: {
    required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    optional: [],
  },
  files: [
    {
      path: '/lib/supabase/client.ts',
      type: 'ts',
      description: 'Browser-safe Supabase client',
      content: `import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
`,
    },
    {
      path: '/lib/supabase/server.ts',
      type: 'ts',
      description: 'Server-side Supabase client for API routes and server actions',
      content: `import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The \`setAll\` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
`,
    },
    {
      path: '/lib/supabase/middleware.ts',
      type: 'ts',
      description: 'Supabase middleware for auth session refresh',
      content: `import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if needed
  await supabase.auth.getSession();

  return supabaseResponse;
}
`,
    },
    {
      path: '/.env.example',
      type: 'env',
      description: 'Environment variables template',
      content: `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`,
    },
  ],
  usage: 'Required for any database operations. Always use server client for sensitive operations',
  relatedPatterns: [],
};

// ============================================
// PATTERN 4: SUPABASE AUTHENTICATION
// ============================================

export const SUPABASE_AUTH_PATTERN: CodePattern = {
  id: 'supabase-auth',
  name: 'Supabase Authentication',
  description: 'Complete authentication system with login, signup, and protected routes',
  category: 'auth',
  dependencies: {
    npm: [
      '@supabase/supabase-js@2.47.0',
      '@supabase/auth-helpers-nextjs@0.10.0',
      'react-hook-form@7.51.4',
      'zod@3.22.4',
    ],
    patterns: ['supabase-client', 'shadcn-setup'],
  },
  envVars: {
    required: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    optional: [],
  },
  files: [
    {
      path: '/contexts/AuthContext.tsx',
      type: 'tsx',
      description: 'Auth context provider',
      content: `'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`,
    },
    {
      path: '/hooks/useAuth.ts',
      type: 'ts',
      description: 'Custom hook for auth operations',
      content: `'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthError {
  message: string;
  code?: string;
}

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = createClient();

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: \`\${window.location.origin}/auth/confirm\`,
      },
    });

    if (signUpError) {
      setError({ message: signUpError.message, code: signUpError.code });
      setLoading(false);
      return null;
    }

    setLoading(false);
    return data;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError({ message: signInError.message, code: signInError.code });
      setLoading(false);
      return null;
    }

    setLoading(false);
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError({ message: signOutError.message, code: signOutError.code });
    }

    setLoading(false);
  };

  return {
    signUp,
    signIn,
    signOut,
    loading,
    error,
  };
}
`,
    },
    {
      path: '/app/(auth)/login/page.tsx',
      type: 'tsx',
      description: 'Login page',
      content: `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthActions } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loading, error } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);

    if (result) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
`,
    },
    {
      path: '/app/(auth)/signup/page.tsx',
      type: 'tsx',
      description: 'Signup page',
      content: `'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthActions } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, loading, error } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordMatch(value === confirmPassword);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setPasswordMatch(password === value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordMatch) {
      return;
    }

    const result = await signUp(email, password);

    if (result) {
      router.push('/auth/confirm-email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create your account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error.message}</p>
            </div>
          )}

          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className="mt-1"
            />
            {!passwordMatch && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading || !passwordMatch}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
`,
    },
    {
      path: '/app/(auth)/layout.tsx',
      type: 'tsx',
      description: 'Auth layout wrapper',
      content: `export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
`,
    },
  ],
  usage: 'Include when authentication is needed. Provides login, signup, and auth context',
  relatedPatterns: ['supabase-client'],
};

// ============================================
// PATTERN 5: USER PROFILE TABLE WITH RLS
// ============================================

export const USER_PROFILE_TABLE_PATTERN: CodePattern = {
  id: 'user-profile-table',
  name: 'User Profile Table',
  description: 'Supabase user profiles table with RLS policies',
  category: 'database',
  dependencies: {
    npm: [],
    patterns: ['supabase-client'],
  },
  envVars: {
    required: [],
    optional: [],
  },
  files: [
    {
      path: '/supabase/migrations/001_user_profiles.sql',
      type: 'sql',
      description: 'Create user profiles table with RLS',
      content: `-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster queries
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS \$\$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
\$\$ LANGUAGE plpgsql;

-- Trigger activation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`,
    },
    {
      path: '/types/database.ts',
      type: 'ts',
      description: 'Generated types for database',
      content: `export type Profile = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  updated_at: string;
  created_at: string;
};

export type Tables = {
  public: {
    profiles: {
      Row: Profile;
      Insert: Omit<Profile, 'created_at' | 'updated_at'>;
      Update: Partial<Profile>;
    };
  };
};
`,
    },
  ],
  usage: 'Include when user authentication is needed. Creates profiles table with RLS policies',
  relatedPatterns: ['supabase-client'],
};

// ============================================
// PATTERN 6: DASHBOARD LAYOUT
// ============================================

export const DASHBOARD_LAYOUT_PATTERN: CodePattern = {
  id: 'dashboard-layout',
  name: 'Dashboard Layout',
  description: 'Complete dashboard layout with sidebar navigation and header',
  category: 'layout',
  dependencies: {
    npm: ['lucide-react@0.416.0'],
    patterns: ['supabase-auth', 'shadcn-setup'],
  },
  envVars: {
    required: [],
    optional: [],
  },
  files: [
    {
      path: '/components/layouts/Sidebar.tsx',
      type: 'tsx',
      description: 'Dashboard sidebar navigation',
      content: `'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthActions } from '@/hooks/useAuth';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { signOut } = useAuthActions();

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Logo</h1>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={\`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition \${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }\`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
`,
    },
    {
      path: '/components/layouts/Header.tsx',
      type: 'tsx',
      description: 'Dashboard header',
      content: `export function Header() {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard</h2>
      </div>
    </header>
  );
}
`,
    },
    {
      path: '/app/(dashboard)/layout.tsx',
      type: 'tsx',
      description: 'Dashboard root layout',
      content: `'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layouts/Sidebar';
import { Header } from '@/components/layouts/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
`,
    },
    {
      path: '/app/(dashboard)/dashboard/page.tsx',
      type: 'tsx',
      description: 'Dashboard home page',
      content: `'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back!</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          You're signed in as {user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Metric 1
          </h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No data yet</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Metric 2
          </h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No data yet</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Metric 3
          </h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No data yet</p>
        </div>
      </div>
    </div>
  );
}
`,
    },
    {
      path: '/app/(dashboard)/settings/page.tsx',
      type: 'tsx',
      description: 'User settings page',
      content: `'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [email] = useState(user?.email || '');

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your account preferences</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Account</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="mt-1"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Your email is managed by Supabase Auth
              </p>
            </div>

            <div>
              <Button variant="outline">Change Password</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`,
    },
  ],
  usage: 'Include for SaaS apps with user dashboards. Provides layout, sidebar, and protected routes',
  relatedPatterns: ['supabase-auth', 'shadcn-setup'],
};

// ============================================
// PATTERN 7: DATA TABLE COMPONENT
// ============================================

export const DATA_TABLE_PATTERN: CodePattern = {
  id: 'data-table',
  name: 'Data Table Component',
  description: 'Reusable data table with sorting, filtering, and pagination',
  category: 'component',
  dependencies: {
    npm: [
      '@tanstack/react-table@8.17.3',
      '@tanstack/match-sorter-utils@8.15.1',
      'lucide-react@0.416.0',
    ],
    patterns: ['shadcn-setup'],
  },
  envVars: {
    required: [],
    optional: [],
  },
  files: [
    {
      path: '/components/DataTable.tsx',
      type: 'tsx',
      description: 'Reusable data table component',
      content: `'use client';

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
}

export function DataTable<TData>({ columns, data, isLoading }: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white"
                >
                  {header.isPlaceholder ? null : (
                    <button
                      onClick={() => header.column.toggleSorting()}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">Loading...</p>
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">No data found</p>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
`,
    },
  ],
  usage: 'Include when displaying lists of data. Provides sorting and professional table UI',
  relatedPatterns: ['shadcn-setup'],
};

// ============================================
// PATTERN REGISTRY & HELPER FUNCTIONS
// ============================================

export const PATTERN_REGISTRY: Record<string, CodePattern> = {
  'nextjs-base': NEXTJS_BASE_PATTERN,
  'shadcn-setup': SHADCN_SETUP_PATTERN,
  'supabase-client': SUPABASE_CLIENT_PATTERN,
  'supabase-auth': SUPABASE_AUTH_PATTERN,
  'user-profile-table': USER_PROFILE_TABLE_PATTERN,
  'dashboard-layout': DASHBOARD_LAYOUT_PATTERN,
  'data-table': DATA_TABLE_PATTERN,
};

export const ALL_PATTERNS = [
  NEXTJS_BASE_PATTERN,
  SHADCN_SETUP_PATTERN,
  SUPABASE_CLIENT_PATTERN,
  SUPABASE_AUTH_PATTERN,
  USER_PROFILE_TABLE_PATTERN,
  DASHBOARD_LAYOUT_PATTERN,
  DATA_TABLE_PATTERN,
];

/**
 * Recursively resolve pattern dependencies
 * Returns patterns in order of dependencies (dependencies first)
 */
export function resolvePatternDependencies(patternIds: string[]): CodePattern[] {
  const resolved = new Map<string, CodePattern>();
  const visiting = new Set<string>();

  function visit(patternId: string): void {
    if (resolved.has(patternId)) return;
    if (visiting.has(patternId)) {
      console.warn(`Circular dependency detected: ${patternId}`);
      return;
    }

    visiting.add(patternId);

    const pattern = PATTERN_REGISTRY[patternId];
    if (!pattern) {
      console.warn(`Pattern not found: ${patternId}`);
      return;
    }

    // Visit dependencies first
    for (const depId of pattern.dependencies.patterns) {
      visit(depId);
    }

    resolved.set(patternId, pattern);
    visiting.delete(patternId);
  }

  for (const patternId of patternIds) {
    visit(patternId);
  }

  return Array.from(resolved.values());
}

/**
 * Merge patterns into a project file structure
 * Later patterns override earlier patterns for same file paths
 */
export function mergePatternsIntoProject(
  patterns: CodePattern[],
  variables: Record<string, string> = {}
) {
  const fileMap = new Map<string, CodePatternFile>();
  const allEnvVars: Record<'required' | 'optional', Set<string>> = {
    required: new Set(),
    optional: new Set(),
  };
  const allDependencies = new Set<string>();

  // Merge files and collect env vars
  for (const pattern of patterns) {
    for (const file of pattern.files) {
      let content = file.content;

      // Replace variables in content
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
      }

      fileMap.set(file.path, { ...file, content });
    }

    pattern.envVars.required.forEach((v) => allEnvVars.required.add(v));
    pattern.envVars.optional.forEach((v) => allEnvVars.optional.add(v));
    pattern.dependencies.npm.forEach((dep) => allDependencies.add(dep));
  }

  return {
    files: Array.from(fileMap.values()),
    envVars: {
      required: Array.from(allEnvVars.required),
      optional: Array.from(allEnvVars.optional),
    },
    dependencies: Array.from(allDependencies),
  };
}

/**
 * Determine patterns needed based on description and features
 */
export function determineRequiredPatterns(
  description: string,
  features?: string[]
): string[] {
  const text = (description + ' ' + (features?.join(' ') || '')).toLowerCase();
  const patterns = new Set<string>();

  // Always include base
  patterns.add('nextjs-base');
  patterns.add('shadcn-setup');

  // Determine other patterns based on keywords
  if (text.includes('auth') || text.includes('login') || text.includes('signup')) {
    patterns.add('supabase-client');
    patterns.add('supabase-auth');
    patterns.add('user-profile-table');
  }

  if (text.includes('dashboard') || text.includes('admin') || text.includes('manage')) {
    patterns.add('dashboard-layout');
  }

  if (
    text.includes('table') ||
    text.includes('list') ||
    text.includes('data') ||
    text.includes('manage')
  ) {
    patterns.add('data-table');
  }

  if (!patterns.has('supabase-client') && patterns.size > 2) {
    // Add supabase client if any data-heavy pattern is included
    patterns.add('supabase-client');
  }

  return Array.from(patterns);
}
