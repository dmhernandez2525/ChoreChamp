import { Button } from '@chorechamp/ui';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex justify-center gap-4">
          {action && (
            action.href ? (
              <Button asChild>
                <Link to={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button onClick={action.onClick}>{action.label}</Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button variant="outline" asChild>
                <Link to={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function NoChoresEmptyState() {
  return (
    <EmptyState
      icon="✨"
      title="All done for today!"
      description="No chores scheduled. Enjoy your free time!"
    />
  );
}

export function NoHouseholdEmptyState() {
  return (
    <EmptyState
      icon="🏠"
      title="No households yet"
      description="Create a household to start assigning chores and earning points!"
      action={{ label: 'Create Household', href: '/households/new' }}
      secondaryAction={{ label: 'Join with Code', href: '/households/join' }}
    />
  );
}

export function NoPendingApprovalsEmptyState() {
  return (
    <EmptyState
      icon="👍"
      title="No pending approvals"
      description="All completed chores have been reviewed."
    />
  );
}
