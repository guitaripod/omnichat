/**
 * Compress image using native browser APIs
 * Converts images to WebP format with quality adjustment
 */
export async function compressImage(
  imageBuffer: ArrayBuffer,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
  } = {}
): Promise<ArrayBuffer> {
  const { quality = 0.1, maxWidth = 2048, maxHeight = 2048 } = options;

  // Create a blob from the buffer
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  const imageBitmap = await createImageBitmap(blob);

  // Calculate new dimensions while maintaining aspect ratio
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;
    if (width > height) {
      width = maxWidth;
      height = Math.round(maxWidth / aspectRatio);
    } else {
      height = maxHeight;
      width = Math.round(maxHeight * aspectRatio);
    }
  }

  // Create canvas and draw resized image
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Convert to WebP with specified quality
  const compressedBlob = await canvas.convertToBlob({
    type: 'image/webp',
    quality,
  });

  // Convert blob back to ArrayBuffer
  return await compressedBlob.arrayBuffer();
}

/**
 * Get image dimensions from buffer
 */
export async function getImageDimensions(
  imageBuffer: ArrayBuffer
): Promise<{ width: number; height: number }> {
  const blob = new Blob([imageBuffer]);
  const imageBitmap = await createImageBitmap(blob);
  return {
    width: imageBitmap.width,
    height: imageBitmap.height,
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
