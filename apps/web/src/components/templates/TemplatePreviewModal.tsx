import { Button } from '@chorechamp/ui';
import type { ChoreTemplateData } from './templateData';
import { DifficultyIndicator } from '../adhd';

interface TemplatePreviewModalProps {
  template: ChoreTemplateData | null;
  onClose: () => void;
  onAdd: () => void;
  isAdding?: boolean;
}

export function TemplatePreviewModal({
  template,
  onClose,
  onAdd,
  isAdding,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-start gap-4 border-b p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100 text-4xl">
              {template.icon}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{template.title}</h2>
              <p className="mt-1 text-gray-600">{template.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3">
              <DifficultyIndicator difficulty={template.difficulty} />
              <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm">
                <span>⏱️</span>
                <span>~{template.estimatedMinutes} min</span>
              </span>
              <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">
                <span>⭐</span>
                <span>{template.pointValue} points</span>
              </span>
            </div>

            {/* Age range */}
            {template.minAge && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>👶</span>
                <span>
                  Recommended for ages {template.minAge}
                  {template.maxAge ? `-${template.maxAge}` : '+'}
                </span>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-600"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Steps */}
            {template.steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Steps</h3>
                <ol className="space-y-2">
                  {template.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t p-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onAdd} disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add to Household'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
