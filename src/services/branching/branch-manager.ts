import { Message } from '@/types';

export interface MessageNode {
  message: Message;
  children: MessageNode[];
  depth: number;
  branchId: string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  name: string;
  rootMessageId: string;
  lastMessageId: string;
  messageCount: number;
  createdAt: Date;
  isActive: boolean;
}

export class BranchManager {
  /**
   * Builds a tree structure from a flat array of messages
   */
  static buildMessageTree(messages: Message[]): MessageNode[] {
    const messageMap = new Map<string, MessageNode>();
    const rootNodes: MessageNode[] = [];

    // First pass: create nodes for all messages
    messages.forEach((message) => {
      messageMap.set(message.id, {
        message,
        children: [],
        depth: 0,
        branchId: '',
        isActive: false,
      });
    });

    // Second pass: build parent-child relationships
    messages.forEach((message) => {
      const node = messageMap.get(message.id)!;

      if (message.parentId) {
        const parentNode = messageMap.get(message.parentId);
        if (parentNode) {
          parentNode.children.push(node);
          node.depth = parentNode.depth + 1;
        } else {
          // If parent not found, treat as root
          rootNodes.push(node);
        }
      } else {
        // No parent = root node
        rootNodes.push(node);
      }
    });

    // Third pass: assign branch IDs and determine active path
    this.assignBranchIds(rootNodes);

    return rootNodes;
  }

  /**
   * Assigns unique branch IDs to each branch in the tree
   */
  private static assignBranchIds(
    nodes: MessageNode[],
    parentBranchId = 'main',
    isActiveBranch = true
  ): void {
    nodes.forEach((node) => {
      if (node.children.length > 1) {
        // This node has multiple children, so each child starts a new branch
        node.branchId = parentBranchId;
        node.isActive = isActiveBranch;

        node.children.forEach((child, childIndex) => {
          const newBranchId = `${parentBranchId}-${node.message.id}-${childIndex}`;
          this.assignBranchIds([child], newBranchId, isActiveBranch && childIndex === 0);
        });
      } else if (node.children.length === 1) {
        // Single child continues the same branch
        node.branchId = parentBranchId;
        node.isActive = isActiveBranch;
        this.assignBranchIds(node.children, parentBranchId, isActiveBranch);
      } else {
        // Leaf node
        node.branchId = parentBranchId;
        node.isActive = isActiveBranch;
      }
    });
  }

  /**
   * Gets all branches from a message tree
   */
  static extractBranches(tree: MessageNode[]): Branch[] {
    const branches = new Map<string, Branch>();

    const traverse = (nodes: MessageNode[]) => {
      nodes.forEach((node) => {
        const branchId = node.branchId;

        if (!branches.has(branchId)) {
          branches.set(branchId, {
            id: branchId,
            name: this.generateBranchName(branchId),
            rootMessageId: node.message.id,
            lastMessageId: node.message.id,
            messageCount: 1,
            createdAt: node.message.createdAt,
            isActive: node.isActive,
          });
        } else {
          const branch = branches.get(branchId)!;
          branch.lastMessageId = node.message.id;
          branch.messageCount++;
        }

        traverse(node.children);
      });
    };

    traverse(tree);
    return Array.from(branches.values());
  }

  /**
   * Generates a human-readable name for a branch
   */
  private static generateBranchName(branchId: string): string {
    if (branchId === 'main') return 'Main conversation';

    const parts = branchId.split('-');
    if (parts.length >= 3) {
      const branchIndex = parseInt(parts[parts.length - 1], 10);
      return `Alternative ${branchIndex + 1}`;
    }

    return `Branch ${branchId}`;
  }

  /**
   * Gets the active path through the message tree
   */
  static getActivePath(tree: MessageNode[]): Message[] {
    const activePath: Message[] = [];

    const traverse = (nodes: MessageNode[]) => {
      nodes.forEach((node) => {
        if (node.isActive) {
          activePath.push(node.message);
          traverse(node.children);
        }
      });
    };

    traverse(tree);
    return activePath;
  }

  /**
   * Switches to a different branch
   */
  static switchToBranch(tree: MessageNode[], targetBranchId: string): MessageNode[] {
    // Reset all nodes to inactive
    const resetActive = (nodes: MessageNode[]) => {
      nodes.forEach((node) => {
        node.isActive = false;
        resetActive(node.children);
      });
    };

    // Set the target branch as active
    const setActive = (nodes: MessageNode[]): boolean => {
      for (const node of nodes) {
        if (node.branchId === targetBranchId || node.branchId.startsWith(targetBranchId + '-')) {
          node.isActive = true;
          // Also activate parent nodes
          return true;
        }

        if (setActive(node.children)) {
          node.isActive = true;
          return true;
        }
      }
      return false;
    };

    resetActive(tree);
    setActive(tree);

    return tree;
  }

  /**
   * Creates a new branch from a specific message
   */
  static createBranchFrom(
    messages: Message[],
    fromMessageId: string,
    newMessage: Message
  ): Message[] {
    // Find the index of the message to branch from
    const fromIndex = messages.findIndex((m) => m.id === fromMessageId);
    if (fromIndex === -1) return messages;

    // Set the parentId of the new message
    newMessage.parentId = fromMessageId;

    // Return all messages including the new one
    return [...messages, newMessage];
  }

  /**
   * Gets all child branches from a specific message
   */
  static getChildBranches(tree: MessageNode[], messageId: string): MessageNode[] {
    const findNode = (nodes: MessageNode[]): MessageNode | null => {
      for (const node of nodes) {
        if (node.message.id === messageId) return node;
        const found = findNode(node.children);
        if (found) return found;
      }
      return null;
    };

    const targetNode = findNode(tree);
    return targetNode ? targetNode.children : [];
  }
}
