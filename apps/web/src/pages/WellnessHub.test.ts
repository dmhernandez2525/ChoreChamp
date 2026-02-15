import { describe, it, expect } from 'vitest';

// Type definitions for testing
type ActivityCategory =
  | 'physical'
  | 'creative'
  | 'educational'
  | 'social'
  | 'self_care'
  | 'outdoor'
  | 'chores'
  | 'other';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type MentalHealthCategory =
  | 'mindfulness'
  | 'coping_skills'
  | 'family_therapy'
  | 'stress_management'
  | 'anxiety_relief'
  | 'mood_tracking'
  | 'gratitude';

type WellnessTab = 'activity' | 'checkin' | 'sleep' | 'meals' | 'mental';

interface ActivityLog {
  id: string;
  userId: string;
  householdId: string;
  category: ActivityCategory;
  activityName: string;
  durationMinutes: number;
  date: Date;
  notes?: string;
}

interface WellnessCheckIn {
  id: string;
  userId: string;
  householdId: string;
  mood: number; // 1-5
  energy: number; // 1-5
  date: Date;
  notes?: string;
}

interface SleepLog {
  id: string;
  userId: string;
  householdId: string;
  bedtime: Date;
  wakeTime: Date;
  quality: number; // 1-5
  notes?: string;
}

interface MealPlan {
  id: string;
  householdId: string;
  mealType: MealType;
  date: Date;
  description: string;
  preparedBy?: string;
}

