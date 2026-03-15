import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutomationRuleBuilder } from '../AutomationRuleBuilder';

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
  Settings: ({ className }: { className?: string }) => <svg data-testid="settings-icon" className={className} />,
}));

describe('AutomationRuleBuilder', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form with "New Automation Rule" title when no initialData', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('New Automation Rule')).toBeInTheDocument();
  });

  it('renders "Edit Rule" title when initialData is provided', () => {
    const initialData = {
      name: 'Test Rule',
      description: 'A test',
      trigger: 'chore_completed' as const,
      triggerConfig: {},
      action: 'assign' as const,
      actionConfig: {},
      enabled: true,
    };

    render(
      <AutomationRuleBuilder
        initialData={initialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Rule')).toBeInTheDocument();
  });

  it('renders Rule Name input', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Rule Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Auto-assign kitchen chores')).toBeInTheDocument();
  });

  it('renders Description textarea', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Description (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What does this rule do?')).toBeInTheDocument();
  });

  it('renders trigger section with "When (Trigger)" heading', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('When (Trigger)')).toBeInTheDocument();
  });

  it('renders action section with "Then (Action)" heading', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Then (Action)')).toBeInTheDocument();
  });

  it('renders all trigger options in the select', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const triggerSelect = screen.getAllByRole('combobox')[0];
    const options = triggerSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map(o => o.textContent);

    expect(optionTexts).toContain('Chore Completed');
    expect(optionTexts).toContain('Chore Created');
    expect(optionTexts).toContain('Due Date Passed');
    expect(optionTexts).toContain('Status Changed');
    expect(optionTexts).toContain('Chore Assigned');
  });

  it('renders all action options in the select', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const actionSelect = screen.getAllByRole('combobox')[1];
    const options = actionSelect.querySelectorAll('option');
    const optionTexts = Array.from(options).map(o => o.textContent);

    expect(optionTexts).toContain('Assign to Member');
    expect(optionTexts).toContain('Change Status');
    expect(optionTexts).toContain('Add Tag');
    expect(optionTexts).toContain('Send Notification');
    expect(optionTexts).toContain('Set Priority');
    expect(optionTexts).toContain('Create Chore');
  });

  it('renders enable/disable toggle defaulting to enabled', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Rule is enabled')).toBeInTheDocument();
  });

  it('toggles enabled state when switch is clicked', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Rule is disabled')).toBeInTheDocument();
  });

  it('renders Cancel and Create Rule buttons', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Create Rule')).toBeInTheDocument();
  });

  it('renders "Update Rule" button when editing', () => {
    const initialData = {
      name: 'Existing',
      description: '',
      trigger: 'chore_completed' as const,
      triggerConfig: {},
      action: 'assign' as const,
      actionConfig: {},
      enabled: true,
    };

    render(
      <AutomationRuleBuilder
        initialData={initialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Update Rule')).toBeInTheDocument();
  });

  it('disables Create Rule button when name is empty', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const createBtn = screen.getByText('Create Rule');
    expect(createBtn.closest('button')).toBeDisabled();
  });

  it('enables Create Rule button when name is filled', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Auto-assign kitchen chores'), {
      target: { value: 'My Rule' },
    });

    const createBtn = screen.getByText('Create Rule');
    expect(createBtn.closest('button')).not.toBeDisabled();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with form data when Create Rule is clicked', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Auto-assign kitchen chores'), {
      target: { value: 'My New Rule' },
    });
    fireEvent.change(screen.getByPlaceholderText('What does this rule do?'), {
      target: { value: 'This is a description' },
    });

    fireEvent.click(screen.getByText('Create Rule'));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My New Rule',
        description: 'This is a description',
        trigger: 'chore_completed',
        action: 'assign',
        enabled: true,
      })
    );
  });

  it('does not call onSave when name is empty (whitespace only)', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Auto-assign kitchen chores'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByText('Create Rule'));

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows "Saving..." when isSaving is true', () => {
    render(
      <AutomationRuleBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        isSaving={true}
      />
    );

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('populates form fields from initialData', () => {
    const initialData = {
      name: 'Pre-filled Name',
      description: 'Pre-filled description',
      trigger: 'due_date_passed' as const,
      triggerConfig: { hoursAfter: 24 },
      action: 'send_notification' as const,
      actionConfig: { message: 'Overdue!' },
      enabled: false,
    };

    render(
      <AutomationRuleBuilder
        initialData={initialData}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('Pre-filled Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Pre-filled description')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('changes trigger type when selecting a different option', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const triggerSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(triggerSelect, { target: { value: 'status_changed' } });

    // Trigger config for status_changed should show status fields
    expect(screen.getByPlaceholderText('e.g. todo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. in_progress')).toBeInTheDocument();
  });

  it('changes action type when selecting a different option', () => {
    render(<AutomationRuleBuilder onSave={mockOnSave} onCancel={mockOnCancel} />);

    const actionSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(actionSelect, { target: { value: 'add_tag' } });

    expect(screen.getByPlaceholderText('e.g. urgent')).toBeInTheDocument();
  });
});
