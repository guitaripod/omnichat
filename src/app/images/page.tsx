import ImageHistoryGallery from '@/components/chat/image-history-gallery';

export const metadata = {
  title: 'Image History - OmniChat',
  description: 'View all your AI-generated images in one place',
};

export default function ImageHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ImageHistoryGallery />
    </div>
  );
}