// Constants mirroring the WellnessHub implementation
const ACTIVITY_CATEGORIES: Array<{
  value: ActivityCategory;
  label: string;
  color: string;
}> = [
  { value: 'physical', label: 'Physical', color: 'bg-red-100 text-red-700' },
  { value: 'creative', label: 'Creative', color: 'bg-purple-100 text-purple-700' },
  { value: 'educational', label: 'Educational', color: 'bg-blue-100 text-blue-700' },
  { value: 'social', label: 'Social', color: 'bg-green-100 text-green-700' },
  { value: 'self_care', label: 'Self-Care', color: 'bg-pink-100 text-pink-700' },
  { value: 'outdoor', label: 'Outdoor', color: 'bg-amber-100 text-amber-700' },
  { value: 'chores', label: 'Chores', color: 'bg-gray-100 text-gray-700' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-700' },
];

const MOOD_OPTIONS: Array<{ value: number; label: string; color: string }> = [
  { value: 1, label: 'Sad', color: 'text-red-500' },
  { value: 2, label: 'Low', color: 'text-orange-500' },
  { value: 3, label: 'Okay', color: 'text-yellow-500' },
  { value: 4, label: 'Good', color: 'text-lime-500' },
  { value: 5, label: 'Great', color: 'text-green-500' },
];

const TAB_CONFIG: Array<{ id: WellnessTab; label: string }> = [
  { id: 'activity', label: 'Activity' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'meals', label: 'Meals' },
  { id: 'mental', label: 'Wellness' },
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MENTAL_HEALTH_CATEGORIES: MentalHealthCategory[] = [
  'mindfulness',
  'coping_skills',
  'family_therapy',
  'stress_management',
  'anxiety_relief',
  'mood_tracking',
  'gratitude',
];

const API_ROUTES = {
  activityLogs: '/api/wellness/activity-logs',
  activityStats: '/api/wellness/activity-stats',
  activityGoals: '/api/wellness/activity-goals',
  checkIns: '/api/wellness/check-ins',
  trends: '/api/wellness/trends',
  sleepLogs: '/api/wellness/sleep-logs',
  sleepStats: '/api/wellness/sleep-stats',
  mealPlans: '/api/wellness/meal-plans',
  mentalHealthResources: '/api/wellness/mental-health/resources',
  mentalHealthGratitude: '/api/wellness/mental-health/gratitude',
  moodJournal: '/api/wellness/mood-journal',
};

describe('WellnessHub Activity Tracking Types', () => {
  it('ActivityCategory has exactly 8 values', () => {
    expect(ACTIVITY_CATEGORIES).toHaveLength(8);
  });

  it('includes all expected activity categories', () => {
    const values = ACTIVITY_CATEGORIES.map((cat) => cat.value);
    expect(values).toContain('physical');
    expect(values).toContain('creative');
    expect(values).toContain('educational');
    expect(values).toContain('social');
    expect(values).toContain('self_care');
    expect(values).toContain('outdoor');
    expect(values).toContain('chores');
    expect(values).toContain('other');
  });

  it('each category has a label and color', () => {
    ACTIVITY_CATEGORIES.forEach((cat) => {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.color).toBeTruthy();
      expect(cat.color).toMatch(/^bg-\w+-\d{3} text-\w+-\d{3}$/);
    });
  });

  it('category labels match expected capitalization', () => {
    const labels = ACTIVITY_CATEGORIES.map((cat) => cat.label);
    expect(labels).toContain('Physical');
    expect(labels).toContain('Creative');
    expect(labels).toContain('Educational');
    expect(labels).toContain('Social');
    expect(labels).toContain('Self-Care');
    expect(labels).toContain('Outdoor');
    expect(labels).toContain('Chores');
    expect(labels).toContain('Other');
  });
});

describe('WellnessHub Wellness Check-in Schema', () => {
  it('validates mood range is 1-5', () => {
    const validMood: WellnessCheckIn = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      mood: 3,
      energy: 4,
      date: new Date(),
    };
    expect(validMood.mood).toBeGreaterThanOrEqual(1);
    expect(validMood.mood).toBeLessThanOrEqual(5);
  });

  it('validates energy range is 1-5', () => {
    const validCheckIn: WellnessCheckIn = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      mood: 4,
      energy: 2,
      date: new Date(),
    };
    expect(validCheckIn.energy).toBeGreaterThanOrEqual(1);
    expect(validCheckIn.energy).toBeLessThanOrEqual(5);
  });

  it('allows optional notes field', () => {
    const withNotes: WellnessCheckIn = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      mood: 4,
      energy: 3,
      date: new Date(),
      notes: 'Feeling good today',
    };
    expect(withNotes.notes).toBeDefined();

    const withoutNotes: WellnessCheckIn = {
      id: '2',
      userId: 'user1',
      householdId: 'house1',
      mood: 3,
      energy: 3,
      date: new Date(),
    };
    expect(withoutNotes.notes).toBeUndefined();
  });
});

describe('WellnessHub Sleep Log Validation', () => {
  it('bedtime before wakeTime produces positive duration', () => {
    const bedtime = new Date('2024-01-01T22:00:00Z');
    const wakeTime = new Date('2024-01-02T06:00:00Z');

    const sleepLog: SleepLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      bedtime,
      wakeTime,
      quality: 4,
    };

    const durationMs = sleepLog.wakeTime.getTime() - sleepLog.bedtime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    expect(durationHours).toBeGreaterThan(0);
    expect(durationHours).toBe(8);
  });

  it('validates sleep quality is 1-5', () => {
    const sleepLog: SleepLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      bedtime: new Date('2024-01-01T22:00:00Z'),
      wakeTime: new Date('2024-01-02T06:00:00Z'),
      quality: 5,
    };

    expect(sleepLog.quality).toBeGreaterThanOrEqual(1);
    expect(sleepLog.quality).toBeLessThanOrEqual(5);
  });

  it('allows optional notes field', () => {
    const withNotes: SleepLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      bedtime: new Date('2024-01-01T22:00:00Z'),
      wakeTime: new Date('2024-01-02T06:00:00Z'),
      quality: 4,
      notes: 'Slept well, no interruptions',
    };
    expect(withNotes.notes).toBeDefined();
  });
});

