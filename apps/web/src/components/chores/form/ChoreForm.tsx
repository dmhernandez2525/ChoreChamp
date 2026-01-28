import { useState } from 'react';
import { Button } from '@chorechamp/ui';
import type {
  ChoreCategory,
  Difficulty,
  RecurrenceType,
  AssignmentType,
  Member,
  CreateChoreRequest,
} from '@chorechamp/types';
import { IconPicker } from './IconPicker';
import { CategoryPicker } from './CategoryPicker';
import { DifficultyPicker } from './DifficultyPicker';
import { AssignmentPicker } from './AssignmentPicker';
import { SchedulePicker } from './SchedulePicker';

interface ChoreFormProps {
  members: Member[];
  onSubmit: (data: CreateChoreRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateChoreRequest>;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function ChoreForm({
  members,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
  mode = 'create',
}: ChoreFormProps) {
  // Basic info
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || '✨');
  const [category, setCategory] = useState<ChoreCategory>(
    initialData?.category || 'general'
  );

  // Points & difficulty
  const [pointValue, setPointValue] = useState(initialData?.pointValue || 10);
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialData?.difficulty || 'medium'
  );

  // Assignment
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    initialData?.assignmentType || 'anyone'
  );
  const [assignedTo, setAssignedTo] = useState<string[]>(
    initialData?.assignedTo || []
  );

  // Schedule
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(
    initialData?.recurrenceType || 'daily'
  );
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(
    initialData?.recurrenceDays || []
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<number | null>(
    initialData?.recurrenceInterval || null
  );
  const [recurrenceAfterDays, setRecurrenceAfterDays] = useState<number | null>(
    initialData?.recurrenceAfterDays || null
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getTodayDate()
  );
  const [endDate, setEndDate] = useState<string | null>(
    initialData?.endDate || null
  );
  const [dueTime, setDueTime] = useState<string | null>(
    initialData?.dueTime || null
  );

  // Requirements
  const [requiresApproval, setRequiresApproval] = useState(
    initialData?.requiresApproval ?? true
  );
  const [requiresPhoto, setRequiresPhoto] = useState(
    initialData?.requiresPhoto ?? false
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(
    initialData?.estimatedMinutes || undefined
  );

  // ADHD settings
  const [showTimer, setShowTimer] = useState(initialData?.showTimer ?? false);
  const [steps, setSteps] = useState<string[]>(initialData?.steps || []);
  const [newStep, setNewStep] = useState('');

  // Error state
  const [error, setError] = useState('');

  // Steps management
  const addStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, newStep.trim()]);
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < steps.length) {
      [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!title.trim()) {
      setError('Please enter a chore title');
      return;
    }

    if (
      (assignmentType === 'specific' || assignmentType === 'rotation') &&
      assignedTo.length === 0
    ) {
      setError('Please select at least one family member');
      return;
    }

    const data: CreateChoreRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      icon,
      category,
      pointValue,
      difficulty,
      assignmentType,
      assignedTo: assignmentType === 'anyone' ? undefined : assignedTo,
      recurrenceType,
      recurrenceDays: recurrenceDays.length > 0 ? recurrenceDays : undefined,
      recurrenceInterval: recurrenceInterval || undefined,
      recurrenceAfterDays: recurrenceAfterDays || undefined,
      startDate,
      endDate: endDate || undefined,
      dueTime: dueTime || undefined,
      requiresApproval,
      requiresPhoto,
      estimatedMinutes: estimatedMinutes || undefined,
      showTimer,
      steps: steps.length > 0 ? steps : undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError('Failed to save chore. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          Basic Information
        </h3>

        <div className="flex gap-4">
          <IconPicker value={icon} onChange={setIcon} category={category} />
          <div className="flex-1">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Chore Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Make your bed"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional details or instructions..."
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      {/* Section 2: Difficulty & Points */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          Difficulty & Points
        </h3>

        <DifficultyPicker
          value={difficulty}
          onChange={setDifficulty}
          onPointsChange={setPointValue}
        />

        <div>
          <label
            htmlFor="points"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Points Earned
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="points"
              min="1"
              max="100"
              value={pointValue}
              onChange={(e) => setPointValue(parseInt(e.target.value) || 1)}
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center"
            />
            <span className="text-gray-600">points</span>
          </div>
        </div>
      </div>

      {/* Section 3: Assignment */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Assignment</h3>

        <AssignmentPicker
          type={assignmentType}
          selectedMembers={assignedTo}
          members={members}
          onTypeChange={setAssignmentType}
          onMembersChange={setAssignedTo}
        />
      </div>

      {/* Section 4: Schedule */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Schedule</h3>

        <SchedulePicker
          recurrenceType={recurrenceType}
          recurrenceDays={recurrenceDays}
          recurrenceInterval={recurrenceInterval}
          recurrenceAfterDays={recurrenceAfterDays}
          startDate={startDate}
          endDate={endDate}
          dueTime={dueTime}
          onRecurrenceTypeChange={setRecurrenceType}
          onRecurrenceDaysChange={setRecurrenceDays}
          onRecurrenceIntervalChange={setRecurrenceInterval}
          onRecurrenceAfterDaysChange={setRecurrenceAfterDays}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDueTimeChange={setDueTime}
        />
      </div>

      {/* Section 5: Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          Requirements
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Requires Approval</span>
              <p className="text-sm text-gray-500">
                A parent must verify completion before awarding points
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresPhoto}
              onChange={(e) => setRequiresPhoto(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-900">Requires Photo</span>
              <p className="text-sm text-gray-500">
                Must upload a photo as proof of completion
              </p>
            </div>
          </label>
        </div>

        <div>
          <label
            htmlFor="estimatedMinutes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Estimated Time (optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="estimatedMinutes"
              min="1"
              max="480"
              value={estimatedMinutes || ''}
              onChange={(e) =>
                setEstimatedMinutes(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              placeholder="10"
              className="w-24 rounded-md border border-gray-300 px-3 py-2 text-center"
            />
            <span className="text-gray-600">minutes</span>
          </div>
        </div>
      </div>

      {/* Section 6: ADHD Helper Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
          ADHD Helper Settings
        </h3>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showTimer}
            onChange={(e) => setShowTimer(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="font-medium text-gray-900">Show Timer</span>
            <p className="text-sm text-gray-500">
              Display a countdown or stopwatch while doing this chore
            </p>
          </div>
        </label>

        {/* Step-by-step instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Step-by-Step Instructions (optional)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Break down the chore into smaller steps for easier completion
          </p>

          {steps.length > 0 && (
            <div className="space-y-2 mb-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{step}</span>
                  <div className="flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveStep(index, 'up')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move up"
                      >
                        ↑
                      </button>
                    )}
                    {index < steps.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveStep(index, 'down')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Move down"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStep();
                }
              }}
              placeholder="Add a step..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <Button type="button" variant="outline" onClick={addStep}>
              Add Step
            </Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'edit'
              ? 'Saving...'
              : 'Creating...'
            : mode === 'edit'
            ? 'Save Changes'
            : 'Create Chore'}
        </Button>
      </div>
    </form>
  );
}
