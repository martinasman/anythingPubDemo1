# Anything

A powerful AI-powered code generation platform that creates complete web applications from natural language descriptions.

## Features

### 🎨 Intelligent Generation

- **Dual-mode generation**: Automatically detects whether you need a simple HTML landing page or a full-stack SaaS application
- **Natural language input**: Describe what you want to build, AI handles the rest
- **Pattern-based architecture**: Combines reusable code patterns with AI generation for consistency

### 🚀 Full-Stack Next.js Generation

Generate complete, production-ready Next.js applications with:

- **TypeScript** - Strict mode enabled throughout
- **Supabase Integration** - PostgreSQL database with RLS policies
- **Authentication** - Email/password auth, user profiles, protected routes
- **Shadcn/UI** - Beautiful, accessible React components
- **Tailwind CSS** - Responsive, utility-first styling
- **Database Migrations** - Automated schema setup with SQL migrations
- **TypeScript Types** - Fully typed database operations

### 📄 Single-File HTML Generation

Create beautiful landing pages with:
- Responsive design
- Smooth animations
- Modern UI components
- Ready to deploy

### 📁 Interactive File Editor

- **File Tree Navigation** - Browse all generated files hierarchically
- **Syntax Highlighting** - Language-specific highlighting for all file types
- **Code Preview** - View generated code with proper formatting
- **Database Schema Viewer** - See and manage SQL migrations

### 📦 Easy Export

- **ZIP Downloads** - Complete project archives ready to run locally
- **Auto-generated Docs** - README with setup instructions included
- **Environment Configuration** - .env.example template with all required variables

## Getting Started with Anything

### Basic Usage

1. **Open the platform** and start chatting
2. **Describe your project** naturally:
   - "Create a landing page for a coffee shop"
   - "Build a SaaS task management app with user authentication"
3. **Preview and edit** - See files, code, and database schema
4. **Download and deploy** - Export complete project and run locally

### Example Requests

**HTML Mode:**
```
"Create a landing page for a gym with pricing and contact form"
"Build a portfolio website showcasing my projects"
```

**Next.js Mode:**
```
"Build a SaaS app where users can create and share notes"
"Create a project management dashboard with teams and permissions"
"Build a fitness app with workout logging and statistics"
```

## Project Structure

```
anything-v10/
├── src/
│   ├── app/                    # Next.js app router
│   ├── components/
│   │   ├── workspace/          # Editor components
│   │   │   ├── WebsiteEditorView.tsx
│   │   │   ├── FileTreeEditor.tsx
│   │   │   └── SchemaManager.tsx
│   │   └── editor/
│   │       └── CodeMirror.tsx
│   ├── config/
│   │   ├── codePatterns.ts     # Reusable code patterns
│   │   ├── agentPrompts.ts     # LLM system prompts
│   │   └── saasStarterExample.ts
│   ├── api/
│   │   ├── chat/               # Chat interface
│   │   └── tools/              # Code generation
│   ├── utils/
│   │   └── nextjsExport.ts     # ZIP export utilities
│   └── types/
│       └── database.ts         # TypeScript types
├── FULLSTACK_GENERATION_GUIDE.md  # User guide
├── DEVELOPER_GUIDE.md             # Developer documentation
└── README.md                       # This file
```

## Documentation

- **[FULLSTACK_GENERATION_GUIDE.md](./FULLSTACK_GENERATION_GUIDE.md)** - Complete user guide for generated projects
  - How to use generated projects
  - Setup instructions
  - Project structure explanation
  - Authentication and database access
  - Deployment guides
  - Troubleshooting

- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Technical documentation for developers
  - Architecture overview
  - Component descriptions
  - Data flow diagrams
  - Testing checklist
  - Adding new patterns
  - Performance considerations

## Technology Stack

