# GitHub Actions Configuration

## CI/CD Pipeline (`ci.yml`)

The consolidated CI/CD workflow handles:

1. **Model Updates** - Fetches latest AI models on push to master/main
2. **Testing** - Runs tests, linting, and type checking
3. **Deployment** - Deploys to Cloudflare Pages on successful builds

## Required Secrets

To enable full CI/CD functionality, add these secrets to your GitHub repository:

### For AI Model Updates

- `XAI_API_KEY` - Your xAI API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `GOOGLE_API_KEY` - Your Google AI API key

### For Cloudflare Deployment

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### For Authentication (Optional for Build)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (optional)
- `CLERK_SECRET_KEY` - Clerk secret key (optional)

## Workflow Features

- **Automatic model updates** on push to master/main
- **Matrix testing** with Node.js 18.x and 20.x
- **Smart deployment** only on successful tests
- **Skip CI** support with `[skip ci]` in commit messages
- **Manual trigger** option via workflow dispatch
- **Weekly model updates** via cron schedule

## Permissions

The workflow has `contents: write` permission to allow the GitHub Actions bot to commit model updates.

## Note on Build Process

The application is configured to build successfully even without authentication keys.
When Clerk keys are not provided:

- Authentication features will be disabled
- The app will show guest mode
- All pages will still render correctly

This allows the CI/CD pipeline to run without requiring sensitive keys during the build phase.
