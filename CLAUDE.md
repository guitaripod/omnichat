# OmniChat - Claude Development Guide

See `cloneathon-roadmap.md` for detailed feature roadmap and timeline.

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript checks
npm run test            # Run tests (if configured)

# Cloudflare Wrangler
wrangler dev            # Local development with Workers
wrangler deploy         # Deploy to Cloudflare
wrangler d1 execute     # Run D1 database commands
wrangler r2 bucket list # Manage R2 storage
```

# Git Practices

- Make sure everything is working after completing tasks
- Do Git properly by committing individual tasks after every task
- Do not move to the next task before the previous one is committed

# Environment & Configuration

- **NEVER use .env files** - use Cloudflare secrets and wrangler commands
- Store API keys in Cloudflare Workers KV or environment variables
- Use `wrangler secret put <KEY>` to set secrets
- Only ask for API keys when absolutely required for external services

# Code Style

- TypeScript strict mode enabled
- Use ES modules and destructured imports
- Prefer React Server Components over Client Components
- Use Tailwind CSS for styling with shadcn/ui components
- Follow Next.js App Router patterns

# Database Operations

- Use Drizzle ORM for type-safe queries
- Run migrations with `wrangler d1 migrations apply`
- Schema changes go through proper migration files
- Prefer edge-compatible database operations

# Testing & Quality

- Run `npm run typecheck` after code changes
- Use `npm run lint` to check code style
- Prefer running focused tests over full test suite
- Test streaming responses and edge function behavior
- Do proper unit test coverage

# Security Practices

- Never commit API keys or secrets
- Use Cloudflare's security features (WAF, rate limiting)
- Implement proper CORS policies
- Sanitize user inputs before database operations
- Use CSP headers and security middleware

# Performance Guidelines

- Optimize for edge deployment
- Use streaming responses for AI interactions
- Implement proper loading states
- Lazy load conversations and components
- Monitor bundle size and Core Web Vitals

# Development Workflow

1. Always run typecheck after making changes
2. Test in both local and edge environments
3. Use wrangler commands for Cloudflare operations
4. Focus on core competition requirements first
5. Implement bonus features systematically
6. Make a good GitHub workflow system. Test locally before pushing to GitHub.