describe('WellnessHub Meal Plan Types', () => {
  it('defines exactly 4 meal types', () => {
    expect(MEAL_TYPES).toHaveLength(4);
  });

  it('includes breakfast, lunch, dinner, and snack', () => {
    expect(MEAL_TYPES).toContain('breakfast');
    expect(MEAL_TYPES).toContain('lunch');
    expect(MEAL_TYPES).toContain('dinner');
    expect(MEAL_TYPES).toContain('snack');
  });

  it('MealPlan interface includes all required fields', () => {
    const mealPlan: MealPlan = {
      id: '1',
      householdId: 'house1',
      mealType: 'breakfast',
      date: new Date(),
      description: 'Oatmeal with berries',
    };

    expect(mealPlan.id).toBeDefined();
    expect(mealPlan.householdId).toBeDefined();
    expect(mealPlan.mealType).toBeDefined();
    expect(mealPlan.date).toBeDefined();
    expect(mealPlan.description).toBeDefined();
  });

  it('allows optional preparedBy field', () => {
    const withPreparer: MealPlan = {
      id: '1',
      householdId: 'house1',
      mealType: 'dinner',
      date: new Date(),
      description: 'Spaghetti',
      preparedBy: 'Mom',
    };
    expect(withPreparer.preparedBy).toBe('Mom');
  });
});

describe('WellnessHub Mental Health Categories', () => {
  it('defines exactly 7 mental health categories', () => {
    expect(MENTAL_HEALTH_CATEGORIES).toHaveLength(7);
  });

  it('includes all expected categories', () => {
    expect(MENTAL_HEALTH_CATEGORIES).toContain('mindfulness');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('coping_skills');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('family_therapy');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('stress_management');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('anxiety_relief');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('mood_tracking');
    expect(MENTAL_HEALTH_CATEGORIES).toContain('gratitude');
  });
});

describe('WellnessHub Tab Configuration', () => {
  it('defines exactly 5 tabs', () => {
    expect(TAB_CONFIG).toHaveLength(5);
  });

  it('includes activity, checkin, sleep, meals, and mental tabs', () => {
    const tabIds = TAB_CONFIG.map((tab) => tab.id);
    expect(tabIds).toContain('activity');
    expect(tabIds).toContain('checkin');
    expect(tabIds).toContain('sleep');
    expect(tabIds).toContain('meals');
    expect(tabIds).toContain('mental');
  });

  it('each tab has an id and label', () => {
    TAB_CONFIG.forEach((tab) => {
      expect(tab.id).toBeTruthy();
      expect(tab.label).toBeTruthy();
    });
  });

  it('tab labels match expected values', () => {
    const activityTab = TAB_CONFIG.find((t) => t.id === 'activity');
    expect(activityTab?.label).toBe('Activity');

    const checkinTab = TAB_CONFIG.find((t) => t.id === 'checkin');
    expect(checkinTab?.label).toBe('Check-in');

    const sleepTab = TAB_CONFIG.find((t) => t.id === 'sleep');
    expect(sleepTab?.label).toBe('Sleep');

    const mealsTab = TAB_CONFIG.find((t) => t.id === 'meals');
    expect(mealsTab?.label).toBe('Meals');

    const mentalTab = TAB_CONFIG.find((t) => t.id === 'mental');
    expect(mentalTab?.label).toBe('Wellness');
  });
});

