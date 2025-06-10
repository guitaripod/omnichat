# AI Models Fetcher

A Go script to fetch available models from various AI providers (XAI, OpenAI, Anthropic, and Google).

## Usage

### Manual Run

1. Set your API keys as environment variables:

   ```bash
   export XAI_API_KEY="your-xai-api-key"
   export OPENAI_API_KEY="your-openai-api-key"
   export ANTHROPIC_API_KEY="your-anthropic-api-key"
   export GOOGLE_API_KEY="your-google-api-key"
   ```

2. Run the script:

   ```bash
   cd scripts
   go run fetch-models.go
   ```

3. The script will create an `available-models.json` file with all fetched models.

### GitHub Actions Workflow

The repository includes a GitHub Actions workflow that:

1. Runs weekly (Sundays at 00:00 UTC) or on manual trigger
2. Fetches models using API keys stored in GitHub Secrets
3. Commits the updated `available-models.json` if changes are detected
4. Can trigger a deployment workflow after updating

To set up:

1. Add your API keys as GitHub Secrets:
   - `XAI_API_KEY`
   - `OPENAI_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_API_KEY`
2. The workflow will run automatically

## Integration with OmniChat

The fetched models are imported at build time in the application:

- Models are stored in `scripts/available-models.json`
- TypeScript imports this JSON via `src/lib/ai/available-models.ts`
- Model selector shows static models when API keys are configured
- This avoids runtime API calls for model discovery

## Notes

- The script will skip providers if their API keys are not set
- All providers now fetch models from their respective APIs
- The output file includes a timestamp of when the models were fetched
- Models are organized by provider in the JSON output

## Output Format

```json
{
  "xai": [...],
  "openai": [...],
  "anthropic": [...],
  "google": [...],
  "updatedAt": "2025-01-06T..."
}
```
