export type Role = 'student' | 'sales' | 'manager';
export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface ConversationPreview {
  id: string;
  subject: string;
  status: ConversationStatus;
  studentName: string;
  assignee: string | null;
  assigneeId: string | null;
  lastMessageTime: Date;
}