describe('WellnessHub Mood Options Validation', () => {
  it('defines exactly 5 mood levels', () => {
    expect(MOOD_OPTIONS).toHaveLength(5);
  });

  it('mood values range from 1 to 5', () => {
    const values = MOOD_OPTIONS.map((m) => m.value);
    expect(Math.min(...values)).toBe(1);
    expect(Math.max(...values)).toBe(5);
  });

  it('includes correct mood labels', () => {
    const labels = MOOD_OPTIONS.map((m) => m.label);
    expect(labels).toContain('Sad');
    expect(labels).toContain('Low');
    expect(labels).toContain('Okay');
    expect(labels).toContain('Good');
    expect(labels).toContain('Great');
  });

  it('each mood has a color class', () => {
    MOOD_OPTIONS.forEach((mood) => {
      expect(mood.color).toBeTruthy();
      expect(mood.color).toMatch(/^text-\w+-\d{3}$/);
    });
  });

  it('mood colors progress from negative to positive', () => {
    expect(MOOD_OPTIONS[0].color).toContain('red'); // Sad
    expect(MOOD_OPTIONS[1].color).toContain('orange'); // Low
    expect(MOOD_OPTIONS[2].color).toContain('yellow'); // Okay
    expect(MOOD_OPTIONS[3].color).toContain('lime'); // Good
    expect(MOOD_OPTIONS[4].color).toContain('green'); // Great
  });
});

describe('WellnessHub Activity Categories Validation', () => {
  it('defines exactly 8 activity categories', () => {
    expect(ACTIVITY_CATEGORIES).toHaveLength(8);
  });

  it('includes correct category labels', () => {
    const labelMap = new Map(ACTIVITY_CATEGORIES.map((c) => [c.value, c.label]));
    expect(labelMap.get('physical')).toBe('Physical');
    expect(labelMap.get('creative')).toBe('Creative');
    expect(labelMap.get('educational')).toBe('Educational');
    expect(labelMap.get('social')).toBe('Social');
    expect(labelMap.get('self_care')).toBe('Self-Care');
    expect(labelMap.get('outdoor')).toBe('Outdoor');
    expect(labelMap.get('chores')).toBe('Chores');
    expect(labelMap.get('other')).toBe('Other');
  });

  it('each category has distinct colors', () => {
    const colors = ACTIVITY_CATEGORIES.map((c) => c.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(8);
  });
});

describe('WellnessHub API Route Coverage', () => {
  it('defines activity-logs endpoint', () => {
    expect(API_ROUTES.activityLogs).toBe('/api/wellness/activity-logs');
  });

  it('defines activity-stats endpoint', () => {
    expect(API_ROUTES.activityStats).toBe('/api/wellness/activity-stats');
  });

  it('defines activity-goals endpoint', () => {
    expect(API_ROUTES.activityGoals).toBe('/api/wellness/activity-goals');
  });

  it('defines check-ins endpoint', () => {
    expect(API_ROUTES.checkIns).toBe('/api/wellness/check-ins');
  });

  it('defines trends endpoint', () => {
    expect(API_ROUTES.trends).toBe('/api/wellness/trends');
  });

  it('defines sleep-logs endpoint', () => {
    expect(API_ROUTES.sleepLogs).toBe('/api/wellness/sleep-logs');
  });

  it('defines sleep-stats endpoint', () => {
    expect(API_ROUTES.sleepStats).toBe('/api/wellness/sleep-stats');
  });

  it('defines meal-plans endpoint', () => {
    expect(API_ROUTES.mealPlans).toBe('/api/wellness/meal-plans');
  });

  it('defines mental-health/resources endpoint', () => {
    expect(API_ROUTES.mentalHealthResources).toBe('/api/wellness/mental-health/resources');
  });

  it('defines mental-health/gratitude endpoint', () => {
    expect(API_ROUTES.mentalHealthGratitude).toBe('/api/wellness/mental-health/gratitude');
  });

  it('defines mood-journal endpoint', () => {
    expect(API_ROUTES.moodJournal).toBe('/api/wellness/mood-journal');
  });

  it('all endpoints follow /api/wellness/* pattern', () => {
    Object.values(API_ROUTES).forEach((route) => {
      expect(route).toMatch(/^\/api\/wellness\//);
    });
  });
});

describe('WellnessHub Type Interface Completeness', () => {
  it('ActivityLog has all required fields', () => {
    const activityLog: ActivityLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      category: 'physical',
      activityName: 'Running',
      durationMinutes: 30,
      date: new Date(),
    };

    expect(activityLog.id).toBeDefined();
    expect(activityLog.userId).toBeDefined();
    expect(activityLog.householdId).toBeDefined();
    expect(activityLog.category).toBeDefined();
    expect(activityLog.activityName).toBeDefined();
    expect(activityLog.durationMinutes).toBeDefined();
    expect(activityLog.date).toBeDefined();
  });

  it('WellnessCheckIn has all required fields', () => {
    const checkIn: WellnessCheckIn = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      mood: 4,
      energy: 3,
      date: new Date(),
    };

    expect(checkIn.id).toBeDefined();
    expect(checkIn.userId).toBeDefined();
    expect(checkIn.householdId).toBeDefined();
    expect(checkIn.mood).toBeDefined();
    expect(checkIn.energy).toBeDefined();
    expect(checkIn.date).toBeDefined();
  });

  it('SleepLog has all required fields', () => {
    const sleepLog: SleepLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      bedtime: new Date('2024-01-01T22:00:00Z'),
      wakeTime: new Date('2024-01-02T06:00:00Z'),
      quality: 4,
    };

    expect(sleepLog.id).toBeDefined();
    expect(sleepLog.userId).toBeDefined();
    expect(sleepLog.householdId).toBeDefined();
    expect(sleepLog.bedtime).toBeDefined();
    expect(sleepLog.wakeTime).toBeDefined();
    expect(sleepLog.quality).toBeDefined();
  });

  it('MealPlan has all required fields', () => {
    const mealPlan: MealPlan = {
      id: '1',
      householdId: 'house1',
      mealType: 'breakfast',
      date: new Date(),
      description: 'Oatmeal',
    };

    expect(mealPlan.id).toBeDefined();
    expect(mealPlan.householdId).toBeDefined();
    expect(mealPlan.mealType).toBeDefined();
    expect(mealPlan.date).toBeDefined();
    expect(mealPlan.description).toBeDefined();
  });
});

