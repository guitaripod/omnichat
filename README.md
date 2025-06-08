# OmniChat

AI chat application featuring multi-LLM support, local Ollama integration, and advanced chat features.

## 🏗️ Architecture

![OmniChat Technical Architecture](./docs/images/architecture.png)

OmniChat is built on Cloudflare's edge infrastructure for global low-latency performance. The application leverages a modern stack with Next.js for the frontend, Cloudflare Workers for edge computing, and D1 SQLite for data persistence.

## Features

### Core Features

- **Multi-LLM Support**: Chat with OpenAI, Anthropic, Google Gemini, and local Ollama models
- **Real-time Streaming**: Fast, responsive AI conversations with streaming responses
- **Persistent Chat History**: Save and search through your conversation history
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Dark/Light Mode**: Toggle between themes for comfortable usage

### Advanced Features

- **File Attachments**: Upload and discuss images, PDFs, and documents
- **Code Syntax Highlighting**: Beautiful code blocks with language detection
- **Chat Branching**: Explore different conversation paths
- **Voice Input/Output**: Speak to AI and hear responses back
- **Resumable Streams**: Continue interrupted conversations seamlessly
- **Export Conversations**: Download chats as JSON or Markdown

## Tech Stack

- **Frontend**: Next.js 14+ with App Router and TypeScript
- **Backend**: Cloudflare Workers for edge functions
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for file attachments
- **Authentication**: Clerk for user management
- **Payments**: Stripe integration for subscriptions
- **Deployment**: Cloudflare Pages
- **UI**: Tailwind CSS with shadcn/ui components
- **AI Integration**: Vercel AI SDK for unified LLM interface & Ollama

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare account (for deployment)
- API keys for AI providers (OpenAI, Anthropic, etc.)

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Local Development with Ollama

1. Install Ollama locally
2. Pull a model: `ollama pull llama3.1`
3. Start Ollama server: `ollama serve`
4. The app will automatically detect local Ollama models

### Deployment

```bash
# Deploy to Cloudflare Pages
wrangler deploy

# Set up environment variables
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put CLERK_SECRET_KEY
```

## Environment Variables

Set these using `wrangler secret put <KEY>`:

- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `CLERK_SECRET_KEY` - Clerk authentication
- `STRIPE_SECRET_KEY` - Stripe payments

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── chat/           # Chat-specific components
│   ├── layout/         # Layout components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
├── services/           # External service integrations
├── store/              # State management
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test them
4. Run `npm run typecheck` and `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
