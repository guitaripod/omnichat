'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X, MoreVertical, Download } from 'lucide-react';
import { useConversationStore } from '@/store/conversations';
import { cn } from '@/utils';
import { ExportDialog } from '@/components/chat/export-dialog';

export function ConversationList() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversation,
  } = useConversationStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [exportDialogId, setExportDialogId] = useState<string | null>(null);

  const handleNewChat = () => {
    createConversation();
  };

  const handleRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
      setMenuOpenId(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  currentConversationId === conversation.id
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                )}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />

                {editingId === conversation.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveRename();
                    }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="text-green-600 hover:text-green-700 dark:text-green-400"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRename}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentConversation(conversation.id)}
                      className="flex-1 truncate text-left text-gray-700 dark:text-gray-300"
                    >
                      {conversation.title}
                    </button>

                    {/* Actions Menu */}
                    <div className="relative opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() =>
                          setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id)
                        }
                        className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>

                      {menuOpenId === conversation.id && (
                        <div className="absolute top-full right-0 z-10 mt-1 w-36 rounded-lg bg-white py-1 shadow-lg dark:bg-gray-800">
                          <button
                            onClick={() => handleRename(conversation.id, conversation.title)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Edit2 className="h-3 w-3" />
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              setExportDialogId(conversation.id);
                              setMenuOpenId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Download className="h-3 w-3" />
                            Export
                          </button>
                          <button
                            onClick={() => handleDelete(conversation.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {exportDialogId && (
        <ExportDialog
          isOpen={true}
          onClose={() => setExportDialogId(null)}
          conversationId={exportDialogId}
        />
      )}
    </div>
  );
}
