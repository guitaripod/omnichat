'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, ImageOff } from 'lucide-react';
import ImageHistoryItem from './image-history-item';
import { AttachmentViewerModal } from './attachment-viewer-modal';
import { useAuth } from '@clerk/nextjs';

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
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'model'>('date');

  // Extract images from all conversations
  const fetchImages = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch all conversations
      const conversationsResponse = await fetch('/api/conversations');
      const conversationsData = (await conversationsResponse.json()) as {
        success: boolean;
        conversations?: Array<{ id: string; title: string; createdAt: string }>;
      };

      if (!conversationsData.success || !conversationsData.conversations) {
        console.error('Failed to fetch conversations');
        return;
      }

      const allImages: GeneratedImage[] = [];

      // Process each conversation
      for (const conversation of conversationsData.conversations) {
        // Fetch messages for this conversation
        const messagesResponse = await fetch(`/api/conversations/${conversation.id}/messages`);
        const messagesData = (await messagesResponse.json()) as {
          success: boolean;
          messages?: Array<{
            id: string;
            content: string;
            role: 'user' | 'assistant';
            model?: string;
            createdAt: string;
          }>;
        };

        if (!messagesData.success || !messagesData.messages) continue;

        // Extract images from messages
        for (const message of messagesData.messages) {
          if (message.role !== 'assistant') continue;

          // Check if message contains generated images
          const imageMatches = message.content.match(/!\[Generated Image\]\((.*?)\)/g);
          if (!imageMatches) continue;

          for (const match of imageMatches) {
            const urlMatch = match.match(/!\[Generated Image\]\((.*?)\)/);
            if (!urlMatch || !urlMatch[1]) continue;

            const imageUrl = urlMatch[1];

            // Skip if not a valid image URL
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) continue;

            // Extract prompt from the message content or previous user message
            let prompt = 'Generated image';
            const messageIndex = messagesData.messages.indexOf(message);
            if (messageIndex > 0) {
              const previousMessage = messagesData.messages[messageIndex - 1];
              if (previousMessage.role === 'user') {
                prompt = previousMessage.content;
              }
            }

            allImages.push({
              id: `${message.id}-${allImages.length}`,
              url: imageUrl,
              prompt: prompt,
              model: message.model || 'unknown',
              createdAt: new Date(message.createdAt),
              conversationId: conversation.id,
            });
          }
        }
      }

      // Sort by date (newest first)
      allImages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-bold">Image History</h2>

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
            {searchQuery ? 'Try a different search term' : 'Generate some images to see them here'}
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
        <AttachmentViewerModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          attachment={{
            id: selectedImage.id,
            fileName: `generated-${selectedImage.model}.webp`,
            fileType: 'image/webp',
            url: selectedImage.url,
          }}
        />
      )}
    </div>
  );
}
