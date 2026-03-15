import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DependencyPicker } from '../DependencyPicker';
import type { Chore } from '@chorechamp/types';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    size?: string;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  Link: ({ className }: { className?: string }) => <svg data-testid="link-icon" className={className} />,
  Unlink: ({ className }: { className?: string }) => <svg data-testid="unlink-icon" className={className} />,
  ArrowRight: ({ className }: { className?: string }) => <svg data-testid="arrow-right-icon" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <svg data-testid="alert-icon" className={className} />,
  Search: ({ className }: { className?: string }) => <svg data-testid="search-icon" className={className} />,
}));

function createMockChore(overrides: Partial<Chore> = {}): Chore {
  return {
    id: 'chore-1',
    householdId: 'household-1',
    title: 'Default Chore',
    description: null,
    icon: '🏠',
    category: 'general',
    pointValue: 10,
    difficulty: 'medium',
    assignedTo: [],
    assignmentType: 'anyone',
    rotationIndex: 0,
    recurrenceType: 'once',
    recurrenceDays: null,
    recurrenceInterval: null,
    recurrenceAfterDays: null,
    startDate: '2026-03-14',
    endDate: null,
    dueTime: null,
    timeWindowMinutes: null,
    requiresApproval: false,
    requiresPhoto: false,
    estimatedMinutes: null,
    priority: 'medium',
    boardOrder: 0,
    showTimer: false,
    steps: null,
    createdBy: 'user-1',
    isActive: true,
    templateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockDeps = [
  {
    id: 'dep-1',
    choreId: 'chore-main',
    dependsOnChoreId: 'chore-2',
    type: 'blocks',
    relatedChoreTitle: 'Wash Dishes',
    relatedChoreIcon: '🍽️',
  },
  {
    id: 'dep-2',
    choreId: 'chore-main',
    dependsOnChoreId: 'chore-3',
    type: 'blocked_by',
    relatedChoreTitle: 'Buy Soap',
    relatedChoreIcon: '🧼',
  },
];

const availableChores = [
  createMockChore({ id: 'chore-4', title: 'Vacuum Floor', icon: '🧹' }),
  createMockChore({ id: 'chore-5', title: 'Mop Kitchen', icon: '🧽' }),
  createMockChore({ id: 'chore-6', title: 'Take Out Trash', icon: '🗑️' }),
];

describe('DependencyPicker', () => {
  const mockOnAdd = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dependency picker container', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    expect(screen.getByTestId('dependency-picker')).toBeInTheDocument();
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
  });

  it('shows empty state when no dependencies', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    expect(screen.getByText('No dependencies linked')).toBeInTheDocument();
  });

  it('renders existing dependencies', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={mockDeps}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    expect(screen.getByText('Wash Dishes')).toBeInTheDocument();
    expect(screen.getByText('Buy Soap')).toBeInTheDocument();
    expect(screen.getByText('🍽️')).toBeInTheDocument();
    expect(screen.getByText('🧼')).toBeInTheDocument();
  });

  it('renders dependency type labels', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={mockDeps}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    expect(screen.getByText('blocks')).toBeInTheDocument();
    expect(screen.getByText('blocked by')).toBeInTheDocument();
  });

  it('calls onRemoveDependency when remove button clicked', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={mockDeps}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    const removeButtons = screen.getAllByLabelText('Remove dependency');
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemove).toHaveBeenCalledWith('dep-1');
  });

  it('opens add form when Link button is clicked', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));

    expect(screen.getByPlaceholderText('Search chores...')).toBeInTheDocument();
    // Button text includes emoji + label, so use substring matching
    expect(screen.getByText(/Blocks/)).toBeInTheDocument();
    expect(screen.getByText(/Blocked by/)).toBeInTheDocument();
    expect(screen.getByText(/Related to/)).toBeInTheDocument();
  });

  it('shows Cancel text when add form is open', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows available chores in the add form', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));

    expect(screen.getByText('Vacuum Floor')).toBeInTheDocument();
    expect(screen.getByText('Mop Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Take Out Trash')).toBeInTheDocument();
  });

  it('filters chores by search term', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));
    fireEvent.change(screen.getByPlaceholderText('Search chores...'), { target: { value: 'vacuum' } });

    expect(screen.getByText('Vacuum Floor')).toBeInTheDocument();
    expect(screen.queryByText('Mop Kitchen')).not.toBeInTheDocument();
    expect(screen.queryByText('Take Out Trash')).not.toBeInTheDocument();
  });

  it('shows no matching chores message when search has no results', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));
    fireEvent.change(screen.getByPlaceholderText('Search chores...'), { target: { value: 'zzzzz' } });

    expect(screen.getByText('No matching chores')).toBeInTheDocument();
  });

  it('calls onAddDependency when a chore is selected', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));
    fireEvent.click(screen.getByText('Vacuum Floor'));

    expect(mockOnAdd).toHaveBeenCalledWith('chore-4', 'blocks');
  });

  it('calls onAddDependency with selected type', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));
    fireEvent.click(screen.getByText(/Related to/));
    fireEvent.click(screen.getByText('Mop Kitchen'));

    expect(mockOnAdd).toHaveBeenCalledWith('chore-5', 'relates_to');
  });

  it('closes add form after selecting a chore', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));
    fireEvent.click(screen.getByText('Vacuum Floor'));

    expect(screen.queryByPlaceholderText('Search chores...')).not.toBeInTheDocument();
  });

  it('excludes already linked chores from the list', () => {
    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[
          {
            id: 'dep-1',
            choreId: 'chore-main',
            dependsOnChoreId: 'chore-4',
            type: 'blocks',
            relatedChoreTitle: 'Vacuum Floor',
            relatedChoreIcon: '🧹',
          },
        ]}
        availableChores={availableChores}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));

    // Vacuum Floor (chore-4) should be excluded
    const choreButtons = screen.getAllByRole('button');
    const choreTexts = choreButtons.map(b => b.textContent);
    expect(choreTexts).not.toContain('🧹Vacuum Floor');
    expect(screen.getByText('Mop Kitchen')).toBeInTheDocument();
  });

  it('excludes self from available chores', () => {
    const choresIncludingSelf = [
      ...availableChores,
      createMockChore({ id: 'chore-main', title: 'Self Chore', icon: '🔄' }),
    ];

    render(
      <DependencyPicker
        choreId="chore-main"
        dependencies={[]}
        availableChores={choresIncludingSelf}
        onAddDependency={mockOnAdd}
        onRemoveDependency={mockOnRemove}
      />
    );

    fireEvent.click(screen.getByText('Link'));

    expect(screen.queryByText('Self Chore')).not.toBeInTheDocument();
  });
});
