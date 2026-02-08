import { useMemo } from 'react';
import type { ChoreCategory, Difficulty } from '@chorechamp/types';
import { TemplateCard } from './TemplateCard';
import type { ChoreTemplateData } from './templateData';

interface TemplateGridProps {
  templates: ChoreTemplateData[];
  category: ChoreCategory | 'all';
  difficulty: Difficulty | 'all';
  age: number | null;
  searchQuery: string;
  onPreview: (template: ChoreTemplateData) => void;
  onAdd: (template: ChoreTemplateData) => void;
  addingId: string | null;
}

export function TemplateGrid({
  templates,
  category,
  difficulty,
  age,
  searchQuery,
  onPreview,
  onAdd,
  addingId,
}: TemplateGridProps) {
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      // Category filter
      if (category !== 'all' && t.category !== category) return false;

      // Difficulty filter
      if (difficulty !== 'all' && t.difficulty !== difficulty) return false;

      // Age filter
      if (age !== null) {
        if (t.minAge && age < t.minAge) return false;
        if (t.maxAge && age > t.maxAge) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesTags = t.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesDesc && !matchesTags) return false;
      }

      return true;
    });
  }, [templates, category, difficulty, age, searchQuery]);

  if (filteredTemplates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="text-4xl mb-2">🔍</div>
        <h3 className="font-medium text-gray-900">No templates found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredTemplates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPreview={() => onPreview(template)}
          onAdd={() => onAdd(template)}
          isAdding={addingId === template.id}
        />
      ))}
    </div>
  );
}
