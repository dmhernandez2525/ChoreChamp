import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@chorechamp/ui';

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
  type?: 'text' | 'number' | 'date';
  className?: string;
  placeholder?: string;
}

export function InlineEditCell({
  value,
  onSave,
  type = 'text',
  className,
  placeholder = 'Click to edit',
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  }, [editValue, value, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
    if (e.key === 'Tab') {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full rounded border border-blue-400 bg-white px-2 py-1 text-sm outline-none ring-1 ring-blue-200',
          className
        )}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'w-full rounded px-2 py-1 text-left text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors',
        !value && 'text-gray-400 italic',
        className
      )}
      title="Click to edit"
    >
      {value || placeholder}
    </button>
  );
}

interface InlineSelectCellProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onSave: (value: string) => void;
  className?: string;
}

export function InlineSelectCell({ value, options, onSave, className }: InlineSelectCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleChange = (newValue: string) => {
    setIsEditing(false);
    if (newValue !== value) {
      onSave(newValue);
    }
  };

  const currentLabel = options.find(o => o.value === value)?.label ?? value;

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        className={cn(
          'w-full rounded border border-blue-400 bg-white px-1.5 py-1 text-sm outline-none ring-1 ring-blue-200',
          className
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'rounded px-2 py-1 text-left text-sm hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 transition-colors',
        className
      )}
      title="Click to change"
    >
      {currentLabel}
    </button>
  );
}
