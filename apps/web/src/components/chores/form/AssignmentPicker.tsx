import { cn } from '@chorechamp/ui';
import type { Member, AssignmentType } from '@chorechamp/types';

interface AssignmentPickerProps {
  type: AssignmentType;
  selectedMembers: string[];
  members: Member[];
  onTypeChange: (type: AssignmentType) => void;
  onMembersChange: (memberIds: string[]) => void;
}

const ASSIGNMENT_TYPES: {
  value: AssignmentType;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'anyone',
    label: 'Anyone',
    description: 'First to complete gets the points',
    icon: '👥',
  },
  {
    value: 'specific',
    label: 'Specific',
    description: 'Assign to specific family members',
    icon: '👤',
  },
  {
    value: 'rotation',
    label: 'Rotation',
    description: 'Takes turns automatically',
    icon: '🔄',
  },
];

export function AssignmentPicker({
  type,
  selectedMembers,
  members,
  onTypeChange,
  onMembersChange,
}: AssignmentPickerProps) {
  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      onMembersChange(selectedMembers.filter((id) => id !== memberId));
    } else {
      onMembersChange([...selectedMembers, memberId]);
    }
  };

  const selectAll = () => {
    onMembersChange(members.map((m) => m.id));
  };

  const clearAll = () => {
    onMembersChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Assignment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Who should do this chore?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ASSIGNMENT_TYPES.map((at) => (
            <button
              key={at.value}
              type="button"
              onClick={() => onTypeChange(at.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors',
                type === at.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              )}
            >
              <span className="text-xl">{at.icon}</span>
              <span className="font-medium">{at.label}</span>
              <span className="text-xs opacity-75">{at.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Member Selection (for specific and rotation) */}
      {(type === 'specific' || type === 'rotation') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              {type === 'specific' ? 'Select members' : 'Include in rotation'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 hover:underline"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-gray-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {members
              .filter((m) => m.role !== 'viewer')
              .map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors',
                    selectedMembers.includes(member.id)
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  <span>{member.name}</span>
                  {selectedMembers.includes(member.id) && (
                    <span className="text-blue-500">✓</span>
                  )}
                </button>
              ))}
          </div>

          {selectedMembers.length === 0 && (
            <p className="mt-2 text-xs text-red-500">
              Please select at least one family member
            </p>
          )}
        </div>
      )}
    </div>
  );
}
