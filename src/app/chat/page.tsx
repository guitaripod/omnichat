import { ChatContainer } from '@/components/chat/chat-container';
import { SafeChatWrapper } from '@/components/chat/safe-chat-wrapper';

export const runtime = 'edge';

export default function ChatPage() {
  return (
    <SafeChatWrapper>
      <ChatContainer />
    </SafeChatWrapper>
  );
}
