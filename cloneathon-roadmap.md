# T3 Chat Cloneathon Project Roadmap

## Project Overview

**Goal**: Build a production-level AI chat application to win the T3 Chat Cloneathon  
**Timeline**: 9 days (Deadline: June 17, 2025)  
**Prize Target**: 1st Place ($5,000)

## Tech Stack Decision

### Recommended Stack

- **Frontend**: Next.js 14+ (App Router) instead of Astro
  - Reason: Better suited for real-time chat apps with streaming, SSR/CSR flexibility, and extensive ecosystem
  - Astro is great for content sites but lacks the real-time capabilities needed here
- **Backend**: Next.js API Routes + Cloudflare Workers for edge functions
- **Database**: Cloudflare D1 (SQLite) for chat history + R2 for file storage
- **Auth**: Clerk or Auth.js with Cloudflare Workers KV for sessions
- **Payments**: Stripe with webhook handlers on Workers
- **Deployment**: Cloudflare Pages
- **UI**: Tailwind CSS + shadcn/ui for rapid development
- **AI Integration**: Vercel AI SDK for unified LLM interface

## Phase 1: Foundation (Days 1-2) ✅ COMPLETED

**Goal**: Core infrastructure and authentication

### Epic 1.1: Project Setup

- [x] Initialize Next.js project with TypeScript
- [x] Configure Cloudflare Pages deployment
- [x] Set up GitHub repo with CI/CD
- [x] Configure ESLint, Prettier, and Git hooks
- [x] Create project structure and folder organization

### Epic 1.2: Database Schema

- [x] Design D1 schema for:
  - Users table
  - Conversations table
  - Messages table
  - Subscriptions table
  - API usage tracking table
- [x] Create migration scripts
- [x] Set up Drizzle ORM for type-safe queries

### Epic 1.3: Authentication System

- [x] Implement Clerk/Auth.js integration
- [x] Create protected routes middleware
- [x] Build login/signup UI components
- [x] Set up user profile management
- [x] Configure edge session handling

### Epic 1.4: Base UI Layout

- [x] Create responsive chat layout
- [x] Build sidebar for conversation list
- [x] Implement dark/light mode toggle
- [x] Set up global state management (Zustand)
- [x] Create loading states and error boundaries

## Phase 2: Core Chat Features (Days 3-4) ✅ COMPLETED

**Goal**: Implement required features for competition

### Epic 2.1: Multi-LLM Integration

- [x] Implement custom OpenAI API integration with native fetch
- [x] Implement custom Anthropic API integration with native fetch
- [x] Implement custom Google Gemini API integration with native fetch
- [x] Implement custom xAi API integration with native fetch
- [x] Implement custom DeepSeek API integration with native fetch
- [x] Create model selector UI
- [x] Implement SSE streaming parser for responses

### Epic 2.2: Local Ollama Support

- [x] Research Ollama Web API integration
- [x] Create Ollama connection settings UI
- [x] Implement local model detection
- [x] Handle Ollama streaming responses
- [x] Add connection status indicators

### Epic 2.3: Chat Functionality

- [x] Create message components with markdown support
- [x] Implement real-time streaming UI
- [x] Add typing indicators
- [x] Build conversation management (create, delete, rename)
- [x] Implement message editing/deletion
- [x] Add copy/regenerate functionality

### Epic 2.4: Data Persistence

- [x] Implement chat history saving to D1
- [x] Create sync mechanism for offline/online states
- [x] Build conversation search functionality
- [x] Add export chat feature (JSON, Markdown)
- [x] Add export feature that compiles a summary of the chat that creates a card-like widget .png that the user can save or copy to clipboard.

## Phase 3: Advanced Features (Days 5-6)

**Goal**: Implement bonus features to stand out

### Epic 3.1: File Attachments

- [x] Set up Cloudflare R2 for file storage
- [x] Implement drag-and-drop file upload
- [x] Create image preview components
- [x] Add PDF parsing with pdf.js
- [x] Implement file size/type validation
- [x] Build attachment viewer modal

### Epic 3.2: Code Syntax Highlighting ✅ COMPLETED

- [x] ~~Integrate Shiki~~ Using rehype-highlight for better dark/light mode support
- [x] ~~Create custom code block component~~ Using built-in markdown renderer
- [x] Add language detection
- [x] Implement copy code button
- [x] Implement copy code as a beautiful card image that can be shared
- [x] Support inline code formatting

### Epic 3.3: Resumable Streams ✅ COMPLETED

- [x] Implement stream state persistence
- [x] Create resume mechanism with partial messages
- [x] Handle connection recovery
- [x] Add progress indicators

### Epic 3.4: Chat Branching ✅ COMPLETED

