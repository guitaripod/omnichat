import { vi, beforeAll, afterAll } from 'vitest';

// Suppress console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  // Mock localStorage for node environment
  if (typeof window === 'undefined') {
    (global as any).localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  }

  console.warn = (...args: any[]) => {
    // Suppress zustand persist warnings
    if (args[0]?.includes && args[0].includes('zustand persist middleware')) {
      return;
    }
    originalWarn(...args);
  };

  console.error = (...args: any[]) => {
    // Allow expected error logs from our tests
    if (
      args[0]?.includes &&
      (args[0].includes('Server returned error') || args[0].includes('Failed to sync'))
    ) {
      return originalError(...args);
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
