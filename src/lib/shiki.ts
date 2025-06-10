import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

// Supported languages by Shiki
export const supportedLanguages = [
  'javascript',
  'typescript',
  'python',
  'json',
  'bash',
  'shell',
  'jsx',
  'tsx',
  'css',
  'html',
  'markdown',
  'yaml',
  'toml',
  'sql',
  'graphql',
  'rust',
  'go',
  'java',
  'cpp',
  'c',
  'csharp',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'scala',
  'r',
  'matlab',
  'lua',
  'perl',
  'docker',
  'make',
  'nginx',
  'apache',
  'xml',
  'ini',
  'diff',
  'text',
];

// Language aliases mapping
export const languageAliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  yml: 'yaml',
  dockerfile: 'docker',
  makefile: 'make',
  plaintext: 'text',
  mdx: 'markdown',
};

export async function getHighlighter(): Promise<Highlighter> {
  // Return existing instance if available
  if (highlighterInstance) {
    return highlighterInstance;
  }

  // Return existing promise if highlighter is being created
  if (highlighterPromise) {
    return highlighterPromise;
  }

  // Create new highlighter instance
  highlighterPromise = createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: supportedLanguages,
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

export function normalizeLanguage(language: string): string {
  const normalized = languageAliases[language.toLowerCase()] || language.toLowerCase();
  return supportedLanguages.includes(normalized) ? normalized : 'text';
}