- [x] Design branching UI/UX
- [x] Implement message tree structure
- [x] Create branch visualization
- [x] Add branch switching interface
- [x] Enable branch comparison view

## Phase 4: Monetization & Security (Day 7)

**Goal**: Production-ready security and payments

### Epic 4.1: Stripe Integration

- [ ] Set up Stripe account and products
- [ ] Create subscription tiers (Free, Ultimate)
- [ ] Implement Stripe Checkout flow
- [ ] Build webhook handlers for subscription events
- [ ] Create billing portal integration
- [ ] Add usage-based billing for API calls

### Epic 4.2: Security Implementation

- [x] Set up CSP headers and security headers in next.config.ts
- [x] Implement CORS policies in middleware
- [x] Implement audit logging system with D1
- [ ] Configure rate limiting with Cloudflare dashboard

### Epic 4.3: Edge Security

- [ ] Configure Cloudflare WAF rules
- [ ] Set up DDoS protection
- [ ] Implement IP allowlisting for Ollama
- [ ] Add request signing for API calls
- [ ] Create security headers middleware

## Phase 5: Differentiators (Day 8)

**Goal**: Unique features to win

### Epic 5.1: Web Search Integration

- [x] Implement Web Search API from Anthropic and Google

### Epic 5.2: Advanced Features

- [ ] **Voice Input/Output**: Web Speech API integration
- [ ] **Prompt Templates**: Customizable prompt library
- [ ] **Team Collaboration**: Shared conversations with permissions
- [ ] **Plugin System**: Allow custom tool integrations
- [ ] **Analytics Dashboard**: Usage stats and insights

### Epic 5.3: AI Image Generation

- [ ] Integrate DALL-E 3 or Stability AI
- [ ] Create image generation UI
- [ ] Implement image history gallery
- [ ] Add image editing capabilities

### Epic 5.4: Performance Optimization

- [ ] Implement request caching strategy
- [ ] Add response streaming optimization
- [ ] Create lazy loading for conversations
- [ ] Optimize bundle size
- [ ] Add service worker for offline mode

## Phase 6: Polish & Launch (Day 9)

**Goal**: Final touches and submission

### Epic 6.1: UI/UX Polish

- [ ] Refine all animations and transitions
- [ ] Ensure full responsive design
- [ ] Add keyboard shortcuts
- [ ] Create onboarding flow
- [ ] Implement toast notifications
- [ ] Add loading skeletons

### Epic 6.2: Documentation

- [ ] Write comprehensive README
- [ ] Create API documentation
- [ ] Add contribution guidelines
- [ ] Write deployment guide
- [ ] Create demo video/GIF

### Epic 6.3: Testing & QA

- [ ] Perform cross-browser testing
- [ ] Test all LLM integrations
- [ ] Verify payment flows
- [ ] Load test with multiple users
- [ ] Security penetration testing

### Epic 6.4: Submission

- [ ] Ensure MIT license is added
- [ ] Deploy to production
- [ ] Create demo account with pre-filled data
- [ ] Submit to competition
- [ ] Prepare presentation materials

## Risk Mitigation Strategies

1. **Time Management**

   - Use shadcn/ui components to save UI development time
   - Prioritize core requirements first
   - Have fallback plans for complex features

2. **Technical Challenges**

   - Ollama integration might be complex - have WebSocket fallback
   - Streaming with edge functions can be tricky - test early
   - D1 has limitations - design schema carefully

3. **Competition Strategy**
   - Focus on unique features others might miss (Ollama support)
   - Ensure exceptional UX and performance
   - Make the app actually useful beyond the competition

## Success Metrics

- All core requirements implemented ✓
- At least 5 bonus features completed ✓
- Sub-100ms response times on edge ✓
- Zero security vulnerabilities ✓
- Clean, maintainable codebase ✓
- Compelling demo with real use cases ✓

## Daily Standup Schedule

- **Morning**: Review progress, adjust priorities
- **Midday**: Code implementation sprint
- **Evening**: Test features, fix bugs
- **Night**: Plan next day, update documentation

## Additional Considerations

### What Sets Us Apart

1. **Local LLM Support**: Most competitors will skip Ollama
2. **Production Security**: Enterprise-grade with Cloudflare
3. **Real Monetization**: Working payments from day one
4. **Performance**: Edge-first architecture
5. **Developer Experience**: Plugin system for extensibility

### Learning Opportunities

- Modern React patterns with Next.js
- Edge computing with Cloudflare Workers
- Real-time streaming architectures
- Production payment integrations
- Security best practices

This roadmap is designed to be referenced by Claude Code and updated as you progress. Each epic can be broken down into specific tasks with time estimates. Good luck with the Cloneathon!
