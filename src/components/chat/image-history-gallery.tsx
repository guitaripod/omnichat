'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, ImageOff, X, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import ImageHistoryItem from './image-history-item';
import { useAuth } from '@clerk/nextjs';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: Date;
  conversationId: string;
  metadata?: {
    originalSize?: string;
    compressedSize?: string;
    compressionRatio?: string;
  };
}

export default function ImageHistoryGallery() {
  const { userId } = useAuth();
  const router = useRouter();
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'model'>('date');

  // Fetch images directly from R2
  const fetchImages = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const response = await fetch('/api/images/list');
      const data = (await response.json()) as {
        success: boolean;
        images?: Array<{
          id: string;
          url: string;
          model: string;
          fileName: string;
          size: number;
          uploaded: string;
          prompt: string;
          originalSize: string;
          compressedSize: string;
          compressionRatio: string;
        }>;
        error?: string;
      };

      if (!data.success || !data.images) {
        console.error('Failed to fetch images:', data.error);
        return;
      }

      // Transform the API response to our GeneratedImage format
      const allImages: GeneratedImage[] = data.images.map((img) => ({
        id: img.id,
        url: img.url,
        prompt: img.prompt,
        model: img.model,
        createdAt: new Date(img.uploaded),
        conversationId: '', // Not needed for R2-based approach
        metadata: {
          originalSize: img.originalSize,
          compressedSize: img.compressedSize,
          compressionRatio: img.compressionRatio,
        },
      }));

      console.log(`Total images found in R2: ${allImages.length}`);

      setImages(allImages);
      setFilteredImages(allImages);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...images];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((img) =>
        img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by model
    if (selectedModel !== 'all') {
      filtered = filtered.filter((img) => img.model === selectedModel);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      filtered.sort((a, b) => a.model.localeCompare(b.model));
    }

    setFilteredImages(filtered);
  }, [images, searchQuery, selectedModel, sortBy]);

  // Get unique models for filter
  const uniqueModels = Array.from(new Set(images.map((img) => img.model)));

  // Handle keyboard navigation for modal
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Image History">
        <Button onClick={() => router.push('/chat')} variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Button>
      </PageHeader>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-input bg-background focus:ring-primary w-full rounded-md border py-2 pr-4 pl-10 text-sm focus:ring-2 focus:outline-none sm:w-64"
                />
              </div>

              {/* Model Filter */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="border-input bg-background focus:ring-primary rounded-md border px-4 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                <option value="all">All Models</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>
                    {model === 'dall-e-3'
                      ? 'DALL-E 3'
                      : model === 'dall-e-2'
                        ? 'DALL-E 2'
                        : model === 'gpt-image-1'
                          ? 'GPT Image 1'
                          : model}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'model')}
                className="border-input bg-background focus:ring-primary rounded-md border px-4 py-2 text-sm focus:ring-2 focus:outline-none"
              >
                <option value="date">Sort by Date</option>
                <option value="model">Sort by Model</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="text-muted-foreground text-sm">
            {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''} found
            {searchQuery && ` matching "${searchQuery}"`}
          </div>

          {/* Gallery Grid */}
          {filteredImages.length === 0 ? (
            <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
              <ImageOff className="mb-4 h-12 w-12" />
              <p className="text-lg font-medium">No images found</p>
              <p className="text-sm">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Generate some images to see them here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredImages.map((image) => (
                <ImageHistoryItem
                  key={image.id}
                  imageUrl={image.url}
                  prompt={image.prompt}
                  model={image.model}
                  createdAt={image.createdAt}
                  metadata={image.metadata}
                  onView={() => setSelectedImage(image)}
                />
              ))}
            </div>
          )}

          {/* Image Viewer Modal */}
          {selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
              {/* Header */}
              <div className="absolute top-0 right-0 left-0 flex items-center justify-between p-4 text-white">
                <div className="flex items-center gap-4">
                  <h3 className="max-w-md truncate text-lg font-medium">
                    {selectedImage.model} - {new Date(selectedImage.createdAt).toLocaleDateString()}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(selectedImage.url);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `generated-${selectedImage.model}-${Date.now()}.webp`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Download failed:', err);
                      }
                    }}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    title="Download image"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => window.open(selectedImage.url, '_blank')}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="rounded-lg p-2 transition-colors hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Image Content */}
              <div
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={() => setSelectedImage(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="object-contain"
                  style={{ maxHeight: '90vh', maxWidth: '90vw', width: 'auto', height: 'auto' }}
                />
              </div>

              {/* Prompt at bottom */}
              <div className="absolute right-0 bottom-0 left-0 bg-black/80 p-4 text-white">
                <p className="text-sm">{selectedImage.prompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
