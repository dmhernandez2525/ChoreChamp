import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutomationRuleList } from '../AutomationRuleList';
import type { AutomationRule } from '../../../lib/api';

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
  Zap: ({ className }: { className?: string }) => <svg data-testid="zap-icon" className={className} />,
  Pencil: ({ className }: { className?: string }) => <svg data-testid="pencil-icon" className={className} />,
  Trash2: ({ className }: { className?: string }) => <svg data-testid="trash-icon" className={className} />,
  Plus: ({ className }: { className?: string }) => <svg data-testid="plus-icon" className={className} />,
}));

function createMockRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 'rule-1',
    householdId: 'h-1',
    name: 'Auto-assign dishes',
    description: 'Assigns dishes to next person in rotation',
    trigger: 'chore_completed',
    triggerConfig: {},
    action: 'assign',
    actionConfig: {},
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('AutomationRuleList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggle = vi.fn();
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no rules', () => {
    render(
      <AutomationRuleList
        rules={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('No automation rules yet')).toBeInTheDocument();
    expect(
      screen.getByText('Create rules to automate repetitive tasks in your household.')
    ).toBeInTheDocument();
  });

  it('renders Create Rule button in empty state', () => {
    render(
      <AutomationRuleList
        rules={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('Create Rule')).toBeInTheDocument();
  });

  it('calls onCreate when Create Rule is clicked in empty state', () => {
    render(
      <AutomationRuleList
        rules={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    fireEvent.click(screen.getByText('Create Rule'));

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it('renders rules list with count', () => {
    const rules = [createMockRule(), createMockRule({ id: 'rule-2', name: 'Second rule' })];

    render(
      <AutomationRuleList
        rules={rules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('Automation Rules (2)')).toBeInTheDocument();
  });

  it('renders Add Rule button when rules exist', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule()]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('Add Rule')).toBeInTheDocument();
  });

  it('calls onCreate when Add Rule is clicked', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule()]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    fireEvent.click(screen.getByText('Add Rule'));

    expect(mockOnCreate).toHaveBeenCalledTimes(1);
  });

  it('renders rule name', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ name: 'My Rule Name' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('My Rule Name')).toBeInTheDocument();
  });

  it('renders rule description', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ description: 'A helpful description' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('A helpful description')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ description: null })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.queryByText('null')).not.toBeInTheDocument();
  });

  it('renders trigger and action labels', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ trigger: 'chore_completed', action: 'assign' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('When: Chore Completed')).toBeInTheDocument();
    expect(screen.getByText('Then: Assign to Member')).toBeInTheDocument();
  });

  it('renders raw trigger/action values for unknown types', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ trigger: 'custom_trigger', action: 'custom_action' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('When: custom_trigger')).toBeInTheDocument();
    expect(screen.getByText('Then: custom_action')).toBeInTheDocument();
  });

  it('renders toggle switch for enabled rule', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ enabled: true })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveAttribute('aria-label', 'Disable rule');
  });

  it('renders toggle switch for disabled rule', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ enabled: false })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('aria-label', 'Enable rule');
  });

  it('calls onToggle when toggle switch is clicked', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ id: 'rule-abc' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    fireEvent.click(screen.getByRole('switch'));

    expect(mockOnToggle).toHaveBeenCalledWith('rule-abc');
  });

  it('calls onEdit when edit button is clicked', () => {
    const rule = createMockRule();

    render(
      <AutomationRuleList
        rules={[rule]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    fireEvent.click(screen.getByLabelText('Edit rule'));

    expect(mockOnEdit).toHaveBeenCalledWith(rule);
  });

  it('requires two clicks to delete (confirm pattern)', () => {
    render(
      <AutomationRuleList
        rules={[createMockRule({ id: 'rule-del' })]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    // First click shows confirm state
    fireEvent.click(screen.getByLabelText('Delete rule'));
    expect(mockOnDelete).not.toHaveBeenCalled();

    // Second click confirms deletion
    fireEvent.click(screen.getByLabelText('Confirm delete'));
    expect(mockOnDelete).toHaveBeenCalledWith('rule-del');
  });

  it('renders multiple rules', () => {
    const rules = [
      createMockRule({ id: 'r1', name: 'Rule One' }),
      createMockRule({ id: 'r2', name: 'Rule Two' }),
      createMockRule({ id: 'r3', name: 'Rule Three' }),
    ];

    render(
      <AutomationRuleList
        rules={rules}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onToggle={mockOnToggle}
        onCreate={mockOnCreate}
      />
    );

    expect(screen.getByText('Rule One')).toBeInTheDocument();
    expect(screen.getByText('Rule Two')).toBeInTheDocument();
    expect(screen.getByText('Rule Three')).toBeInTheDocument();
    expect(screen.getByText('Automation Rules (3)')).toBeInTheDocument();
  });
});
