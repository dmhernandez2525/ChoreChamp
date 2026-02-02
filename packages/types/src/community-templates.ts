/**
 * Community Templates - F8.2
 * Share and discover chore templates from the community
 */

// Template visibility and sharing
export type TemplateVisibility = 'private' | 'public' | 'unlisted';
export type TemplateCategory =
  | 'daily-routines'
  | 'weekly-cleaning'
  | 'seasonal'
  | 'organization'
  | 'outdoor'
  | 'kids-friendly'
  | 'pet-care'
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'living-areas'
  | 'laundry'
  | 'special-occasions'
  | 'other';

export type AgeRange = 'toddler' | 'child' | 'preteen' | 'teen' | 'adult' | 'all-ages';

// Community template structure
export interface CommunityTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  ageRange: AgeRange;
  estimatedDuration: number; // minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;

  // Template content
  steps: TemplateStep[];
  tips: string[];
  supplies: string[];

  // Author info
  authorId: string;
  authorName: string;
  householdId: string | null; // null if author deleted household

  // Sharing settings
  visibility: TemplateVisibility;
  tags: string[];

  // Stats
  downloads: number;
  ratings: TemplateRating;
  favorites: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface TemplateStep {
  order: number;
  instruction: string;
  tips?: string;
  imageUrl?: string;
}

export interface TemplateRating {
  average: number;
  count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// User's rating/review
export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review: string | null;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// Template download/import record
export interface TemplateDownload {
  id: string;
  templateId: string;
  userId: string;
  householdId: string;
  downloadedAt: string;
  importedAsChoreId: string | null;
}

// User's favorite templates
export interface TemplateFavorite {
  id: string;
  templateId: string;
  userId: string;
  createdAt: string;
}

// Search and filter
export interface TemplateSearchParams {
  query?: string;
  category?: TemplateCategory;
  ageRange?: AgeRange;
  minRating?: number;
  maxDuration?: number;
  difficulty?: number;
  tags?: string[];
  sortBy?: 'popular' | 'recent' | 'rating' | 'downloads';
  page?: number;
  limit?: number;
}

export interface TemplateSearchResult {
  templates: CommunityTemplate[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Featured/curated collections
export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  templateIds: string[];
  featured: boolean;
  createdAt: string;
}

// User's published templates overview
export interface MyTemplatesOverview {
  published: CommunityTemplate[];
  drafts: CommunityTemplate[];
  stats: {
    totalDownloads: number;
    totalRatings: number;
    averageRating: number;
    totalFavorites: number;
  };
}

// Request/response types
export interface CreateCommunityTemplateRequest {
  name: string;
  description: string;
  category: TemplateCategory;
  ageRange: AgeRange;
  estimatedDuration: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number;
  steps: Omit<TemplateStep, 'order'>[];
  tips: string[];
  supplies: string[];
  visibility: TemplateVisibility;
  tags: string[];
}

export interface UpdateCommunityTemplateRequest {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  ageRange?: AgeRange;
  estimatedDuration?: number;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  points?: number;
  steps?: Omit<TemplateStep, 'order'>[];
  tips?: string[];
  supplies?: string[];
  visibility?: TemplateVisibility;
  tags?: string[];
}

export interface SubmitReviewRequest {
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
}

export interface ImportTemplateRequest {
  householdId: string;
  customizations?: {
    name?: string;
    points?: number;
    assignedTo?: string;
  };
}

// Helper constants
export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'daily-routines', label: 'Daily Routines', icon: 'sun' },
  { value: 'weekly-cleaning', label: 'Weekly Cleaning', icon: 'calendar' },
  { value: 'seasonal', label: 'Seasonal', icon: 'leaf' },
  { value: 'organization', label: 'Organization', icon: 'folder' },
  { value: 'outdoor', label: 'Outdoor', icon: 'tree' },
  { value: 'kids-friendly', label: 'Kids Friendly', icon: 'smile' },
  { value: 'pet-care', label: 'Pet Care', icon: 'heart' },
  { value: 'kitchen', label: 'Kitchen', icon: 'utensils' },
  { value: 'bathroom', label: 'Bathroom', icon: 'droplet' },
  { value: 'bedroom', label: 'Bedroom', icon: 'bed' },
  { value: 'living-areas', label: 'Living Areas', icon: 'sofa' },
  { value: 'laundry', label: 'Laundry', icon: 'shirt' },
  { value: 'special-occasions', label: 'Special Occasions', icon: 'star' },
  { value: 'other', label: 'Other', icon: 'more-horizontal' },
];

export const AGE_RANGES: { value: AgeRange; label: string; minAge: number; maxAge: number | null }[] = [
  { value: 'toddler', label: 'Toddler (2-4)', minAge: 2, maxAge: 4 },
  { value: 'child', label: 'Child (5-8)', minAge: 5, maxAge: 8 },
  { value: 'preteen', label: 'Preteen (9-12)', minAge: 9, maxAge: 12 },
  { value: 'teen', label: 'Teen (13-17)', minAge: 13, maxAge: 17 },
  { value: 'adult', label: 'Adult (18+)', minAge: 18, maxAge: null },
  { value: 'all-ages', label: 'All Ages', minAge: 0, maxAge: null },
];

// Helper functions
export function getCategoryLabel(category: TemplateCategory): string {
  return TEMPLATE_CATEGORIES.find((c) => c.value === category)?.label || category;
}

export function getAgeRangeLabel(ageRange: AgeRange): string {
  return AGE_RANGES.find((a) => a.value === ageRange)?.label || ageRange;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getDifficultyLabel(difficulty: number): string {
  const labels = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];
  return labels[difficulty - 1] || 'Unknown';
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function isAgeAppropriate(ageRange: AgeRange, userAge: number): boolean {
  if (ageRange === 'all-ages') return true;
  const range = AGE_RANGES.find((a) => a.value === ageRange);
  if (!range) return true;
  if (userAge < range.minAge) return false;
  if (range.maxAge !== null && userAge > range.maxAge) return false;
  return true;
}
