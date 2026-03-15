import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock react-router-dom
const mockUseParams = vi.fn().mockReturnValue({ householdId: 'hh-1' });
vi.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock auth context
const mockUser = { id: 'user-1', email: 'test@example.com' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock UI components
vi.mock('@chorechamp/ui', () => ({
  Button: ({ children, onClick, disabled, _asChild, className, ...props }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    _asChild?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock family components
vi.mock('../components/family', () => ({
  MemberList: ({ members, isParent }: {
    members: unknown[];
    currentUserId?: string;
    isParent: boolean;
    onEditMember: (m: unknown) => void;
    onRemoveMember?: (id: string) => void;
  }) => (
    <div data-testid="member-list">
      <span data-testid="member-count">{members.length} members</span>
      {isParent && <span data-testid="parent-controls">parent controls</span>}
    </div>
  ),
  AddMemberModal: ({ open, onClose }: { open: boolean; onClose: () => void; onSubmit: unknown }) => (
    open ? <div data-testid="add-member-modal"><button onClick={onClose}>Close</button></div> : null
  ),
  EditMemberModal: ({ member, onClose }: { member: unknown; onClose: () => void; onSubmit: unknown }) => (
    member ? <div data-testid="edit-member-modal"><button onClick={onClose}>Close</button></div> : null
  ),
  InviteCodeSection: ({ inviteCodes, isGenerating }: { inviteCodes: unknown[]; onGenerateCode: unknown; isGenerating: boolean }) => (
    <div data-testid="invite-code-section">
      <span>{inviteCodes.length} codes</span>
      {isGenerating && <span>Generating...</span>}
    </div>
  ),
}));

// Mock common components
vi.mock('../components/common', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// API client mocks
const mockHouseholdData = { id: 'hh-1', name: 'Smith Family' };
const mockMembersData = [
  { id: 'm-1', userId: 'user-1', name: 'Dad', role: 'parent', color: '#blue' },
  { id: 'm-2', userId: 'user-2', name: 'Emma', role: 'child', color: '#pink' },
];
const mockInviteCodes = [{ id: 'inv-1', code: 'ABC123', role: 'child' }];

let mockHousehold = { data: mockHouseholdData, isLoading: false };
let mockMembers = { data: mockMembersData, isLoading: false };
let mockInvites = { data: mockInviteCodes, isLoading: false };
const mockAddMemberMutate = vi.fn().mockResolvedValue(undefined);
const mockUpdateMemberMutate = vi.fn().mockResolvedValue(undefined);
const mockDeleteMemberMutate = vi.fn().mockResolvedValue(undefined);
const mockCreateInviteCodeMutate = vi.fn().mockResolvedValue(undefined);

vi.mock('@chorechamp/api-client', () => ({
  useHousehold: () => mockHousehold,
  useMembers: () => mockMembers,
  useInviteCodes: () => mockInvites,
  useAddMember: () => ({ mutateAsync: mockAddMemberMutate }),
  useUpdateMember: () => ({ mutateAsync: mockUpdateMemberMutate }),
  useDeleteMember: () => ({ mutateAsync: mockDeleteMemberMutate }),
  useCreateInviteCode: () => ({ mutateAsync: mockCreateInviteCodeMutate }),
}));

import FamilyManagement from './FamilyManagement';

describe('FamilyManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHousehold = { data: mockHouseholdData, isLoading: false };
    mockMembers = { data: mockMembersData, isLoading: false };
    mockInvites = { data: mockInviteCodes, isLoading: false };
  });

  it('renders the page title and household name', () => {
    render(<FamilyManagement />);
    expect(screen.getByText('Family Management')).toBeInTheDocument();
    expect(screen.getByText('Smith Family')).toBeInTheDocument();
  });

  it('renders loading skeletons when data is loading', () => {
    mockHousehold = { data: undefined as unknown as typeof mockHouseholdData, isLoading: true };
    mockMembers = { data: undefined as unknown as typeof mockMembersData, isLoading: true };
    render(<FamilyManagement />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Family Management')).not.toBeInTheDocument();
  });

  it('renders "Household not found" when household is null', () => {
    mockHousehold = { data: undefined as unknown as typeof mockHouseholdData, isLoading: false };
    render(<FamilyManagement />);
    expect(screen.getByText('Household not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('shows the Members tab with member list', () => {
    render(<FamilyManagement />);
    expect(screen.getByText('Members (2)')).toBeInTheDocument();
    expect(screen.getByTestId('member-list')).toBeInTheDocument();
    expect(screen.getByTestId('member-count')).toHaveTextContent('2 members');
  });

  it('shows parent controls when current user is a parent', () => {
    render(<FamilyManagement />);
    expect(screen.getByTestId('parent-controls')).toBeInTheDocument();
    expect(screen.getByText('+ Add Member')).toBeInTheDocument();
  });

  it('hides parent controls when current user is not a parent', () => {
    mockMembers = {
      data: [
        { id: 'm-1', userId: 'user-1', name: 'Emma', role: 'child', color: '#pink' },
      ],
      isLoading: false,
    };
    render(<FamilyManagement />);
    expect(screen.queryByTestId('parent-controls')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Add Member')).not.toBeInTheDocument();
  });

  it('shows empty state when there are no members', () => {
    mockMembers = { data: [], isLoading: false };
    render(<FamilyManagement />);
    expect(screen.getByText('No members yet')).toBeInTheDocument();
    expect(screen.getByText('Add family members to start assigning chores.')).toBeInTheDocument();
  });

  it('opens the add member modal when "+ Add Member" is clicked', async () => {
    const user = userEvent.setup();
    render(<FamilyManagement />);

    expect(screen.queryByTestId('add-member-modal')).not.toBeInTheDocument();
    await user.click(screen.getByText('+ Add Member'));
    expect(screen.getByTestId('add-member-modal')).toBeInTheDocument();
  });

  it('switches to the Invites tab when clicked (parent only)', async () => {
    const user = userEvent.setup();
    render(<FamilyManagement />);

    expect(screen.getByText('Invite Codes')).toBeInTheDocument();
    await user.click(screen.getByText('Invite Codes'));
    expect(screen.getByTestId('invite-code-section')).toBeInTheDocument();
  });

  it('does not show Invite Codes tab for non-parent users', () => {
    mockMembers = {
      data: [
        { id: 'm-1', userId: 'user-1', name: 'Emma', role: 'child', color: '#pink' },
      ],
      isLoading: false,
    };
    render(<FamilyManagement />);
    expect(screen.queryByText('Invite Codes')).not.toBeInTheDocument();
  });
});
