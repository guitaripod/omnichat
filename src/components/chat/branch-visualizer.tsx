'use client';

import React, { useEffect, useState } from 'react';
import { MessageNode, Branch, BranchManager } from '@/services/branching/branch-manager';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

interface BranchVisualizerProps {
  messages: Message[];
  onBranchSwitch: (branchId: string) => void;
  onCreateBranch: (fromMessageId: string) => void;
  className?: string;
}

export function BranchVisualizer({ messages, onBranchSwitch, className }: BranchVisualizerProps) {
  const [tree, setTree] = useState<MessageNode[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

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
  }, [messages]);

  const handleBranchClick = (branchId: string) => {
    setSelectedBranch(branchId);
    onBranchSwitch(branchId);
  };

  const handleNodeClick = (node: MessageNode) => {
    // Find the branch this node belongs to
    const nodeBranch = branches.find((b) => b.id === node.branchId);
    if (nodeBranch) {
      handleBranchClick(nodeBranch.id);
    }
  };

  const renderTreeSVG = () => {
    if (tree.length === 0) return null;

    const nodeRadius = 8;
    const nodeSpacing = 60;
    const branchSpacing = 50;
    const startX = 200;
    const startY = 30;

    const nodes: React.ReactElement[] = [];
    const connections: React.ReactElement[] = [];

    const renderNode = (node: MessageNode, x: number, y: number, depth: number = 0) => {
      // Draw connections to children
      node.children.forEach((child, index) => {
        const childX = x + (index - (node.children.length - 1) / 2) * branchSpacing;
        const childY = y + nodeSpacing;

        connections.push(
          <line
            key={`line-${node.message.id}-${child.message.id}`}
            x1={x}
            y1={y}
            x2={childX}
            y2={childY}
            stroke={child.isActive ? '#3b82f6' : '#e5e7eb'}
            strokeWidth={child.isActive ? 2 : 1}
          />
        );

        renderNode(child, childX, childY, depth + 1);
      });

      // Draw node
      nodes.push(
        <g key={`node-${node.message.id}`}>
          <circle
            cx={x}
            cy={y}
            r={nodeRadius}
            fill={node.isActive ? '#3b82f6' : '#f3f4f6'}
            stroke={node.isActive ? '#2563eb' : '#d1d5db'}
            strokeWidth={2}
            className="hover:r-10 cursor-pointer transition-all"
            onMouseEnter={() => setHoveredNode(node.message.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => handleNodeClick(node)}
          />
          {hoveredNode === node.message.id && (
            <circle
              cx={x}
              cy={y}
              r={nodeRadius + 4}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
          )}
          {/* Tooltip */}
          {hoveredNode === node.message.id && (
            <g>
              <rect
                x={x - 40}
                y={y - 35}
                width={80}
                height={20}
                rx={4}
                fill="#1f2937"
                className="pointer-events-none"
              />
              <text
                x={x}
                y={y - 22}
                textAnchor="middle"
                fontSize="11"
                fill="white"
                className="pointer-events-none"
              >
                {node.message.role === 'user' ? 'User' : node.message.model || 'Assistant'}
              </text>
            </g>
          )}
        </g>
      );
    };

    // Render all root nodes
    tree.forEach((rootNode, index) => {
      const x = startX + index * 100;
      renderNode(rootNode, x, startY);
    });

    return (
      <>
        {connections}
        {nodes}
      </>
    );
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Branch List */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          Conversation Branches
        </h3>
        <div className="space-y-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleBranchClick(branch.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                selectedBranch === branch.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    branch.isActive ? 'bg-blue-500' : 'bg-gray-400'
                  )}
                />
                <span>{branch.name}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {branch.messageCount} messages
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Branch Tree</h3>
        <div className="overflow-x-auto">
          <svg
            width={400}
            height={300}
            className="w-full min-w-[400px] rounded border border-gray-100 dark:border-gray-700"
            viewBox="0 0 400 300"
          >
            {renderTreeSVG()}
          </svg>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Click on a node to switch to that branch
        </p>
      </div>
    </div>
  );
}
