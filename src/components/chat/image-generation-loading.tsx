'use client';

interface ImageGenerationLoadingProps {
  size?: string;
}

// Map size strings to actual dimensions
const getSizeDimensions = (size?: string) => {
  const sizeMap: Record<string, { width: number; height: number }> = {
    auto: { width: 512, height: 512 },
    '256x256': { width: 256, height: 256 },
    '512x512': { width: 512, height: 512 },
    '1024x1024': { width: 512, height: 512 }, // Show at half size for better UI
    '1536x1024': { width: 576, height: 384 }, // 1.5:1 aspect ratio at smaller size
    '1024x1536': { width: 384, height: 576 }, // 1:1.5 aspect ratio at smaller size
    '1792x1024': { width: 448, height: 256 }, // 1.75:1 aspect ratio at smaller size
    '1024x1792': { width: 256, height: 448 }, // 1:1.75 aspect ratio at smaller size
  };

  return sizeMap[size || 'auto'] || sizeMap['auto'];
};

export function ImageGenerationLoading({ size = 'auto' }: ImageGenerationLoadingProps) {
  const dimensions = getSizeDimensions(size);

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        maxWidth: '100%',
      }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0">
        <div className="animate-shimmer h-full w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
    </div>
  );
}
