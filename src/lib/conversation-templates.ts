export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'creative' | 'technical' | 'personal' | 'business';
  icon: string;
  color: string;
  isPremium: boolean;
  systemPrompt: string;
  starterMessages: string[];
  suggestedModel?: string;
}

export const CONVERSATION_TEMPLATES: ConversationTemplate[] = [
  // Productivity Templates
  {
    id: 'meeting-notes',
    name: 'Meeting Notes Assistant',
    description: 'Transform meeting recordings or notes into structured summaries',
    category: 'productivity',
    icon: '📝',
    color: 'blue',
    isPremium: true,
    systemPrompt:
      'You are a professional meeting notes assistant. Your task is to transform raw meeting notes or transcripts into well-structured, actionable summaries. Focus on key decisions, action items, and important discussion points.',
    starterMessages: [
      'Here are my meeting notes from today...',
      'Can you help me structure these meeting minutes?',
      'I need to extract action items from this discussion:',
    ],
    suggestedModel: 'gpt-4o',
  },
  {
    id: 'project-planning',
    name: 'Project Planner',
    description: 'Break down projects into actionable tasks and timelines',
    category: 'productivity',
    icon: '📊',
    color: 'green',
    isPremium: true,
    systemPrompt:
      'You are an experienced project manager. Help users break down their projects into clear phases, tasks, and timelines. Consider dependencies, resources, and risks. Provide practical advice and templates.',
    starterMessages: [
      'I need help planning a new software project...',
      'Can you create a project timeline for...',
      'Help me break down this project into tasks:',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'email-composer',
    name: 'Professional Email Writer',
    description: 'Craft professional emails for any situation',
    category: 'productivity',
    icon: '✉️',
    color: 'purple',
    isPremium: true,
    systemPrompt:
      'You are an expert business communication specialist. Help users write clear, professional, and effective emails. Adapt your tone based on the context and recipient. Always be concise and action-oriented.',
    starterMessages: [
      'I need to write a follow-up email to a client...',
      'Help me compose a professional response to...',
      'Can you draft an email requesting...',
    ],
    suggestedModel: 'gpt-4o-mini',
  },

  // Creative Templates
  {
    id: 'story-writer',
    name: 'Creative Story Writer',
    description: 'Develop engaging stories and narratives',
    category: 'creative',
    icon: '📚',
    color: 'orange',
    isPremium: true,
    systemPrompt:
      'You are a creative writing assistant with expertise in storytelling. Help users develop compelling narratives, interesting characters, and engaging plots. Provide constructive feedback and creative suggestions.',
    starterMessages: [
      'I have an idea for a story about...',
      'Help me develop this character...',
      'Can you continue this story opening:',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'content-creator',
    name: 'Content Creation Assistant',
    description: 'Generate ideas and content for social media and blogs',
    category: 'creative',
    icon: '🎨',
    color: 'pink',
    isPremium: true,
    systemPrompt:
      'You are a content creation expert specializing in social media and blog content. Help users generate engaging ideas, write compelling copy, and optimize content for different platforms. Consider SEO and audience engagement.',
    starterMessages: [
      'I need content ideas for my tech blog...',
      'Help me write a LinkedIn post about...',
      'Can you create Instagram captions for...',
    ],
    suggestedModel: 'gpt-4o',
  },
  {
    id: 'poem-generator',
    name: 'Poetry & Lyrics Creator',
    description: 'Compose beautiful poems and song lyrics',
    category: 'creative',
    icon: '🎵',
    color: 'indigo',
    isPremium: true,
    systemPrompt:
      'You are a poet and lyricist with a deep understanding of rhythm, meter, and emotional expression. Help users create meaningful poetry and song lyrics in various styles and forms.',
    starterMessages: [
      'Write a poem about...',
      'I need lyrics for a song about...',
      'Can you help me with a haiku on...',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },

  // Technical Templates
  {
    id: 'code-reviewer',
    name: 'Code Review Assistant',
    description: 'Get detailed code reviews and optimization suggestions',
    category: 'technical',
    icon: '🔍',
    color: 'red',
    isPremium: true,
    systemPrompt:
      'You are an experienced software engineer specializing in code review. Analyze code for bugs, performance issues, security vulnerabilities, and best practices. Provide constructive feedback with specific improvement suggestions.',
    starterMessages: [
      'Review this Python function for me:',
      'Can you check this React component?',
      'Help me optimize this SQL query:',
    ],
    suggestedModel: 'gpt-4o',
  },
  {
    id: 'debug-helper',
    name: 'Debug Assistant',
    description: 'Solve coding bugs and errors quickly',
    category: 'technical',
    icon: '🐛',
    color: 'yellow',
    isPremium: true,
    systemPrompt:
      'You are a debugging expert. Help users identify and fix bugs in their code. Explain the root cause of issues and provide clear solutions. Consider edge cases and suggest preventive measures.',
    starterMessages: [
      "I'm getting this error:",
      "My code isn't working as expected:",
      'Can you help debug this function?',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'api-designer',
    name: 'API Design Consultant',
    description: 'Design RESTful APIs and data schemas',
    category: 'technical',
    icon: '🔌',
    color: 'teal',
    isPremium: true,
    systemPrompt:
      'You are an API design expert with deep knowledge of REST principles, GraphQL, and modern API practices. Help users design scalable, secure, and well-documented APIs. Consider versioning, authentication, and best practices.',
    starterMessages: [
      'I need to design an API for...',
      'Help me structure this REST endpoint:',
      "What's the best way to handle authentication for...",
    ],
    suggestedModel: 'gpt-4o',
  },

  // Personal Templates
  {
    id: 'life-coach',
    name: 'Personal Life Coach',
    description: 'Get guidance on personal goals and decisions',
    category: 'personal',
    icon: '🌟',
    color: 'amber',
    isPremium: true,
    systemPrompt:
      'You are a supportive life coach focused on helping people achieve their personal goals. Provide thoughtful, empathetic guidance while encouraging self-reflection and personal growth. Always maintain a positive, empowering tone.',
    starterMessages: [
      "I'm trying to decide between...",
      'I want to improve my...',
      'Can you help me set goals for...',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'meal-planner',
    name: 'Meal Planning Assistant',
    description: 'Create personalized meal plans and recipes',
    category: 'personal',
    icon: '🍽️',
    color: 'lime',
    isPremium: true,
    systemPrompt:
      'You are a nutrition-conscious meal planning assistant. Help users create balanced, delicious meal plans based on their dietary preferences, restrictions, and goals. Provide recipes, shopping lists, and nutritional information.',
    starterMessages: [
      'I need a vegetarian meal plan for the week...',
      'Can you suggest healthy breakfast ideas?',
      'Help me plan meals with these ingredients:',
    ],
    suggestedModel: 'gpt-4o-mini',
  },
  {
    id: 'fitness-trainer',
    name: 'Personal Fitness Trainer',
    description: 'Design custom workout plans and fitness advice',
    category: 'personal',
    icon: '💪',
    color: 'rose',
    isPremium: true,
    systemPrompt:
      'You are a certified personal fitness trainer. Create safe, effective workout plans tailored to individual fitness levels and goals. Provide proper form instructions and motivational support. Always prioritize safety.',
    starterMessages: [
      'I want to start a workout routine for...',
      'Design a home workout plan for...',
      'How can I improve my...',
    ],
    suggestedModel: 'gpt-4o',
  },

  // Business Templates
  {
    id: 'business-strategist',
    name: 'Business Strategy Advisor',
    description: 'Develop business strategies and market analysis',
    category: 'business',
    icon: '📈',
    color: 'slate',
    isPremium: true,
    systemPrompt:
      'You are a business strategy consultant with expertise in market analysis, competitive positioning, and growth strategies. Provide data-driven insights and actionable recommendations for business challenges.',
    starterMessages: [
      'How can I expand my business into...',
      'Analyze the market opportunity for...',
      'What strategy should I use to compete with...',
    ],
    suggestedModel: 'gpt-4o',
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck Creator',
    description: 'Build compelling investor pitch decks',
    category: 'business',
    icon: '🎯',
    color: 'violet',
    isPremium: true,
    systemPrompt:
      'You are an expert in creating investor pitch decks. Help users structure compelling narratives, highlight key metrics, and address investor concerns. Focus on clarity, impact, and storytelling.',
    starterMessages: [
      'Help me outline a pitch deck for...',
      'What should I include in my investor presentation?',
      'Review my startup pitch:',
    ],
    suggestedModel: 'claude-3-5-sonnet-latest',
  },
  {
    id: 'market-researcher',
    name: 'Market Research Analyst',
    description: 'Conduct market research and competitive analysis',
    category: 'business',
    icon: '🔬',
    color: 'cyan',
    isPremium: true,
    systemPrompt:
      'You are a market research analyst skilled in competitive analysis, customer insights, and market trends. Help users understand their market landscape, identify opportunities, and make data-informed decisions.',
    starterMessages: [
      'Analyze the competitive landscape for...',
      'What are the trends in the ... industry?',
      'Help me research my target market:',
    ],
    suggestedModel: 'gpt-4o',
  },
];

// Helper function to get templates by category
export function getTemplatesByCategory(
  category: ConversationTemplate['category']
): ConversationTemplate[] {
  return CONVERSATION_TEMPLATES.filter((template) => template.category === category);
}

// Helper function to get all premium templates
export function getPremiumTemplates(): ConversationTemplate[] {
  return CONVERSATION_TEMPLATES.filter((template) => template.isPremium);
}

// Color mapping for Tailwind classes
export const TEMPLATE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  lime: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-600 dark:text-lime-400',
    border: 'border-lime-200 dark:border-lime-800',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
};
