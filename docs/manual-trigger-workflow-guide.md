# How to Manually Trigger the Update Models Workflow

This guide shows you how to manually trigger the `update-models.yml` workflow from the GitHub Actions tab.

## Step 1: Navigate to the Actions Tab

1. Go to your GitHub repository (omnichat)
2. Click on the **Actions** tab in the top navigation bar

```
┌─────────────────────────────────────────────────────────────────┐
│ <> Code  🔀 Pull requests  ⚠️ Issues  ▶️ Actions  📊 Projects  │
│                                        ^^^^^^^^                  │
└─────────────────────────────────────────────────────────────────┘
```

## Step 2: Select the Update AI Models Workflow

Once in the Actions tab, you'll see a list of workflows on the left sidebar:

```
┌─────────────────────────────────────────────────────────────────┐
│ All workflows                                                    │
│ ─────────────                                                   │
│ 📋 Deploy to Cloudflare                                         │
│ 🔄 Update AI Models          <── Click this one                │
│ ✅ Run Tests                                                    │
└─────────────────────────────────────────────────────────────────┘
```

Click on **"Update AI Models"** to select this workflow.

## Step 3: Use the "Run workflow" Button

After selecting the workflow, you'll see the workflow runs page:

```
┌─────────────────────────────────────────────────────────────────┐
│ Update AI Models                                                 │
│                                                                  │
│ This workflow runs on schedule and workflow_dispatch             │
│                                                                  │
│ ┌────────────────┐                                              │
│ │ Run workflow ▼ │  <── Click this button                      │
│ └────────────────┘                                              │
│                                                                  │
│ Workflow runs                                                    │
│ ─────────────                                                   │
└─────────────────────────────────────────────────────────────────┘
```

1. Click the **"Run workflow"** button (it has a dropdown arrow)
2. A dropdown menu will appear:

```
┌─────────────────────────────────────────────────────────────────┐
│ Use workflow from                                                │
│ ┌─────────────────────────┐                                    │
│ │ Branch: main         ▼  │                                    │
│ └─────────────────────────┘                                    │
│                                                                  │
│ ┌─────────────────────────┐                                    │
│ │    Run workflow         │  <── Click to trigger              │
│ └─────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

3. Select the branch (usually `main` or `master`)
4. Click the green **"Run workflow"** button

## Step 4: What to Expect After Triggering

After clicking "Run workflow", you'll see:

### Immediate Feedback

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Workflow run was successfully requested.                     │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow Progress

The workflow will appear in the runs list with a yellow circle (in progress):

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟡 Update AI Models - Manual trigger                            │
│    #42 · Triggered by @yourusername · now                      │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow Steps

Click on the workflow run to see detailed progress:

```
┌─────────────────────────────────────────────────────────────────┐
│ update-models                                                    │
│ ├─ ✅ Set up job                                               │
│ ├─ ✅ Checkout repository                                      │
│ ├─ ✅ Set up Go                                                │
│ ├─ 🟡 Fetch AI models           <── Currently running          │
│ ├─ ⏸️  Check if models changed                                 │
│ ├─ ⏸️  Commit and push if changed                              │
│ └─ ⏸️  Trigger deployment                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Completion States

**Success** (green checkmark):

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Update AI Models - Manual trigger                            │
│    #42 · Triggered by @yourusername · 2 minutes ago            │
└─────────────────────────────────────────────────────────────────┘
```

**Failure** (red X):

```
┌─────────────────────────────────────────────────────────────────┐
│ ❌ Update AI Models - Manual trigger                            │
│    #42 · Triggered by @yourusername · 2 minutes ago            │
└─────────────────────────────────────────────────────────────────┘
```

## What the Workflow Does

When triggered, the workflow will:

1. **Fetch latest AI models** from OpenAI, Google, and xAI APIs
2. **Update the models list** in `scripts/available-models.json`
3. **Commit changes** if any models were added/updated
4. **Trigger deployment** automatically if changes were made

## Troubleshooting

### "Run workflow" button not visible

- Make sure you have write permissions to the repository
- Check that you're on the correct workflow page

### Workflow fails

- Check the logs by clicking on the failed workflow run
- Common issues:
  - Missing API keys in repository secrets
  - API rate limits
  - Network connectivity issues

### No changes detected

- This is normal if the AI providers haven't added new models
- The workflow will complete successfully without making commits

## Required Secrets

For the workflow to run successfully, these secrets must be set in your repository:

- `XAI_API_KEY` - Your xAI API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_API_KEY` - Your Google AI API key

To add secrets:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each required secret

## Automatic Schedule

Note: This workflow also runs automatically every Sunday at 00:00 UTC. Manual triggering is useful when you need immediate updates.
