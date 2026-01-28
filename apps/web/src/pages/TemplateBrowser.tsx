import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import { useHousehold, useCreateChore } from '@chorechamp/api-client';
import type { ChoreCategory, Difficulty } from '@chorechamp/types';
import {
  TemplateFilters,
  TemplateGrid,
  TemplatePreviewModal,
  CHORE_TEMPLATES,
} from '../components/templates';
import type { ChoreTemplateData } from '../components/templates/templateData';
import { Skeleton } from '../components/common';

export default function TemplateBrowser() {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();

  const { data: household, isLoading } = useHousehold(householdId!);
  const createChore = useCreateChore(householdId!);

  // Filter state
  const [category, setCategory] = useState<ChoreCategory | 'all'>('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [age, setAge] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [previewTemplate, setPreviewTemplate] = useState<ChoreTemplateData | null>(
    null
  );
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddTemplate = async (template: ChoreTemplateData) => {
    setAddingId(template.id);
    try {
      await createChore.mutateAsync({
        title: template.title,
        description: template.description,
        icon: template.icon,
        category: template.category,
        pointValue: template.pointValue,
        difficulty: template.difficulty,
        estimatedMinutes: template.estimatedMinutes,
        steps: template.steps,
        requiresApproval: true,
        recurrenceType: 'daily',
      });

      // Close preview if open
      setPreviewTemplate(null);

      // Navigate back to household
      navigate(`/households/${householdId}`);
    } catch (error) {
      console.error('Failed to add template:', error);
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Chore Templates</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/households/${householdId}/chores/new`}>
              Create Custom Chore
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Info banner */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-900">Quick Start Templates</h2>
            <p className="mt-1 text-sm text-blue-700">
              Choose from {CHORE_TEMPLATES.length} pre-built chore templates. Each
              includes suggested steps, point values, and age recommendations. Click
              "Add" to create the chore in your household.
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <TemplateFilters
              selectedCategory={category}
              selectedDifficulty={difficulty}
              selectedAge={age}
              searchQuery={searchQuery}
              onCategoryChange={setCategory}
              onDifficultyChange={setDifficulty}
              onAgeChange={setAge}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Template Grid */}
          <TemplateGrid
            templates={CHORE_TEMPLATES}
            category={category}
            difficulty={difficulty}
            age={age}
            searchQuery={searchQuery}
            onPreview={setPreviewTemplate}
            onAdd={handleAddTemplate}
            addingId={addingId}
          />
        </div>
      </main>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onAdd={() => previewTemplate && handleAddTemplate(previewTemplate)}
        isAdding={addingId === previewTemplate?.id}
      />
    </div>
  );
}
