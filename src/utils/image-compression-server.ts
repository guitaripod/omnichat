/**
 * Server-side image compression using sharp
 * This is a fallback for environments where browser APIs are not available
 */

/**
 * Compress image on the server side
 * For now, this is a no-op that returns the original buffer
 * In production, you would use a library like sharp or jimp
 */
export async function compressImageServer(
  imageBuffer: ArrayBuffer,
  _options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<ArrayBuffer> {
  // For now, return the original buffer without compression
  // In a production environment, you would use a server-side image processing library
  console.warn(
    '[Image Compression] Server-side compression not implemented, returning original image'
  );
  return imageBuffer;
}

/**
 * Get image dimensions from buffer (server-side)
 * Returns estimated dimensions for now
 */
export async function getImageDimensionsServer(
  _imageBuffer: ArrayBuffer
): Promise<{ width: number; height: number }> {
  // Return default dimensions for now
  return {
    width: 1024,
    height: 1024,
  };
}

/**
 * Estimate compression savings
 */
export function estimateCompressionSavings(
  originalSize: number,
  compressedSize: number
): {
  savedBytes: number;
  savedPercentage: number;
  humanReadableSaved: string;
} {
  const savedBytes = originalSize - compressedSize;
  const savedPercentage = Math.round((savedBytes / originalSize) * 100);

  const humanReadableSaved =
    savedBytes > 1024 * 1024
      ? `${(savedBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(savedBytes / 1024).toFixed(2)} KB`;

  return {
    savedBytes,
    savedPercentage,
    humanReadableSaved,
  };
}
