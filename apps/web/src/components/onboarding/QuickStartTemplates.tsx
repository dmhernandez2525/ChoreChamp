import { useState } from 'react';

interface ChoreTemplate {
  id: string;
  title: string;
  icon: string;
  pointValue: number;
  category: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  chores: ChoreTemplate[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'young-kids',
    name: 'Young Kids (4-7)',
    icon: '👶',
    description: 'Simple, age-appropriate tasks',
    chores: [
      { id: 't1', title: 'Make Bed', icon: '🛏️', pointValue: 10, category: 'bedroom' },
      { id: 't2', title: 'Put Away Toys', icon: '🧸', pointValue: 10, category: 'bedroom' },
      { id: 't3', title: 'Feed Pet', icon: '🐕', pointValue: 15, category: 'pet_care' },
      { id: 't4', title: 'Set Table', icon: '🍽️', pointValue: 10, category: 'kitchen' },
      { id: 't5', title: 'Water Plants', icon: '🌱', pointValue: 10, category: 'outdoor' },
    ],
  },
  {
    id: 'tweens',
    name: 'Tweens (8-12)',
    icon: '🧒',
    description: 'More responsibility and independence',
    chores: [
      { id: 't6', title: 'Make Bed', icon: '🛏️', pointValue: 10, category: 'bedroom' },
      { id: 't7', title: 'Clean Room', icon: '🧹', pointValue: 25, category: 'bedroom' },
      { id: 't8', title: 'Load Dishwasher', icon: '🍽️', pointValue: 15, category: 'kitchen' },
      { id: 't9', title: 'Take Out Trash', icon: '🗑️', pointValue: 15, category: 'general' },
      { id: 't10', title: 'Fold Laundry', icon: '👕', pointValue: 20, category: 'laundry' },
      { id: 't11', title: 'Walk Dog', icon: '🐕', pointValue: 20, category: 'pet_care' },
      { id: 't12', title: 'Homework', icon: '📚', pointValue: 30, category: 'general' },
    ],
  },
  {
    id: 'teens',
    name: 'Teens (13+)',
    icon: '🧑',
    description: 'Full household responsibilities',
    chores: [
      { id: 't13', title: 'Clean Bathroom', icon: '🚿', pointValue: 30, category: 'bathroom' },
      { id: 't14', title: 'Vacuum House', icon: '🧹', pointValue: 25, category: 'living_room' },
      { id: 't15', title: 'Mow Lawn', icon: '🌿', pointValue: 40, category: 'outdoor' },
      { id: 't16', title: 'Cook Dinner', icon: '🍳', pointValue: 35, category: 'kitchen' },
      { id: 't17', title: 'Do Laundry', icon: '🧺', pointValue: 30, category: 'laundry' },
      { id: 't18', title: 'Wash Car', icon: '🚗', pointValue: 35, category: 'outdoor' },
      { id: 't19', title: 'Grocery Shopping', icon: '🛒', pointValue: 30, category: 'general' },
    ],
  },
];

interface QuickStartTemplatesProps {
  onSelectTemplates: (templates: ChoreTemplate[]) => void;
  onSkip: () => void;
}

export function QuickStartTemplates({ onSelectTemplates, onSkip }: QuickStartTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedChores, setSelectedChores] = useState<Set<string>>(new Set());

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Pre-select all chores in the category
    const category = TEMPLATE_CATEGORIES.find((c) => c.id === categoryId);
    if (category) {
      setSelectedChores(new Set(category.chores.map((c) => c.id)));
    }
  };

  const toggleChore = (choreId: string) => {
    const newSelected = new Set(selectedChores);
    if (newSelected.has(choreId)) {
      newSelected.delete(choreId);
    } else {
      newSelected.add(choreId);
    }
    setSelectedChores(newSelected);
  };

  const handleContinue = () => {
    const category = TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory);
    if (category) {
      const selected = category.chores.filter((c) => selectedChores.has(c.id));
      onSelectTemplates(selected);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Quick Start Templates
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose age-appropriate chores to get started quickly
        </p>
      </div>

      {/* Category Selection */}
      {!selectedCategory && (
        <div className="grid gap-4">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-colors text-left"
            >
              <span className="text-4xl mr-4">{category.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {category.description}
                </p>
                <p className="text-primary-500 text-sm mt-1">
                  {category.chores.length} chores included
                </p>
              </div>
              <span className="text-gray-400 text-2xl">→</span>
            </button>
          ))}

          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2"
          >
            Skip - I'll add chores manually
          </button>
        </div>
      )}

      {/* Chore Selection */}
      {selectedCategory && (
        <div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-primary-500 hover:text-primary-600 mb-4 flex items-center gap-1"
          >
            ← Back to categories
          </button>

          <div className="grid gap-3 mb-6">
            {TEMPLATE_CATEGORIES.find((c) => c.id === selectedCategory)?.chores.map(
              (chore) => (
                <label
                  key={chore.id}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                    selectedChores.has(chore.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedChores.has(chore.id)}
                    onChange={() => toggleChore(chore.id)}
                    className="sr-only"
                  />
                  <span className="text-2xl mr-3">{chore.icon}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {chore.title}
                    </span>
                  </div>
                  <span className="text-primary-500 font-semibold">
                    +{chore.pointValue}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full ml-3 flex items-center justify-center ${
                      selectedChores.has(chore.id)
                        ? 'bg-primary-500 text-white'
                        : 'border-2 border-gray-300'
                    }`}
                  >
                    {selectedChores.has(chore.id) && '✓'}
                  </div>
                </label>
              )
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleContinue}
              disabled={selectedChores.size === 0}
              className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add {selectedChores.size} Chore{selectedChores.size !== 1 ? 's' : ''}
            </button>
            <button
              onClick={onSkip}
              className="px-6 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
