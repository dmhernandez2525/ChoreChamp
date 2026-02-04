export type SupportThreadStatus = 'open' | 'pending' | 'closed';
export type SupportPriority = 'standard' | 'priority';
export type SupportSenderRole = 'member' | 'support' | 'system';

export interface SupportThread {
  id: string;
  householdId: string;
  createdByMemberId: string;
  subject: string;
  status: SupportThreadStatus;
  priority: SupportPriority;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage {
  id: string;
  threadId: string;
  householdId: string;
  senderMemberId: string | null;
  senderRole: SupportSenderRole;
  body: string;
  createdAt: Date;
}

export interface CreateSupportThreadRequest {
  subject: string;
  message: string;
}

export interface CreateSupportMessageRequest {
  message: string;
}

export interface SupportThreadWithMessages {
  thread: SupportThread;
  messages: SupportMessage[];
}
