import { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Send, ArrowLeft, UserCheck, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { ReassignDialog } from './ReassignDialog';
import type { ConversationPreview, ConversationStatus, Role } from './types';
import { cn } from './ui/utils';
import { getConversation, sendMessage, type ApiConversationDetail, type ApiMessage } from '../../lib/apiClient';
import { subscribeToConversationThread } from '../../lib/realtime';
import { useAuth } from '../auth/AuthContext';

interface ChatAreaProps {
  conversation: ConversationPreview | null;
  role: Role;
  onAssignToMe?: (convId: string) => void;
  onStatusChange?: (convId: string, status: ConversationStatus) => void;
  onReassign?: (convId: string, agent: string) => void;
  onBack?: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name: string) {
  const colors = [
    'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function SkeletonChat() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex-1 p-4 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'flex-row-reverse' : 'flex-row')}>
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <Skeleton className={cn('h-12 rounded-xl', i % 2 === 0 ? 'w-48' : 'w-56')} />
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ChatArea({
  conversation: previewConv,
  role,
  onAssignToMe,
  onStatusChange,
  onReassign,
  onBack,
}: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [reassignOpen, setReassignOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  const { data: fullConv, isPending, isError, error } = useQuery({
    queryKey: ['conversation', previewConv?.id],
    queryFn: () => getConversation(previewConv!.id),
    enabled: !!previewConv?.id,
  });

  useEffect(() => {
    if (!previewConv?.id) return;

    return subscribeToConversationThread(previewConv.id, () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', previewConv.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [previewConv?.id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage(previewConv!.id, body),
    onMutate: async (body) => {
      const queryKey = ['conversation', previewConv!.id];
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<ApiConversationDetail>(queryKey);

      queryClient.setQueryData<ApiConversationDetail>(queryKey, (current) => {
        if (!current) return current;

        const optimisticMessage: ApiMessage = {
          id: `pending-${Date.now()}`,
          body,
          created_at: new Date().toISOString(),
          sender_type: role === 'student' ? 'student' : 'team',
          sender: profile
            ? {
                id: profile.id,
                full_name: profile.full_name,
                role: profile.role,
              }
            : null,
        };

        return {
          ...current,
          messages: [...current.messages, optimisticMessage],
        };
      });

      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['conversation', previewConv!.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', previewConv!.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Refresh list to show new lastMessage time
    },
  });

  const conversation = fullConv ? {
    ...fullConv.thread,
    studentName: fullConv.thread.student?.full_name || 'Student',
    assignee: fullConv.thread.assigned?.full_name || null,
    messages: fullConv.messages,
  } : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSend = () => {
    if (!conversation || !message.trim()) return;
    sendMutation.mutate(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  if (!previewConv) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-200">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Send className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">No conversation selected</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Choose a conversation from the list, or start a new one.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <p className="text-slate-700 dark:text-slate-300 font-medium">Could not load this conversation</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            {error instanceof Error ? error.message : 'Please select it again or refresh.'}
          </p>
        </div>
      </div>
    );
  }

  if (isPending || !conversation) return <SkeletonChat />;

  const isUnassigned = !conversation.assignee;
  const showSalesActions = role === 'sales' || role === 'manager';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Row 1: back + title + status */}
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                {conversation.subject}
              </h2>
              <StatusBadge status={conversation.status} className="flex-shrink-0" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {showSalesActions
                ? `${conversation.studentName}`
                : conversation.assignee
                ? `Support: ${conversation.assignee}`
                : 'Looking for an agent…'}
            </p>
          </div>
        </div>

        {/* Row 2: action buttons */}
        {showSalesActions && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {isUnassigned && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 flex-shrink-0"
                onClick={() => onAssignToMe?.(conversation.id)}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign to me
              </Button>
            )}

            {role === 'manager' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 flex-shrink-0"
                onClick={() => setReassignOpen(true)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isUnassigned ? 'Assign agent' : 'Reassign'}
              </Button>
            )}

            {onStatusChange && (
              <Select
                value={conversation.status}
                onValueChange={(v) => onStatusChange(conversation.id, v as ConversationStatus)}
              >
                <SelectTrigger className="h-7 text-xs w-28 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>

      {/* Messages — native scroll avoids Radix ScrollArea collapsing to 0 height inside flex layouts */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 py-4 flex flex-col gap-4">
          {conversation.messages?.map((msg: ApiMessage) => {
            const isStudent = msg.sender_type === 'student';
            const senderName = msg.sender?.full_name || 'Unknown';
            return (
              <div key={msg.id} className={cn('flex gap-2.5', isStudent ? 'flex-row-reverse' : 'flex-row')}>
                <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className={cn('text-[10px] font-semibold', avatarColor(senderName))}>
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn('flex flex-col gap-1 max-w-[75%]', isStudent ? 'items-end' : 'items-start')}>
                  <div className="flex items-center gap-1.5">
                    {!isStudent && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{senderName}</span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                    {isStudent && (
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{senderName}</span>
                    )}
                  </div>
                  <div
                    className={cn(
                      'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isStudent
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-sm'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm'
                    )}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Reply box */}
      <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900">
        <div className="flex gap-2 items-end">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              conversation.status === 'closed'
                ? 'This conversation is closed.'
                : 'Type a message… (⌘↵ to send)'
            }
            disabled={conversation.status === 'closed'}
            rows={2}
            className="flex-1 resize-none text-sm min-h-[60px] max-h-32"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim() || conversation.status === 'closed' || sendMutation.isPending}
            className="h-9 px-3 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline ml-1">Send</span>
          </Button>
        </div>
        {sendMutation.error instanceof Error && (
          <p className="text-xs text-rose-500 mt-1.5">{sendMutation.error.message}</p>
        )}
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1.5">Press Ctrl+Enter to send quickly</p>
      </div>

      <ReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        currentAssignee={conversation.assignee}
        onConfirm={(agent) => {
          // agent is the ID of the agent we want to reassign to
          onReassign?.(conversation.id, agent);
          setReassignOpen(false);
        }}
      />
    </div>
  );
}