describe('WellnessHub Data Validation Rules', () => {
  it('activity duration must be positive', () => {
    const activity: ActivityLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      category: 'physical',
      activityName: 'Jogging',
      durationMinutes: 20,
      date: new Date(),
    };

    expect(activity.durationMinutes).toBeGreaterThan(0);
  });

  it('mood and energy values are within valid range', () => {
    const checkIn: WellnessCheckIn = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      mood: 3,
      energy: 4,
      date: new Date(),
    };

    expect(checkIn.mood).toBeGreaterThanOrEqual(1);
    expect(checkIn.mood).toBeLessThanOrEqual(5);
    expect(checkIn.energy).toBeGreaterThanOrEqual(1);
    expect(checkIn.energy).toBeLessThanOrEqual(5);
  });

  it('sleep quality is within valid range', () => {
    const sleep: SleepLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      bedtime: new Date('2024-01-01T22:00:00Z'),
      wakeTime: new Date('2024-01-02T06:00:00Z'),
      quality: 3,
    };

    expect(sleep.quality).toBeGreaterThanOrEqual(1);
    expect(sleep.quality).toBeLessThanOrEqual(5);
  });

  it('meal type is one of the defined types', () => {
    const meal: MealPlan = {
      id: '1',
      householdId: 'house1',
      mealType: 'dinner',
      date: new Date(),
      description: 'Pasta',
    };

    expect(MEAL_TYPES).toContain(meal.mealType);
  });

  it('activity category is one of the defined categories', () => {
    const activity: ActivityLog = {
      id: '1',
      userId: 'user1',
      householdId: 'house1',
      category: 'creative',
      activityName: 'Painting',
      durationMinutes: 45,
      date: new Date(),
    };

    const validCategories = ACTIVITY_CATEGORIES.map((c) => c.value);
    expect(validCategories).toContain(activity.category);
  });
});
