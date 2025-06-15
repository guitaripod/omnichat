import ImageHistoryGallery from '@/components/chat/image-history-gallery';

export const metadata = {
  title: 'Image History - OmniChat',
  description: 'View all your AI-generated images in one place',
};

export default function ImageHistoryPage() {
  return <ImageHistoryGallery />;
}
