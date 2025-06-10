'use client';

import React, { useEffect, useState } from 'react';
import { MessageNode, Branch, BranchManager } from '@/services/branching/branch-manager';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  MessageSquare,
  User,
  Bot,
  ChevronRight,
  Plus,
  Info,
  X,
  Layers,
} from 'lucide-react';
import { BranchComparison } from './branch-comparison';

interface BranchVisualizerProps {
  messages: Message[];
  onBranchSwitch: (branchId: string) => void;
  onCreateBranch: (fromMessageId: string) => void;
  onClose?: () => void;
  isCreatingBranch?: boolean;
  className?: string;
}

export function BranchVisualizer({
  messages,
  onBranchSwitch,
  onCreateBranch,
  onClose,
  isCreatingBranch,
  className,
}: BranchVisualizerProps) {
  const [tree, setTree] = useState<MessageNode[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const messageTree = BranchManager.buildMessageTree(messages);
    const extractedBranches = BranchManager.extractBranches(messageTree);
    setTree(messageTree);
    setBranches(extractedBranches);

    // Find active branch
    const activeBranch = extractedBranches.find((b) => b.isActive);
    if (activeBranch) {
      setSelectedBranch(activeBranch.id);
    }

    // Auto-expand nodes with branches
    const nodesWithBranches = new Set<string>();
    const findBranchPoints = (nodes: MessageNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 1) {
          nodesWithBranches.add(node.message.id);
        }
        findBranchPoints(node.children);
      });
    };
    findBranchPoints(messageTree);
    setExpandedNodes(nodesWithBranches);
  }, [messages]);

  const handleBranchClick = (branchId: string) => {
    setSelectedBranch(branchId);
    onBranchSwitch(branchId);
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderMessageNode = (node: MessageNode, depth: number = 0): React.ReactElement => {
    const hasMultipleChildren = node.children.length > 1;
    const isExpanded = expandedNodes.has(node.message.id);
    const isSelected = selectedMessageId === node.message.id;
    const isInActiveBranch = node.isActive;

    return (
      <div key={node.message.id} className="relative">
        {/* Connection line from parent */}
        {depth > 0 && (
          <div
            className={cn(
              'absolute -top-4 left-6 h-4 w-0.5',
              isInActiveBranch ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          />
        )}

        {/* Message node */}
        <div
          className={cn(
            'flex cursor-pointer items-start gap-1.5 rounded-md px-1 py-1 transition-all',
            isSelected && 'bg-blue-50 dark:bg-blue-900/20',
            !isSelected && 'hover:bg-gray-50 dark:hover:bg-gray-800'
          )}
          onClick={() => setSelectedMessageId(node.message.id)}
          style={{ marginLeft: `${depth * 12}px` }}
        >
          {/* Expand/collapse button for branch points */}
          {hasMultipleChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.message.id);
              }}
              className="mt-0.5 flex-shrink-0 rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ChevronRight
                className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
              />
            </button>
          ) : (
            <div className="w-3 flex-shrink-0" />
          )}

          {/* Message icon */}
          <div
            className={cn(
              'mt-0.5 flex-shrink-0 rounded-md p-1',
              node.message.role === 'user'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            )}
          >
            {node.message.role === 'user' ? (
              <User className="h-3 w-3" />
            ) : (
              <Bot className="h-3 w-3" />
            )}
          </div>

          {/* Message content preview */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {node.message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {hasMultipleChildren && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {node.children.length} branches
                </span>
              )}
              {node.isActive && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Active
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
              {node.message.content || 'Empty message'}
            </p>
          </div>

          {/* Actions */}
          {node.message.role === 'assistant' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateBranch(node.message.id);
              }}
              disabled={isCreatingBranch}
              className={cn(
                'group flex-shrink-0 rounded-md p-1 transition-colors',
                isCreatingBranch
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
              title={isCreatingBranch ? 'Creating branch...' : 'Generate alternative response'}
            >
              <Plus
                className={cn(
                  'h-3.5 w-3.5',
                  isCreatingBranch
                    ? 'animate-pulse text-gray-400'
                    : 'text-gray-500 group-hover:text-blue-500'
                )}
              />
            </button>
          )}
        </div>

        {/* Child nodes */}
        {isExpanded && node.children.length > 0 && (
          <div className="relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
            {node.children.map((child) => (
              <div key={child.message.id} className="relative">
                {node.children.length > 1 && (
                  <div
                    className={cn(
                      'absolute top-6 left-6 h-0.5 w-4',
                      child.isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                )}
                {renderMessageNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header with instructions */}
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-700">
        <div className="mb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Conversation Branches
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {branches.length > 1 && (
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
                title="Compare branches side-by-side"
              >
                <Layers className="h-3 w-3" />
                Compare
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded p-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          View and manage different conversation paths. Click on messages to select them, or use the
          + button to create alternative responses.
        </p>
      </div>

      {/* Branch summary */}
      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'} • {messages.length}{' '}
            total messages
          </span>
          {selectedBranch !== 'main' && (
            <button
              onClick={() => handleBranchClick('main')}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Back to main
            </button>
          )}
        </div>
      </div>

      {/* Message tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">{tree.map((rootNode) => renderMessageNode(rootNode))}</div>
        )}
      </div>

      {/* Help section */}
      <div className="border-t border-gray-200 bg-blue-50 px-3 py-2.5 dark:border-gray-700 dark:bg-blue-900/20">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <p className="mb-0.5 font-medium">How to use branches:</p>
            <ul className="ml-3 list-disc space-y-0.5">
              <li>
                Click the + button on any assistant message to generate a new, alternative response
              </li>
              <li>Each branch creates a different conversation path from the same user prompt</li>
              <li>Click on branch nodes to expand/collapse them</li>
              <li>The active branch is highlighted in blue</li>
              <li>Use the Compare button to view branches side-by-side</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Branch Comparison Modal */}
      {showComparison && (
        <BranchComparison messages={messages} onClose={() => setShowComparison(false)} />
      )}
    </div>
  );
}
