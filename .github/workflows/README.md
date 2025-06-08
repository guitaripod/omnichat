# GitHub Actions Configuration

## Required Secrets

To enable full CI/CD functionality, add these secrets to your GitHub repository:

### For Cloudflare Deployment

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### For Authentication (Optional for Build)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (optional)
- `CLERK_SECRET_KEY` - Clerk secret key (optional)

## Note on Build Process

The application is configured to build successfully even without authentication keys.
When Clerk keys are not provided:

- Authentication features will be disabled
- The app will show guest mode
- All pages will still render correctly

This allows the CI/CD pipeline to run without requiring sensitive keys during the build phase.
