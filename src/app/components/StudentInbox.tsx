import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Plus, MessageSquare, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { ChatArea } from './ChatArea';
import { NewConversationDialog } from './NewConversationDialog';
import type { ConversationPreview, ConversationStatus } from './types';
import { cn } from './ui/utils';
import { getConversations, createConversation, type ApiConversationThread } from '../../lib/apiClient';
import { subscribeToConversationList } from '../../lib/realtime';

function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-3/4 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function StudentInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<ConversationPreview | null>(null);
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, isError, error } = useQuery({
    queryKey: ['conversations', { status: statusFilter }],
    queryFn: () => getConversations({ status: statusFilter }),
  });

  useEffect(() => {
    return subscribeToConversationList(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: ({ subject, message }: { subject: string; message: string }) =>
      createConversation(subject, message),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const preview: ConversationPreview = {
        id: newThread.id,
        subject: newThread.subject,
        status: newThread.status,
        studentName: newThread.student?.full_name || 'Student',
        assignee: newThread.assigned?.full_name || null,
        assigneeId: newThread.assigned?.id || null,
        lastMessageTime: new Date(newThread.last_message_at),
      };
      setSelectedId(newThread.id);
      setSelectedPreview(preview);
      setMobileView('chat');
    },
  });

  // Since backend doesn't return the last message body in the list, we just map it.
  const mappedConversations: ConversationPreview[] = conversations.map((c: ApiConversationThread) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    studentName: c.student?.full_name || 'Student',
    assignee: c.assigned?.full_name || null,
    assigneeId: c.assigned?.id || null,
    lastMessageTime: new Date(c.last_message_at),
  }));

  const filtered = mappedConversations;

  // Keep the preview from click so the chat panel stays populated when filters change.
  const selected =
    mappedConversations.find((c) => c.id === selectedId) ?? selectedPreview;

  useEffect(() => {
    if (isLoading || mappedConversations.length === 0) return;

    if (selectedId) {
      const match = mappedConversations.find((c) => c.id === selectedId);
      if (match) setSelectedPreview(match);
      return;
    }

    const first = mappedConversations[0];
    setSelectedId(first.id);
    setSelectedPreview(first);
  }, [mappedConversations, isLoading, selectedId]);

  const handleSelectConv = (conv: ConversationPreview) => {
    setSelectedId(conv.id);
    setSelectedPreview(conv);
    setMobileView('chat');
  };

  const handleCreate = async (subject: string, message: string) => {
    try {
      await createMutation.mutateAsync({ subject, message });
      return true;
    } catch {
      return false;
    }
  };

  const tabs: { value: ConversationStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'pending', label: 'Pending' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">My Support Chats</h1>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setNewConvOpen(true)} disabled={createMutation.isPending}>
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Conversation</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col min-h-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200',
            'w-full md:w-72 lg:w-80 flex-shrink-0',
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Status tabs */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ConversationStatus | 'all')}>
              <TabsList className="w-full grid grid-cols-4 h-8">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs py-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Conversation list — native scroll avoids Radix ScrollArea 0-height in flex layouts */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <ConversationSkeleton />
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Could not load conversations</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {error instanceof Error ? error.message : 'Please try again.'}
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No conversations here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all duration-100',
                      selectedId === conv.id
                        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight line-clamp-1">
                        {conv.subject}
                      </p>
                      <StatusBadge status={conv.status} />
                    </div>
                    <p className="text-[10px] text-slate-300 dark:text-slate-600">
                      {formatDistanceToNow(conv.lastMessageTime, { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          className={cn(
            'flex-1 flex flex-col overflow-hidden min-h-0',
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          )}
        >
          <ChatArea
            conversation={selected}
            role="student"
            onBack={() => setMobileView('list')}
          />
        </div>
      </div>

      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        onCreate={handleCreate}
        isCreating={createMutation.isPending}
        error={createMutation.error instanceof Error ? createMutation.error.message : null}
      />
    </div>
  );
}
