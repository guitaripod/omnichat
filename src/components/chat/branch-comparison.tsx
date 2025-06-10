'use client';

import React, { useState, useEffect } from 'react';
import { X, GitBranch, Check, ChevronDown } from 'lucide-react';
import type { Message } from '@/types';
import { BranchManager } from '@/services/branching/branch-manager';
import { MarkdownRenderer } from './markdown-renderer';

interface BranchComparisonProps {
  messages: Message[];
  onClose: () => void;
}

export function BranchComparison({ messages, onClose }: BranchComparisonProps) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [branchPaths, setBranchPaths] = useState<Map<string, Message[]>>(new Map());
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [divergencePoint, setDivergencePoint] = useState<number>(0);

  // Build message tree and extract branches
  const tree = BranchManager.buildMessageTree(messages);
  const branches = BranchManager.extractBranches(tree);

  useEffect(() => {
    // Auto-select first two branches if available
    if (branches.length >= 2 && selectedBranches.length === 0) {
      setSelectedBranches([branches[0].id, branches[1].id]);
    }
  }, [branches, selectedBranches.length]);

  useEffect(() => {
    // Build paths for selected branches
    const paths = new Map<string, Message[]>();

    selectedBranches.forEach((branchId) => {
      // Switch to branch and get its path
      const switchedTree = BranchManager.switchToBranch(tree, branchId);
      const path = BranchManager.getActivePath(switchedTree);
      paths.set(branchId, path);
    });

    setBranchPaths(paths);

    // Find divergence point
    if (selectedBranches.length >= 2) {
      const paths_array = Array.from(paths.values());
      let diverge = 0;

      // Find where paths diverge
      for (let i = 0; i < Math.min(...paths_array.map((p) => p.length)); i++) {
        const firstPathMsg = paths_array[0][i];
        const allSame = paths_array.every((path) => path[i]?.id === firstPathMsg?.id);

        if (!allSame) {
          diverge = i;
          break;
        }
        diverge = i + 1;
      }

      setDivergencePoint(diverge);
    }
  }, [selectedBranches, tree]);

  const toggleBranch = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter((id) => id !== branchId));
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
    }
  };

  const getBranchName = (branchId: string) => {
    return branches.find((b) => b.id === branchId)?.name || branchId;
  };

  const pathArrays = Array.from(branchPaths.values());
  const maxLength = Math.max(...pathArrays.map((p) => p.length), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative m-4 flex h-[90vh] w-full max-w-7xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Branch Comparison
            </h2>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowBranchSelector(!showBranchSelector)}
                className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {selectedBranches.length} branches selected
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showBranchSelector && (
                <div className="absolute top-full right-0 z-10 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="p-2">
                    <p className="mb-2 px-2 text-xs text-gray-500 dark:text-gray-400">
                      Select branches to compare
                    </p>
                    {branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => toggleBranch(branch.id)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{branch.name}</span>
                        {selectedBranches.includes(branch.id) && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-hidden">
          {selectedBranches.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Select branches to compare</p>
            </div>
          ) : selectedBranches.length === 1 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select at least one more branch to compare
              </p>
            </div>
          ) : (
            <div className="h-full overflow-x-auto">
              <div className="flex h-full min-w-fit">
                {selectedBranches.map((branchId, branchIndex) => {
                  const branchPath = branchPaths.get(branchId) || [];
                  return (
                    <div
                      key={branchId}
                      className={`flex h-full min-w-[400px] flex-1 flex-col ${
                        branchIndex > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''
                      }`}
                    >
                      {/* Branch Header */}
                      <div className="border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {getBranchName(branchId)}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {branchPath.length} messages
                        </p>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        {branchPath.map((message, index) => {
                          const isDivergent = index >= divergencePoint;
                          const isShared = !isDivergent && index < divergencePoint;

                          return (
                            <div
                              key={`${branchId}-${message.id}`}
                              className={`rounded-lg p-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-50 dark:bg-blue-900/20'
                                  : 'bg-gray-50 dark:bg-gray-800'
                              } ${
                                isDivergent
                                  ? 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/50'
                                  : ''
                              } ${isShared && branchIndex > 0 ? 'opacity-50' : ''}`}
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  {message.role === 'user' ? 'You' : 'Assistant'}
                                </span>
                                {isDivergent && (
                                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                    Divergent
                                  </span>
                                )}
                              </div>
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownRenderer content={message.content} />
                              </div>
                            </div>
                          );
                        })}

                        {/* Padding for shorter branches */}
                        {branchPath.length < maxLength && (
                          <div className="py-8 text-center text-gray-400 dark:text-gray-600">
                            <p className="text-sm">End of branch</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer with insights */}
        {selectedBranches.length >= 2 && divergencePoint > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Shared messages: {divergencePoint}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Divergent from message {divergencePoint + 1}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
