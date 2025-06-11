import { describe, it, expect } from 'vitest';
import { estimateCompressionSavings } from '../image-compression';

describe('Image Compression Utils', () => {
  // Note: createTestImageBuffer removed as it's not used in current tests

  describe('estimateCompressionSavings', () => {
    it('should calculate savings correctly', () => {
      const originalSize = 1024 * 1024; // 1MB
      const compressedSize = 512 * 1024; // 512KB

      const savings = estimateCompressionSavings(originalSize, compressedSize);

      expect(savings.savedBytes).toBe(512 * 1024);
      expect(savings.savedPercentage).toBe(50);
      expect(savings.humanReadableSaved).toBe('512.00 KB');
    });

    it('should handle KB sizes', () => {
      const originalSize = 100 * 1024; // 100KB
      const compressedSize = 75 * 1024; // 75KB

      const savings = estimateCompressionSavings(originalSize, compressedSize);

      expect(savings.savedBytes).toBe(25 * 1024);
      expect(savings.savedPercentage).toBe(25);
      expect(savings.humanReadableSaved).toBe('25.00 KB');
    });
  });

  // Note: compressImage and getImageDimensions require browser APIs (OffscreenCanvas, createImageBitmap)
  // which are not available in Node.js test environment. These would need to be tested in a browser
  // environment or with proper mocks.
});