### Core
- [Next.js 15](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [React 19](https://react.dev) - UI library

### Database & Backend
- [Supabase](https://supabase.com) - PostgreSQL + Auth
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) - Data protection

### UI & Styling
- [Shadcn/UI](https://ui.shadcn.com) - Component library
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Lucide Icons](https://lucide.dev) - Icons

### Development
- [CodeMirror](https://codemirror.net) - Code editor
- [JSZip](https://github.com/Stuk/jszip) - ZIP creation
- [OpenRouter API](https://openrouter.ai) - LLM access
- [Google Gemini 3 Pro](https://ai.google.dev) - Code generation

## Code Patterns

The platform uses a library of reusable code patterns:

1. **nextjs-base** - Next.js project foundation
2. **shadcn-setup** - UI component library setup
3. **supabase-client** - Database client configuration
4. **supabase-auth** - Complete authentication system
5. **user-profile-table** - User data schema
6. **dashboard-layout** - Dashboard UI shell
7. **data-table** - Reusable data table component

Patterns are intelligently combined based on your request and can be extended with custom code generated by AI.

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone <repository>
cd anything-v10

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production server
npm run lint     # Run ESLint
```

## How It Works

### Generation Pipeline

```
User Request
    ↓
Mode Detection (HTML vs Next.js)
    ↓
Pattern Selection
    ↓
LLM-Guided Code Generation
    ↓
Pattern + Generated Code Merge
    ↓
File Finalization
    ↓
Supabase Storage
    ↓
Display in Editor
```

### Mode Detection

The system analyzes your request for keywords:
- **Full-Stack signals**: "SaaS", "dashboard", "login", "database", "users"
- **HTML signals**: "landing page", "portfolio", "website", "marketing"
- **Default**: HTML (safer for ambiguous requests)

### Pattern Composition

Selected patterns are automatically combined with:
- Dependency resolution (ensures all dependencies are included)
- File merging (LLM customizations take precedence)
- Variable substitution (personalizes code with your project details)

## API Reference

### Generate Website Files

Endpoint: `POST /api/tools/tool-code.ts`

Parameters:
```typescript
{
  businessDescription: string;      // What you're building
  mode?: 'html' | 'nextjs';        // Generation mode (auto-detected if omitted)
  features?: string[];              // Specific features
  identity?: {                       // Brand information
    businessName?: string;
    tagline?: string;
  };
  marketResearch?: {                 // Market context
    targetAudience?: string;
    competitors?: string[];
  };
}
```

Response:
```typescript
{
  files: Array<{
    path: string;       // File location
    content: string;    // File contents
    type: string;       // File type (tsx, sql, etc.)
  }>;
  primaryPage: string;  // Main entry point
  appType?: 'html' | 'nextjs';
  metadata?: {
    patterns?: string[];
    envVars?: { required: string[]; optional: string[] };
    setupInstructions?: string;
  };
}
```

## Examples

### Minimal HTML Request

```
"Create a landing page for a bakery"
```

Response: Single HTML file with hero, products, and contact form

### Full-Stack Request

```
"Build a SaaS app for collaborative note-taking with teams"
```

Response: 30+ files including:
- Next.js app structure
- Authentication system
- User & team database tables
- Dashboard with sidebar navigation
- Team management pages
- Note creation and sharing
- All necessary configurations

## Performance

- **HTML generation**: ~10-15 seconds
- **Next.js generation**: ~30-60 seconds
- **File tree rendering**: <100ms
- **Code syntax highlighting**: <50ms

## Security

- ✅ TypeScript strict mode on all generated code
- ✅ Row-level security (RLS) policies on all database tables
- ✅ No service keys exposed in frontend code
- ✅ Environment variables templated, not committed
- ✅ XSS prevention through React's built-in escaping
- ✅ CSRF protection for API routes

## Contributing

Contributions are welcome! Areas for enhancement:

- Additional code patterns
- More generation templates
- UI/UX improvements
- Documentation
- Bug fixes

## Learning Resources

- [Full-Stack Generation Guide](./FULLSTACK_GENERATION_GUIDE.md) - For using generated projects
- [Developer Guide](./DEVELOPER_GUIDE.md) - For contributing to Anything
- [Next.js Docs](https://nextjs.org/docs) - Framework reference
- [Supabase Docs](https://supabase.com/docs) - Database reference
- [Shadcn/UI](https://ui.shadcn.com) - Component library

## License

[Your License Here]

## Support

For issues, questions, or feedback:
- Check the [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for technical issues
- Check the [FULLSTACK_GENERATION_GUIDE.md](./FULLSTACK_GENERATION_GUIDE.md) for usage questions
- Open an issue on GitHub
- Contact the team
