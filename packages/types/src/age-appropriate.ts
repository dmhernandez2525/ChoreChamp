// Age group definitions
export type AgeGroup = 'toddler' | 'preschool' | 'early_elementary' | 'late_elementary' | 'middle_school' | 'high_school';

export interface AgeGroupConfig {
  id: AgeGroup;
  label: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export const AGE_GROUPS: AgeGroupConfig[] = [
  { id: 'toddler', label: 'Toddler', minAge: 2, maxAge: 3, description: 'Ages 2-3' },
  { id: 'preschool', label: 'Preschool', minAge: 4, maxAge: 5, description: 'Ages 4-5' },
  { id: 'early_elementary', label: 'Early Elementary', minAge: 6, maxAge: 8, description: 'Ages 6-8' },
  { id: 'late_elementary', label: 'Late Elementary', minAge: 9, maxAge: 11, description: 'Ages 9-11' },
  { id: 'middle_school', label: 'Middle School', minAge: 12, maxAge: 14, description: 'Ages 12-14' },
  { id: 'high_school', label: 'High School', minAge: 15, maxAge: 18, description: 'Ages 15-18' },
];

// Age suitability assessment
export type AgeSuitability = 'perfect' | 'suitable' | 'challenging' | 'too_young' | 'too_easy';

export interface AgeSuitabilityResult {
  suitability: AgeSuitability;
  message: string;
  ageGroup: AgeGroup | null;
}

// Chore recommendation based on age
export interface AgeAppropriateChore {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  pointValue: number;
  difficulty: string;
  estimatedMinutes: number | null;
  minAge: number | null;
  maxAge: number | null;
  suitability: AgeSuitability;
  suitabilityMessage: string;
  steps: string[] | null;
}

// Recommended chores grouped by category
export interface AgeRecommendations {
  memberId: string;
  memberName: string;
  memberAge: number;
  ageGroup: AgeGroup;
  ageGroupLabel: string;
  recommendations: {
    category: string;
    chores: AgeAppropriateChore[];
  }[];
  existingChoreIds: string[];
}

// Age guidelines for display
export interface AgeGuideline {
  ageGroup: AgeGroup;
  label: string;
  ageRange: string;
  skills: string[];
  sampleChores: string[];
  tips: string[];
}

export const AGE_GUIDELINES: AgeGuideline[] = [
  {
    ageGroup: 'toddler',
    label: 'Toddlers (2-3)',
    ageRange: '2-3 years',
    skills: ['Following simple instructions', 'Imitating adults', 'Basic motor skills'],
    sampleChores: ['Put toys in bin', 'Throw trash away', 'Help feed pets', 'Wipe up small spills'],
    tips: [
      'Keep tasks simple and one-step',
      'Use visual cues and pictures',
      'Make it a game',
      'Lots of praise and encouragement',
    ],
  },
  {
    ageGroup: 'preschool',
    label: 'Preschoolers (4-5)',
    ageRange: '4-5 years',
    skills: ['Following 2-3 step instructions', 'Basic sorting', 'Simple cleaning motions'],
    sampleChores: ['Make bed with help', 'Put clothes in hamper', 'Water plants', 'Set table', 'Dust low surfaces'],
    tips: [
      'Break tasks into small steps',
      'Use checklists with pictures',
      'Be patient with quality',
      'Work alongside them',
    ],
  },
  {
    ageGroup: 'early_elementary',
    label: 'Early Elementary (6-8)',
    ageRange: '6-8 years',
    skills: ['Reading simple instructions', 'Using basic tools', 'Time awareness', 'Working independently'],
    sampleChores: ['Make bed alone', 'Sort laundry', 'Empty dishwasher', 'Vacuum small areas', 'Pack lunch'],
    tips: [
      'Introduce chore charts',
      'Allow them to choose some chores',
      'Set clear expectations',
      'Praise effort, not just results',
    ],
  },
  {
    ageGroup: 'late_elementary',
    label: 'Late Elementary (9-11)',
    ageRange: '9-11 years',
    skills: ['Multi-step tasks', 'Using appliances safely', 'Time management', 'Taking initiative'],
    sampleChores: ['Clean bathroom', 'Mop floors', 'Help with cooking', 'Take out trash', 'Care for pets'],
    tips: [
      'Teach proper techniques',
      'Introduce cleaning products safely',
      'Allow more independence',
      'Connect chores to allowance',
    ],
  },
  {
    ageGroup: 'middle_school',
    label: 'Middle School (12-14)',
    ageRange: '12-14 years',
    skills: ['Complex tasks', 'Problem solving', 'Self-management', 'Teaching others'],
    sampleChores: ['Do laundry', 'Cook simple meals', 'Mow lawn', 'Clean entire rooms', 'Babysit siblings'],
    tips: [
      'Give more responsibility',
      'Allow scheduling flexibility',
      'Discuss why chores matter',
      'Rotate challenging tasks',
    ],
  },
  {
    ageGroup: 'high_school',
    label: 'High School (15-18)',
    ageRange: '15-18 years',
    skills: ['All household tasks', 'Financial responsibility', 'Meal planning', 'Home maintenance'],
    sampleChores: ['Plan and cook meals', 'Manage own laundry', 'Deep cleaning', 'Car maintenance', 'Grocery shopping'],
    tips: [
      'Prepare for independence',
      'Discuss adult responsibilities',
      'Allow ownership of tasks',
      'Connect to life skills',
    ],
  },
];

// Helper function to determine age group
export function getAgeGroup(age: number): AgeGroup | null {
  for (const group of AGE_GROUPS) {
    if (age >= group.minAge && age <= group.maxAge) {
      return group.id;
    }
  }
  return null;
}

// Helper function to assess chore suitability for an age
export function assessAgeSuitability(age: number, minAge: number | null, maxAge: number | null): AgeSuitabilityResult {
  const ageGroup = getAgeGroup(age);

  // No age restrictions - suitable for all
  if (minAge === null && maxAge === null) {
    return {
      suitability: 'suitable',
      message: 'Suitable for all ages',
      ageGroup,
    };
  }

  // Check if too young
  if (minAge !== null && age < minAge) {
    const yearsUntil = minAge - age;
    return {
      suitability: 'too_young',
      message: `Recommended for age ${minAge}+ (${yearsUntil} year${yearsUntil !== 1 ? 's' : ''} away)`,
      ageGroup,
    };
  }

  // Check if too easy (well above max age)
  if (maxAge !== null && age > maxAge + 3) {
    return {
      suitability: 'too_easy',
      message: `May be too easy - designed for ages ${maxAge} and under`,
      ageGroup,
    };
  }

  // Check if at upper end but still suitable
  if (maxAge !== null && age > maxAge) {
    return {
      suitability: 'suitable',
      message: `Designed for ages up to ${maxAge}, but still appropriate`,
      ageGroup,
    };
  }

  // Check if challenging (at lower end of age range)
  if (minAge !== null && age === minAge) {
    return {
      suitability: 'challenging',
      message: `At the minimum age - may need extra help`,
      ageGroup,
    };
  }

  // Perfect match
  return {
    suitability: 'perfect',
    message: 'Perfect for this age',
    ageGroup,
  };
}
