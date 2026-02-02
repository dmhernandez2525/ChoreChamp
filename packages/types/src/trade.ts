// Chore Trade types

export type TradeStatus =
  | 'pending_recipient'     // Waiting for recipient to accept/decline
  | 'pending_approval'      // Recipient accepted, waiting for parent approval
  | 'approved'              // Parent approved, trade executed
  | 'rejected'              // Parent rejected
  | 'declined'              // Recipient declined
  | 'cancelled'             // Initiator cancelled
  | 'expired';              // Trade offer expired

export interface ChoreTrade {
  id: string;
  householdId: string;

  // The member proposing the trade
  initiatorMemberId: string;
  // The member receiving the trade offer
  recipientMemberId: string;

  // Chore being offered by initiator
  offeredChoreScheduleId: string;
  // Chore being requested from recipient (optional for one-way trades)
  requestedChoreScheduleId: string | null;

  // Points offered/requested as part of trade
  pointsOffered: number;
  pointsRequested: number;

  // Optional message explaining the trade
  message: string | null;

  status: TradeStatus;

  // Recipient response
  recipientRespondedAt: Date | null;

  // Parent approval
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  // Expiration
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Trade with populated relations
export interface TradeWithDetails extends ChoreTrade {
  initiator: {
    id: string;
    name: string;
    color: string;
  };
  recipient: {
    id: string;
    name: string;
    color: string;
  };
  offeredChore: {
    id: string;
    title: string;
    icon: string;
    pointValue: number;
    scheduledDate: string;
  };
  requestedChore: {
    id: string;
    title: string;
    icon: string;
    pointValue: number;
    scheduledDate: string;
  } | null;
  approver: {
    id: string;
    name: string;
  } | null;
}

// API Request types
export interface CreateTradeRequest {
  recipientMemberId: string;
  offeredChoreScheduleId: string;
  requestedChoreScheduleId?: string;
  pointsOffered?: number;
  pointsRequested?: number;
  message?: string;
  expiresInHours?: number; // Default 24 hours
}

export interface RespondToTradeRequest {
  accept: boolean;
  counterPointsOffered?: number;
  counterPointsRequested?: number;
}

export interface ApproveTradeRequest {
  approved: boolean;
  rejectionReason?: string;
}

// Response types
export interface TradeListResponse {
  incoming: TradeWithDetails[];
  outgoing: TradeWithDetails[];
  pendingApproval: TradeWithDetails[];
  history: TradeWithDetails[];
}

export interface TradeStatsResponse {
  totalTradesInitiated: number;
  totalTradesReceived: number;
  successfulTrades: number;
  pointsGainedFromTrades: number;
  pointsSpentOnTrades: number;
  mostTradedWith: {
    memberId: string;
    memberName: string;
    tradeCount: number;
  } | null;
}
