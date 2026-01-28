import { Button } from '@chorechamp/ui';
import type { ChoreTemplateData } from './templateData';
import { DifficultyIndicator } from '../adhd';

interface TemplateCardProps {
  template: ChoreTemplateData;
  onPreview: () => void;
  onAdd: () => void;
  isAdding?: boolean;
}

export function TemplateCard({
  template,
  onPreview,
  onAdd,
  isAdding,
}: TemplateCardProps) {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-2xl">
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{template.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyIndicator difficulty={template.difficulty} size="sm" />
        <span className="text-xs text-gray-500">
          ~{template.estimatedMinutes} min
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-yellow-600">
          <span>⭐</span>
          {template.pointValue}
        </span>
      </div>

      {/* Age range */}
      {template.minAge && (
        <div className="mt-2 text-xs text-gray-500">
          Ages {template.minAge}
          {template.maxAge ? `-${template.maxAge}` : '+'}
        </div>
      )}

      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onPreview}
        >
          Preview
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={onAdd}
          disabled={isAdding}
        >
          {isAdding ? 'Adding...' : '+ Add'}
        </Button>
      </div>
    </div>
  );
}
