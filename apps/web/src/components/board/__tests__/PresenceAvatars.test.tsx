import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresenceAvatars } from '../PresenceAvatars';

vi.mock('@chorechamp/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

interface TestMember {
  id: string;
  name: string;
  avatarUrl?: string;
  idle?: boolean;
  idleSince?: number | null;
}

function createMember(overrides: Partial<TestMember> = {}): TestMember {
  return {
    id: 'member-1',
    name: 'Alice Johnson',
    avatarUrl: undefined,
    idle: false,
    idleSince: null,
    ...overrides,
  };
}

describe('PresenceAvatars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when members array is empty', () => {
    const { container } = render(<PresenceAvatars members={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders the presence-avatars container', () => {
    const members = [createMember()];
    render(<PresenceAvatars members={members} />);

    expect(screen.getByTestId('presence-avatars')).toBeInTheDocument();
  });

  it('shows correct aria-label for one member', () => {
    const members = [createMember()];
    render(<PresenceAvatars members={members} />);

    expect(screen.getByLabelText('1 member viewing this board')).toBeInTheDocument();
  });

  it('shows correct aria-label for multiple members', () => {
    const members = [
      createMember({ id: 'm1', name: 'Alice' }),
      createMember({ id: 'm2', name: 'Bob' }),
    ];
    render(<PresenceAvatars members={members} />);

    expect(screen.getByLabelText('2 members viewing this board')).toBeInTheDocument();
  });

  it('renders initials for members without avatar URLs', () => {
    const members = [createMember({ name: 'Alice Johnson' })];
    render(<PresenceAvatars members={members} />);

    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('renders single initial for single-word names', () => {
    const members = [createMember({ name: 'Alice' })];
    render(<PresenceAvatars members={members} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders an image for members with avatar URLs', () => {
    const members = [
      createMember({ name: 'Alice', avatarUrl: 'https://example.com/alice.jpg' }),
    ];
    render(<PresenceAvatars members={members} />);

    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', 'https://example.com/alice.jpg');
  });

  it('limits visible members to maxVisible (default 5)', () => {
    const members = Array.from({ length: 7 }, (_, i) =>
      createMember({ id: `m${i}`, name: `Member ${i}` }),
    );
    render(<PresenceAvatars members={members} />);

    expect(screen.getByTestId('presence-overflow')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('respects custom maxVisible prop', () => {
    const members = Array.from({ length: 4 }, (_, i) =>
      createMember({ id: `m${i}`, name: `Person ${i}` }),
    );
    render(<PresenceAvatars members={members} maxVisible={2} />);

    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not render overflow when all members fit', () => {
    const members = [
      createMember({ id: 'm1', name: 'Alice' }),
      createMember({ id: 'm2', name: 'Bob' }),
    ];
    render(<PresenceAvatars members={members} maxVisible={5} />);

    expect(screen.queryByTestId('presence-overflow')).not.toBeInTheDocument();
  });

  it('shows overflow aria-label for 1 extra member', () => {
    const members = Array.from({ length: 3 }, (_, i) =>
      createMember({ id: `m${i}`, name: `User ${i}` }),
    );
    render(<PresenceAvatars members={members} maxVisible={2} />);

    expect(screen.getByLabelText('1 more member')).toBeInTheDocument();
  });

  it('shows overflow aria-label for multiple extra members', () => {
    const members = Array.from({ length: 5 }, (_, i) =>
      createMember({ id: `m${i}`, name: `User ${i}` }),
    );
    render(<PresenceAvatars members={members} maxVisible={2} />);

    expect(screen.getByLabelText('3 more members')).toBeInTheDocument();
  });

  it('shows tooltip with member name on hover', () => {
    const members = [createMember({ name: 'Alice Johnson' })];
    render(<PresenceAvatars members={members} />);

    // Tooltip should not be visible initially
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Hover over the avatar container
    const avatarWrapper = screen.getByText('AJ').closest('[class*="relative"]')!;
    fireEvent.mouseEnter(avatarWrapper);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('hides tooltip on mouse leave', () => {
    const members = [createMember({ name: 'Alice Johnson' })];
    render(<PresenceAvatars members={members} />);

    const avatarWrapper = screen.getByText('AJ').closest('[class*="relative"]')!;
    fireEvent.mouseEnter(avatarWrapper);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(avatarWrapper);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders green ring for active members', () => {
    const members = [createMember({ idle: false })];
    render(<PresenceAvatars members={members} />);

    const avatarRing = screen.getByText('AJ').closest('[class*="ring"]');
    expect(avatarRing?.className).toContain('ring-green-500');
  });

  it('renders yellow ring for idle members', () => {
    const members = [createMember({ idle: true })];
    render(<PresenceAvatars members={members} />);

    const avatarRing = screen.getByText('AJ').closest('[class*="ring"]');
    expect(avatarRing?.className).toContain('ring-yellow-400');
  });

  it('applies custom className', () => {
    const members = [createMember()];
    render(<PresenceAvatars members={members} className="my-custom-class" />);

    expect(screen.getByTestId('presence-avatars').className).toContain('my-custom-class');
  });
});
