// Skill Building Pathways Types

export type SkillCategory = 'cooking' | 'cleaning' | 'organization' | 'laundry' | 'maintenance' | 'gardening' | 'pet_care' | 'first_aid' | 'budgeting' | 'time_management';

export type MasteryLevel = 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

export type CertificationStatus = 'not_started' | 'in_progress' | 'pending_review' | 'certified' | 'expired';

export interface SkillTree {
  id: string;
  householdId: string;
  category: SkillCategory;
  name: string;
  description: string;
  iconUrl?: string | null;
  colorTheme: string;
  totalSkills: number;
  totalXp: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  skillTreeId: string;
  householdId: string;
  name: string;
  description: string;
  iconUrl?: string | null;
  level: number;
  tier: number;
  xpRequired: number;
  prerequisites: string[];
  ageMinimum?: number | null;
  estimatedPracticeTime: number;
  videoTutorialUrl?: string | null;
  articleUrl?: string | null;
  tips: string[];
  safetyNotes?: string | null;
  linkedChoreIds: string[];
  isCore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberSkillProgress {
  id: string;
  memberId: string;
  skillId: string;
  householdId: string;
  status: SkillStatus;
  masteryLevel: MasteryLevel;
  currentXp: number;
  practiceCount: number;
  totalPracticeMinutes: number;
  lastPracticedAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  masteredAt?: Date | null;
  mentorId?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillPracticeLog {
  id: string;
  memberSkillProgressId: string;
  memberId: string;
  skillId: string;
  householdId: string;
  choreCompletionId?: string | null;
  durationMinutes: number;
  xpEarned: number;
  qualityRating?: number | null;
  selfAssessment?: number | null;
  mentorAssessment?: number | null;
  mentorId?: string | null;
  mentorFeedback?: string | null;
  photoProofUrl?: string | null;
  notes?: string | null;
  practicedAt: Date;
  createdAt: Date;
}

export interface SkillCertification {
  id: string;
  memberId: string;
  skillId: string;
  householdId: string;
  certificationName: string;
  status: CertificationStatus;
  assessmentScore?: number | null;
  assessmentPassingScore: number;
  assessmentAttempts: number;
  certifiedAt?: Date | null;
  certifiedById?: string | null;
  expiresAt?: Date | null;
  certificateUrl?: string | null;
  badgeIconUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillChallenge {
  id: string;
  skillId: string;
  householdId: string;
  title: string;
  description: string;
  challengeType: 'time_trial' | 'quality_check' | 'streak' | 'teaching' | 'assessment';
  difficulty: MasteryLevel;
  requirements: ChallengeRequirement[];
  xpReward: number;
  bonusReward?: number | null;
  badgeReward?: string | null;
  timeLimit?: number | null;
  maxAttempts?: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeRequirement {
  type: 'complete_count' | 'quality_rating' | 'time_limit' | 'mentor_approval' | 'streak_days';
  value: number;
  description: string;
}

export interface MemberChallengeProgress {
  id: string;
  memberId: string;
  challengeId: string;
  householdId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  currentProgress: number;
  targetProgress: number;
  attempts: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MentorshipRelation {
  id: string;
  mentorId: string;
  menteeId: string;
  skillId: string;
  householdId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  sessionsCompleted: number;
  totalSessionMinutes: number;
  mentorXpEarned: number;
  menteeXpEarned: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillBadge {
  id: string;
  skillId?: string | null;
  skillTreeId?: string | null;
  householdId: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirement: string;
  xpValue: number;
  isSecret: boolean;
  createdAt: Date;
}

export interface MemberSkillBadge {
  id: string;
  memberId: string;
  badgeId: string;
  householdId: string;
  earnedAt: Date;
  showcased: boolean;
  createdAt: Date;
}

export interface ExpertTip {
  id: string;
  skillId: string;
  householdId: string;
  title: string;
  content: string;
  category: 'safety' | 'efficiency' | 'quality' | 'beginner' | 'advanced';
  authorName?: string | null;
  sourceUrl?: string | null;
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Input types
export interface CreateSkillTreeInput {
  category: SkillCategory;
  name: string;
  description: string;
  iconUrl?: string;
  colorTheme: string;
}

export interface CreateSkillInput {
  skillTreeId: string;
  name: string;
  description: string;
  iconUrl?: string;
  level: number;
  tier: number;
  xpRequired: number;
  prerequisites?: string[];
  ageMinimum?: number;
  estimatedPracticeTime: number;
  videoTutorialUrl?: string;
  articleUrl?: string;
  tips?: string[];
  safetyNotes?: string;
  linkedChoreIds?: string[];
  isCore?: boolean;
}

export interface LogPracticeInput {
  skillId: string;
  memberId: string;
  durationMinutes: number;
  choreCompletionId?: string;
  qualityRating?: number;
  selfAssessment?: number;
  mentorId?: string;
  mentorAssessment?: number;
  mentorFeedback?: string;
  photoProofUrl?: string;
  notes?: string;
}

export interface CreateChallengeInput {
  skillId: string;
  title: string;
  description: string;
  challengeType: 'time_trial' | 'quality_check' | 'streak' | 'teaching' | 'assessment';
  difficulty: MasteryLevel;
  requirements: ChallengeRequirement[];
  xpReward: number;
  bonusReward?: number;
  badgeReward?: string;
  timeLimit?: number;
  maxAttempts?: number;
}

export interface CreateMentorshipInput {
  mentorId: string;
  menteeId: string;
  skillId: string;
}

// Constants
export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; icon: string; color: string }> = {
  cooking: { label: 'Cooking', icon: '\uD83C\uDF73', color: '#ef4444' },
  cleaning: { label: 'Cleaning', icon: '\uD83E\uDDF9', color: '#3b82f6' },
  organization: { label: 'Organization', icon: '\uD83D\uDCE6', color: '#8b5cf6' },
  laundry: { label: 'Laundry', icon: '\uD83E\uDDFA', color: '#06b6d4' },
  maintenance: { label: 'Home Maintenance', icon: '\uD83D\uDD27', color: '#f59e0b' },
  gardening: { label: 'Gardening', icon: '\uD83C\uDF31', color: '#22c55e' },
  pet_care: { label: 'Pet Care', icon: '\uD83D\uDC3E', color: '#ec4899' },
  first_aid: { label: 'First Aid', icon: '\uD83E\uDE79', color: '#dc2626' },
  budgeting: { label: 'Budgeting', icon: '\uD83D\uDCB0', color: '#16a34a' },
  time_management: { label: 'Time Management', icon: '\u231A', color: '#6366f1' },
};

export const MASTERY_LEVELS: Record<MasteryLevel, { label: string; minXp: number; color: string }> = {
  novice: { label: 'Novice', minXp: 0, color: '#9ca3af' },
  beginner: { label: 'Beginner', minXp: 100, color: '#22c55e' },
  intermediate: { label: 'Intermediate', minXp: 500, color: '#3b82f6' },
  advanced: { label: 'Advanced', minXp: 1500, color: '#8b5cf6' },
  expert: { label: 'Expert', minXp: 3500, color: '#f59e0b' },
  master: { label: 'Master', minXp: 7500, color: '#ef4444' },
};

export const XP_PER_PRACTICE_MINUTE = 2;
export const XP_BONUS_QUALITY_MULTIPLIER = 0.2;
export const XP_MENTOR_BONUS = 1.5;
export const XP_MENTEE_BONUS = 1.25;
