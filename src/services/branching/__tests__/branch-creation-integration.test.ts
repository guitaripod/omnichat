import { describe, it, expect } from 'vitest';
import { BranchManager } from '../branch-manager';
import type { Message } from '@/types';
import { generateId } from '@/utils';

describe('Branch Creation Integration', () => {
  const createMessage = (
    role: 'user' | 'assistant',
    content: string,
    parentId?: string
  ): Message => ({
    id: generateId(),
    conversationId: 'test-conv',
    role,
    content,
    model: 'test-model',
    createdAt: new Date(),
    parentId,
  });

  it('should create a branch from an assistant message', () => {
    // Initial conversation
    const messages: Message[] = [
      { ...createMessage('user', 'Tell me a joke'), id: '1' },
      {
        ...createMessage('assistant', 'Why did the chicken cross the road?'),
        id: '2',
        parentId: '1',
      },
      { ...createMessage('user', "I don't know, why?"), id: '3', parentId: '2' },
      { ...createMessage('assistant', 'To get to the other side!'), id: '4', parentId: '3' },
    ];

    // User wants to create a branch from message 2 (first assistant response)
    // This means creating an alternative response to the user's "Tell me a joke"
    const newBranchMessage = createMessage(
      'assistant',
      'What do you call a bear with no teeth? A gummy bear!'
    );
    newBranchMessage.parentId = '1'; // Same parent as message 2

    // The createBranchFrom method just adds the message, it doesn't set parentId
    const updatedMessages = [...messages, newBranchMessage];

    // Build tree to verify structure
    const tree = BranchManager.buildMessageTree(updatedMessages);

    // Message 1 should now have 2 children (original response and new branch)
    expect(tree[0].message.id).toBe('1');
    expect(tree[0].children).toHaveLength(2);

    // Both branches should have different jokes
    const jokes = tree[0].children.map((c) => c.message.content);
    expect(jokes).toContain('Why did the chicken cross the road?');
    expect(jokes).toContain('What do you call a bear with no teeth? A gummy bear!');
  });

  it('should handle branch creation workflow correctly', () => {
    // Simulate the actual workflow from chat-container.tsx
    const messages: Message[] = [
      { ...createMessage('user', 'Hello'), id: '1' },
      { ...createMessage('assistant', 'Hi there!'), id: '2', parentId: '1' },
    ];

    // Find the message to branch from (assistant message)
    const branchFromId = '2';
    const messageIndex = messages.findIndex((m) => m.id === branchFromId);

    expect(messageIndex).toBe(1);

    // Find the previous user message
    let previousUserMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        previousUserMessage = messages[i];
        break;
      }
    }

    expect(previousUserMessage).not.toBeNull();
    expect(previousUserMessage?.id).toBe('1');

    // Create new branch with alternative response
    const newMessage = createMessage('assistant', 'Hello! How can I help you today?');
    newMessage.parentId = previousUserMessage!.id;

    messages.push(newMessage);

    // Verify tree structure
    const tree = BranchManager.buildMessageTree(messages);
    expect(tree[0].children).toHaveLength(2);
  });

  it('should maintain conversation context when creating branches', () => {
    const messages: Message[] = [
      { ...createMessage('user', 'What is 2+2?'), id: '1' },
      { ...createMessage('assistant', 'The answer is 4'), id: '2', parentId: '1' },
      { ...createMessage('user', 'What about 3+3?'), id: '3', parentId: '2' },
      { ...createMessage('assistant', '3+3 equals 6'), id: '4', parentId: '3' },
    ];

    // Create a branch from message 4 (second assistant response)
    // This should create an alternative answer to "What about 3+3?"
    const branchMessage = createMessage('assistant', 'Three plus three is six');
    branchMessage.parentId = '3'; // Parent is the user question

    messages.push(branchMessage);

    const tree = BranchManager.buildMessageTree(messages);
    const branches = BranchManager.extractBranches(tree);

    // Should have multiple branches now
    expect(branches.length).toBeGreaterThan(1);

    // The user question "What about 3+3?" should have 2 responses
    const question3Node = BranchManager.getChildBranches(tree, '3');
    expect(question3Node).toHaveLength(2); // Two responses to the question

    // Verify the responses are different
    const responses = question3Node.map((n) => n.message.content);
    expect(responses).toContain('3+3 equals 6');
    expect(responses).toContain('Three plus three is six');
  });

  it('should generate unique branch IDs', () => {
    const messages: Message[] = [
      { ...createMessage('user', 'Hi'), id: '1' },
      { ...createMessage('assistant', 'Response 1'), id: '2', parentId: '1' },
      { ...createMessage('assistant', 'Response 2'), id: '3', parentId: '1' },
      { ...createMessage('assistant', 'Response 3'), id: '4', parentId: '1' },
    ];

    const tree = BranchManager.buildMessageTree(messages);
    const branches = BranchManager.extractBranches(tree);

    // All branch IDs should be unique
    const branchIds = branches.map((b) => b.id);
    const uniqueIds = new Set(branchIds);
    expect(uniqueIds.size).toBe(branchIds.length);

    // Branch names should be descriptive
    const branchNames = branches.map((b) => b.name);
    expect(branchNames).toContain('Main conversation');
    expect(branchNames.some((name) => name.includes('Alternative'))).toBe(true);
  });
});
