import { describe, it, expect } from 'vitest';
import { BranchManager } from '../branch-manager';
import type { Message } from '@/types';

describe('BranchManager', () => {
  const createMessage = (
    id: string,
    role: 'user' | 'assistant',
    content: string,
    parentId?: string
  ): Message => ({
    id,
    conversationId: 'test-conversation',
    role,
    content,
    model: 'test-model',
    createdAt: new Date(),
    parentId,
  });

  describe('buildMessageTree', () => {
    it('should build a simple linear tree', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'user', 'How are you?', '2'),
        createMessage('4', 'assistant', 'I am doing well', '3'),
      ];

      const tree = BranchManager.buildMessageTree(messages);

      expect(tree).toHaveLength(1);
      expect(tree[0].message.id).toBe('1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].message.id).toBe('2');
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].message.id).toBe('3');
    });

    it('should handle branches correctly', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'), // Branch from message 1
        createMessage('4', 'user', 'How are you?', '2'),
        createMessage('5', 'assistant', 'I am doing well', '4'),
      ];

      const tree = BranchManager.buildMessageTree(messages);

      expect(tree).toHaveLength(1);
      expect(tree[0].message.id).toBe('1');
      expect(tree[0].children).toHaveLength(2); // Two branches from message 1

      // Check both branches exist
      const childIds = tree[0].children.map((c) => c.message.id).sort();
      expect(childIds).toEqual(['2', '3']);

      // First branch should have continuation
      const branch1 = tree[0].children.find((c) => c.message.id === '2');
      expect(branch1?.children).toHaveLength(1);
      expect(branch1?.children[0].message.id).toBe('4');

      // Second branch should be leaf
      const branch2 = tree[0].children.find((c) => c.message.id === '3');
      expect(branch2?.children).toHaveLength(0);
    });

    it('should mark active branch correctly', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'),
        createMessage('4', 'user', 'How are you?', '2'),
        createMessage('5', 'assistant', 'I am doing well', '4'),
      ];

      const tree = BranchManager.buildMessageTree(messages);

      // The path 1 -> 2 -> 4 -> 5 should be active (first branch)
      expect(tree[0].isActive).toBe(true);
      expect(tree[0].children[0].isActive).toBe(true); // message 2
      expect(tree[0].children[1].isActive).toBe(false); // message 3 (alternate branch)

      // Check if message 4 exists in the first branch
      const message2Node = tree[0].children[0];
      expect(message2Node.children).toHaveLength(1);
      expect(message2Node.children[0].message.id).toBe('4');
      expect(message2Node.children[0].isActive).toBe(true);
    });
  });

  describe('extractBranches', () => {
    it('should extract all branches from tree', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'),
        createMessage('4', 'user', 'Question?', '3'),
      ];

      const tree = BranchManager.buildMessageTree(messages);
      const branches = BranchManager.extractBranches(tree);

      // Should have at least 2 branches due to the fork at message 1
      expect(branches.length).toBeGreaterThanOrEqual(2);

      // Main branch should exist and be active
      const mainBranch = branches.find((b) => b.id === 'main');
      expect(mainBranch).toBeDefined();
      expect(mainBranch?.isActive).toBe(true);

      // Should have alternative branches
      const altBranches = branches.filter((b) => b.id.includes('main-1'));
      expect(altBranches.length).toBeGreaterThan(0);
    });

    it('should name branches correctly', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Response 1'),
        createMessage('3', 'assistant', 'Response 2', '1'),
        createMessage('4', 'assistant', 'Response 3', '1'),
      ];

      const tree = BranchManager.buildMessageTree(messages);
      const branches = BranchManager.extractBranches(tree);

      expect(branches).toHaveLength(3);
      expect(branches[0].name).toBe('Main conversation');
      expect(branches[1].name).toBe('Alternative 1');
      expect(branches[2].name).toBe('Alternative 2');
    });
  });

  describe('switchToBranch', () => {
    it('should switch active branch', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'),
      ];

      const tree = BranchManager.buildMessageTree(messages);

      // Initially, first child (index 0) should be active
      const firstChildActive = tree[0].children.findIndex((c) => c.isActive);
      expect(firstChildActive).toBe(0);

      // Get the branch ID of the second child
      const secondChildBranchId = tree[0].children[1].branchId;

      // Switch to alternative branch
      const updatedTree = BranchManager.switchToBranch(tree, secondChildBranchId);

      // Now second child should be active
      const newActiveIndex = updatedTree[0].children.findIndex((c) => c.isActive);
      expect(newActiveIndex).toBe(1);
    });
  });

  describe('getActivePath', () => {
    it('should return active message path', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there'),
        createMessage('3', 'user', 'How are you?', '2'),
        createMessage('4', 'assistant', 'I am well', '3'),
      ];

      const tree = BranchManager.buildMessageTree(messages);
      const activePath = BranchManager.getActivePath(tree);

      expect(activePath).toHaveLength(4);
      expect(activePath.map((m) => m.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should return correct path after branch switch', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'),
        createMessage('4', 'user', 'Question?', '3'),
      ];

      const tree = BranchManager.buildMessageTree(messages);

      // Get the branch ID of the second child (message 3)
      const secondBranchId = tree[0].children[1].branchId;

      // Switch to alternative branch
      const updatedTree = BranchManager.switchToBranch(tree, secondBranchId);
      const activePath = BranchManager.getActivePath(updatedTree);

      // After switching to branch with message 3, path should include 1 and 3
      // Note: message 4 may not be included if branch switching only activates up to the branch point
      expect(activePath.length).toBeGreaterThanOrEqual(2);
      expect(activePath.map((m) => m.id)).toContain('1');
      expect(activePath.map((m) => m.id)).toContain('3');
    });
  });

  describe('getChildBranches', () => {
    it('should get child branches from a message', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
        createMessage('3', 'assistant', 'Hello!', '1'),
        createMessage('4', 'user', 'Question?', '2'),
      ];

      const tree = BranchManager.buildMessageTree(messages);
      const childBranches = BranchManager.getChildBranches(tree, '1');

      expect(childBranches).toHaveLength(2);
      expect(childBranches.map((c) => c.message.id).sort()).toEqual(['2', '3']);
    });

    it('should return empty array for leaf nodes', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi there', '1'),
      ];

      const tree = BranchManager.buildMessageTree(messages);
      const childBranches = BranchManager.getChildBranches(tree, '2');

      expect(childBranches).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty message array', () => {
      const tree = BranchManager.buildMessageTree([]);
      expect(tree).toHaveLength(0);

      const branches = BranchManager.extractBranches(tree);
      expect(branches).toHaveLength(0);
    });

    it('should handle orphaned messages', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi', '1'),
        createMessage('3', 'user', 'Orphaned', 'non-existent'), // Invalid parent
      ];

      const tree = BranchManager.buildMessageTree(messages);

      // Orphaned message should become a root node
      expect(tree).toHaveLength(2);
      expect(tree[1].message.id).toBe('3');
      expect(tree[1].children).toHaveLength(0);
    });

    it('should handle circular references gracefully', () => {
      const messages: Message[] = [
        createMessage('1', 'user', 'Hello'),
        createMessage('2', 'assistant', 'Hi', '3'), // Points to future message
        createMessage('3', 'user', 'Question', '2'), // Creates a cycle
      ];

      // Should not crash and handle gracefully
      const tree = BranchManager.buildMessageTree(messages);
      expect(tree.length).toBeGreaterThan(0);
    });
  });
});
