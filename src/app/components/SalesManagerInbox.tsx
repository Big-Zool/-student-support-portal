import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Search, Inbox, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { StatusBadge } from './StatusBadge';
import { ChatArea } from './ChatArea';
import type { ConversationPreview, ConversationStatus, Role } from './types';
import { cn } from './ui/utils';
import {
  getConversations,
  updateConversationStatus,
  assignConversation,
  type ApiConversationThread,
  type ConversationFilters,
} from '../../lib/apiClient';
import { subscribeToConversationList } from '../../lib/realtime';
import { useAuth } from '../auth/AuthContext';

type QueueTab = 'unassigned' | 'mine' | 'all';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-28 rounded mb-1.5" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between pl-9">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SalesManagerInboxProps {
  role: Role;
}

export function SalesManagerInbox({ role }: SalesManagerInboxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<ConversationPreview | null>(null);
  const [queueTab, setQueueTab] = useState<QueueTab>(role === 'manager' ? 'all' : 'mine');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const { resolvedTheme, setTheme } = useTheme();
  
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const currentUserName = profile?.full_name || '';

  const assignedToFilter: ConversationFilters['assignedTo'] =
    queueTab === 'all' ? 'all' : queueTab === 'mine' ? 'me' : 'unassigned';

  const { data: apiConversations = [], isLoading, isError, error } = useQuery({
    queryKey: ['conversations', { status: statusFilter, assignedTo: assignedToFilter }],
    queryFn: () => getConversations({ status: statusFilter, assignedTo: assignedToFilter }),
  });

  useEffect(() => {
    return subscribeToConversationList(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [queryClient]);

  const assignMutation = useMutation({
    mutationFn: ({ threadId, assignedTo }: { threadId: string; assignedTo: string | null }) =>
      assignConversation(threadId, assignedTo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.threadId] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ threadId, status }: { threadId: string; status: ConversationStatus }) =>
      updateConversationStatus(threadId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.threadId] });
    },
  });

  const mappedConversations: ConversationPreview[] = apiConversations.map((c: ApiConversationThread) => ({
    id: c.id,
    subject: c.subject,
    status: c.status,
    studentName: c.student?.full_name || 'Student',
    assignee: c.assigned?.full_name || null,
    assigneeId: c.assigned?.id || null,
    lastMessageTime: new Date(c.last_message_at),
  }));

  const filtered = mappedConversations.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.subject.toLowerCase().includes(q) && !c.studentName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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

  const handleAssignToMe = (convId: string) => {
    assignMutation.mutate({ threadId: convId, assignedTo: profile?.id || null });
  };

  const handleStatusChange = (convId: string, status: ConversationStatus) => {
    statusMutation.mutate({ threadId: convId, status });
  };

  const handleReassign = (convId: string, agentId: string) => {
    assignMutation.mutate({ threadId: convId, assignedTo: agentId });
  };

  const roleLabel = role === 'manager' ? 'Manager Queue' : 'Sales Inbox';
  const roleColor = role === 'manager' ? 'bg-emerald-600' : 'bg-blue-600';

  const queueTabs: { value: QueueTab; label: string }[] =
    role === 'manager'
      ? [
          { value: 'unassigned', label: 'Unassigned' },
          { value: 'mine', label: 'Mine' },
          { value: 'all', label: 'All' },
        ]
      : [
          { value: 'unassigned', label: 'Unassigned' },
          { value: 'mine', label: 'Mine' },
        ];

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors duration-200">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', roleColor)}>
          <Inbox className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{roleLabel}</h1>
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Badge variant="outline" className="ml-auto text-[11px] hidden sm:inline-flex dark:border-slate-700 dark:text-slate-400">
          {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <div
          className={cn(
            'flex flex-col min-h-0 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors duration-200',
            'w-full md:w-72 lg:w-80',
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Filters */}
          <div className="px-3 pt-3 pb-2 flex flex-col gap-2 flex-shrink-0 border-b border-slate-50 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or subject…"
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ConversationStatus | 'all')}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queue tabs */}
          <div className="px-3 pt-2 pb-1 flex-shrink-0">
            <Tabs value={queueTab} onValueChange={(v) => setQueueTab(v as QueueTab)}>
              <TabsList className={cn('w-full h-8', role === 'manager' ? 'grid grid-cols-3' : 'grid grid-cols-2')}>
                {queueTabs.map((tab) => (
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
              <SidebarSkeleton />
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
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No conversations match</p>
                <p className="text-xs text-slate-300 dark:text-slate-600">
                  {role === 'sales' && queueTab === 'unassigned'
                    ? 'Nothing waiting for assignment. Try the Mine tab for chats assigned to you.'
                    : 'Try adjusting your filters'}
                </p>
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
                    <div className="flex items-start gap-2.5">
                      <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                        <AvatarFallback className={cn('text-[10px] font-semibold', avatarColor(conv.studentName))}>
                          {getInitials(conv.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {conv.studentName}
                          </p>
                          <StatusBadge status={conv.status} />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-1">{conv.subject}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {conv.assignee ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {conv.assignee === currentUserName ? 'You' : conv.assignee}
                              </span>
                            ) : (
                              <span className="text-amber-500 dark:text-amber-400 font-medium">Unassigned</span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-300 dark:text-slate-600">
                            {formatDistanceToNow(conv.lastMessageTime, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
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
            role={role}
            onAssignToMe={handleAssignToMe}
            onStatusChange={handleStatusChange}
            onReassign={handleReassign}
            onBack={() => setMobileView('list')}
          />
        </div>
      </div>
    </div>
  );
}
