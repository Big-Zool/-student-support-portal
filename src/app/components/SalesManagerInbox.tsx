import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Inbox, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { StatusBadge } from './StatusBadge';
import { ChatArea } from './ChatArea';
import type { Conversation, ConversationStatus, Role } from './types';
import { INITIAL_CONVERSATIONS, CURRENT_SALES_USER } from './types';
import { cn } from './ui/utils';

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
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_CONVERSATIONS[0]?.id ?? null);
  const [queueTab, setQueueTab] = useState<QueueTab>(role === 'manager' ? 'all' : 'unassigned');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setIsLoading(true);
    setQueueTab(role === 'manager' ? 'all' : 'unassigned');
    const t = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(t);
  }, [role]);

  const filtered = conversations.filter((c) => {
    if (queueTab === 'unassigned' && c.assignee !== null) return false;
    if (queueTab === 'mine' && c.assignee !== CURRENT_SALES_USER) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.subject.toLowerCase().includes(q) && !c.studentName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSelectConv = (id: string) => {
    setSelectedId(id);
    setMobileView('chat');
  };

  const handleSendMessage = (convId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: content,
              lastMessageTime: new Date(),
              messages: [
                ...c.messages,
                { id: `m-${Date.now()}`, content, sender: 'team', senderName: CURRENT_SALES_USER, timestamp: new Date() },
              ],
            }
          : c
      )
    );
  };

  const handleAssignToMe = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, assignee: CURRENT_SALES_USER } : c))
    );
  };

  const handleStatusChange = (convId: string, status: ConversationStatus) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, status } : c)));
  };

  const handleReassign = (convId: string, agent: string) => {
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, assignee: agent } : c)));
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
            'flex flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 transition-colors duration-200',
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

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <SidebarSkeleton />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4 text-center">
                <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No conversations match</p>
                <p className="text-xs text-slate-300 dark:text-slate-600">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 p-2">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
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
                                {conv.assignee === CURRENT_SALES_USER ? 'You' : conv.assignee}
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
          </ScrollArea>
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
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
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
