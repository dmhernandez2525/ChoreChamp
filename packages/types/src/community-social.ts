// F16.1 Community Forums
export type ForumCategory = 'general' | 'tips' | 'questions' | 'showcase' | 'feedback' | 'off_topic';

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  category: ForumCategory;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  likeCount: number;
  replyCount: number;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  likeCount: number;
  parentReplyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateForumPostRequest {
  category: ForumCategory;
  title: string;
  content: string;
  tags?: string[];
}

export interface CreateForumReplyRequest {
  content: string;
  parentReplyId?: string | null;
}

// F16.2 Social Family Challenges
export type SocialChallengeType = 'competitive' | 'collaborative' | 'milestone';
export type SocialChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface SocialChallenge {
  id: string;
  title: string;
  description: string;
  challengeType: SocialChallengeType;
  status: SocialChallengeStatus;
  targetValue: number;
  metric: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  createdById: string;
  prize: string | null;
  createdAt: string;
}

export interface SocialChallengeParticipant {
  householdId: string;
  householdName: string;
  currentValue: number;
  rank: number;
  joinedAt: string;
}

export interface CreateSocialChallengeRequest {
  title: string;
  description: string;
  challengeType: SocialChallengeType;
  targetValue: number;
  metric: string;
  startDate: string;
  endDate: string;
  prize?: string | null;
}

// F16.3 Social Sharing
export type ShareType = 'achievement' | 'milestone' | 'streak' | 'badge' | 'challenge_win' | 'custom';
export type ShareVisibility = 'public' | 'friends' | 'private';

export interface SocialPost {
  id: string;
  householdId: string;
  authorId: string;
  authorName: string;
  shareType: ShareType;
  visibility: ShareVisibility;
  title: string;
  content: string;
  imageUrl: string | null;
  referenceId: string | null;
  referenceType: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface SocialComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface CreateSocialPostRequest {
  shareType: ShareType;
  visibility: ShareVisibility;
  title: string;
  content: string;
  imageUrl?: string | null;
  referenceId?: string | null;
  referenceType?: string | null;
}

export interface CreateSocialCommentRequest {
  content: string;
}

// F16.4 Friend System
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface FriendConnection {
  id: string;
  requesterHouseholdId: string;
  requesterHouseholdName: string;
  recipientHouseholdId: string;
  recipientHouseholdName: string;
  status: FriendRequestStatus;
  message: string | null;
  connectedAt: string | null;
  createdAt: string;
}

export interface CreateFriendRequestPayload {
  recipientHouseholdId: string;
  message?: string | null;
}

export interface FriendSuggestion {
  householdId: string;
  householdName: string;
  memberCount: number;
  mutualFriends: number;
  reason: string;
}

// F16.5 Community Events
export type CommunityEventType = 'cleanup' | 'fundraiser' | 'competition' | 'workshop' | 'social' | 'other';
export type CommunityEventStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  eventType: CommunityEventType;
  status: CommunityEventStatus;
  startDate: string;
  endDate: string;
  location: string | null;
  isVirtual: boolean;
  maxParticipants: number | null;
  currentParticipants: number;
  organizerHouseholdId: string;
  organizerName: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface CommunityEventParticipation {
  eventId: string;
  householdId: string;
  householdName: string;
  status: 'registered' | 'attending' | 'completed' | 'no_show';
  registeredAt: string;
}

export interface CreateCommunityEventRequest {
  title: string;
  description: string;
  eventType: CommunityEventType;
  startDate: string;
  endDate: string;
  location?: string | null;
  isVirtual?: boolean;
  maxParticipants?: number | null;
  imageUrl?: string | null;
}
