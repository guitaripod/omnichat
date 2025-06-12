# AI Provider Pricing Analysis - OmniChat

_Last Updated: December 6, 2025_

## Provider Pricing Overview

### OpenAI

| Model          | Input ($/1M tokens) | Output ($/1M tokens) | Notes                    |
| -------------- | ------------------- | -------------------- | ------------------------ |
| GPT-4.1        | $2.00               | $8.00                | Most capable             |
| GPT-4.1 mini   | $0.40               | $1.60                | Balanced performance     |
| GPT-4.1 nano   | $0.10               | $0.40                | Fast & cheap             |
| OpenAI o3      | $2.00               | $8.00                | Advanced reasoning       |
| OpenAI o4-mini | $1.10               | $4.40                | Cost-efficient reasoning |
| GPT-image-1    | $5.00 (text)        | $0.01-0.17/image     | Image generation         |

### Anthropic

| Model            | Input ($/1M tokens) | Output ($/1M tokens) | Notes        |
| ---------------- | ------------------- | -------------------- | ------------ |
| Claude Opus 4    | $15.00              | $75.00               | Most capable |
| Claude Sonnet 4  | $3.00               | $15.00               | Balanced     |
| Claude Haiku 3.5 | $0.80               | $4.00                | Fast & cheap |

### Google

| Model            | Input ($/1M tokens) | Output ($/1M tokens) | Notes                 |
| ---------------- | ------------------- | -------------------- | --------------------- |
| Gemini 2.5 Flash | $0.15               | $0.60                | Preview               |
| Gemini 2.0 Flash | $0.10               | $0.40                | Image gen: $0.039/img |
| Gemini 1.5 Pro   | $1.25-2.50          | $5.00-10.00          | Based on context      |
| Gemini 1.5 Flash | $0.075-0.15         | $0.30-0.60           | Based on context      |

### xAI

| Model            | Input ($/1M tokens) | Output ($/1M tokens) | Notes         |
| ---------------- | ------------------- | -------------------- | ------------- |
| Grok 3           | $3.00               | $15.00               | Standard      |
| Grok 3 Fast      | $5.00               | $25.00               | Premium speed |
| Grok 3 Mini      | $0.30               | $0.50                | With thinking |
| Grok 3 Mini Fast | $0.60               | $4.00                | Fast mini     |

### DeepSeek

| Model                      | Input ($/1M tokens) | Output ($/1M tokens) | Notes              |
| -------------------------- | ------------------- | -------------------- | ------------------ |
| DeepSeek-chat              | $0.27               | $1.10                | Cache miss         |
| DeepSeek-chat (cached)     | $0.07               | $1.10                | Cache hit          |
| DeepSeek-reasoner          | $0.55               | $2.19                | Advanced reasoning |
| DeepSeek-reasoner (cached) | $0.14               | $2.19                | Cache hit          |
| \*Off-peak pricing         | 50-75% OFF          | 50-75% OFF           | UTC 16:30-00:30    |

## Cost Analysis for OmniChat Users

### Average Token Usage Patterns

- **Casual User**: ~50K tokens/month (20K input, 30K output)
- **Regular User**: ~500K tokens/month (200K input, 300K output)
- **Power User**: ~5M tokens/month (2M input, 3M output)
- **Professional**: ~20M tokens/month (8M input, 12M output)

### Monthly Cost Projections by Model

#### Budget Models (Best Value)

- **DeepSeek-chat (cached)**: $0.04-$1.80/month for casual to power users
- **GPT-4.1 nano**: $0.02-$1.60/month
- **Gemini 1.5 Flash**: $0.02-$2.25/month

#### Mid-Tier Models

- **GPT-4.1 mini**: $0.06-$6.40/month
- **Grok 3 Mini**: $0.02-$2.50/month
- **Claude Haiku 3.5**: $0.13-$13.20/month

#### Premium Models

- **GPT-4.1**: $0.28-$28.00/month
- **Claude Sonnet 4**: $0.51-$51.00/month
- **Grok 3**: $0.51-$51.00/month

#### Top-Tier Models

- **Claude Opus 4**: $2.55-$255.00/month
- **OpenAI o3**: $0.28-$28.00/month (reasoning)

## Recommended OmniChat Subscription Tiers

### Free Tier

- **Monthly Allowance**: $2 worth of API credits
- **Estimated Usage**: ~100K tokens with budget models
- **Models**: Access to all budget models (nano, flash, mini variants)
- **Features**: Basic chat, 7-day history retention
- **Target**: Casual users, trial users

### Pro Tier - $9.99/month

- **Monthly Allowance**: $15 worth of API credits
- **Estimated Usage**: ~1M tokens with mid-tier models
- **Models**: All models including GPT-4.1, Claude Sonnet, Grok 3
- **Features**:
  - Unlimited conversation history
  - File attachments (10MB limit)
  - Image generation (50/month)
  - Priority support
- **Target**: Regular users, students, hobbyists

### Ultimate Tier - $49.99/month

- **Monthly Allowance**: $100 worth of API credits
- **Estimated Usage**: ~10M tokens with premium models
- **Models**: All models including Claude Opus 4, o3 reasoning
- **Features**:
  - Everything in Pro
  - File attachments (100MB limit)
  - Unlimited image generation
  - API access
  - Team collaboration (3 seats)
  - Custom prompts/templates
  - Advanced analytics
- **Target**: Professionals, businesses, power users

### Enterprise - Custom Pricing

- **Custom credit allocation**
- **Volume discounts**
- **Dedicated support**
- **SSO/SAML integration**
- **Custom model fine-tuning**
- **SLA guarantees**

## Pricing Strategy Rationale

1. **Margin Analysis**:

   - Free Tier: Loss leader to attract users
   - Pro Tier: 40-50% margin after API costs
   - Ultimate Tier: 50-60% margin with volume usage

2. **Competitive Positioning**:

   - Cheaper than ChatGPT Plus ($20/month)
   - More flexible than fixed model subscriptions
   - Better value with multi-model access

3. **Usage-Based Overage**:
   - Charge $0.50 per $1 of API overage (50% markup)
   - Automatic top-ups available
   - Usage alerts at 80% and 100%

## Implementation Notes

1. **Cost Tracking**:

   - Track actual API costs per user in real-time
   - Monitor margin by tier
   - Alert on unprofitable users

2. **Model Restrictions**:

   - Free tier limited to models under $1/1M tokens
   - Rate limits based on tier
   - Queue priority for paid tiers

3. **Promotional Strategy**:
   - 14-day free trial of Pro tier
   - Annual billing discount (20% off)
   - Referral credits ($5 per referral)
