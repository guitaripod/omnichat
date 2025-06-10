#!/bin/bash

# Create .env.local for development mode
cat > .env.local << EOF
# Development mode - skips authentication
NEXT_PUBLIC_DEV_MODE=true
EOF

echo "✅ Created .env.local with dev mode enabled"
echo ""
echo "To start development:"
echo "1. Make sure Ollama is running: ollama serve"
echo "2. Start the dev server: npm run dev"
echo "3. Open http://localhost:3000/chat"
echo ""
echo "No authentication required in dev mode!"
echo "Ollama will be available at http://localhost:11434"