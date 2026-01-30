import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@chorechamp/ui';
import {
  useHousehold,
  useMembers,
  useAddMember,
  useUpdateMember,
  useDeleteMember,
  useInviteCodes,
  useCreateInviteCode,
} from '@chorechamp/api-client';
import { useAuth } from '../context/AuthContext';
import {
  MemberList,
  AddMemberModal,
  EditMemberModal,
  InviteCodeSection,
} from '../components/family';
import { Skeleton } from '../components/common';
import type { Member } from '@chorechamp/types';

export default function FamilyManagement() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members');
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Queries
  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: inviteCodes, isLoading: loadingInvites } = useInviteCodes(householdId!);

  // Mutations
  const addMember = useAddMember(householdId!);
  const updateMember = useUpdateMember(householdId!);
  const deleteMember = useDeleteMember(householdId!);
  const createInviteCode = useCreateInviteCode(householdId!);

  // Find current member
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m) => m.userId === user.id) || null;
  }, [members, user]);

  const isParent = currentMember?.role === 'parent';

  // Handlers
  const handleAddMember = async (data: {
    name: string;
    role: string;
    color: string;
    birthYear?: number;
  }) => {
    await addMember.mutateAsync({
      name: data.name,
      role: data.role as 'parent' | 'child' | 'teen' | 'viewer',
      color: data.color,
      birthYear: data.birthYear,
    });
  };

  const handleEditMember = async (
    memberId: string,
    data: { name: string; color: string; birthYear?: number }
  ) => {
    await updateMember.mutateAsync({
      memberId,
      data: {
        name: data.name,
        color: data.color,
        birthYear: data.birthYear,
      },
    });
    setEditingMember(null);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }
    await deleteMember.mutateAsync(memberId);
  };

  const handleGenerateCode = async (role: string) => {
    setIsGeneratingCode(true);
    try {
      await createInviteCode.mutateAsync({
        role: role as 'parent' | 'child' | 'teen' | 'viewer',
        expiresInDays: 7,
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Loading state
  const isLoading = loadingHousehold || loadingMembers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-40" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Household not found</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/households/${householdId}`}
              className="text-gray-500 hover:text-gray-700"
            >
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Family Management</h1>
              <p className="text-sm text-gray-500">{household.name}</p>
            </div>
          </div>
          {isParent && (
            <Button onClick={() => setShowAddMember(true)}>+ Add Member</Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('members')}
              className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Members ({members?.length || 0})
            </button>
            {isParent && (
              <button
                onClick={() => setActiveTab('invites')}
                className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'invites'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Invite Codes
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {members && members.length > 0 ? (
              <MemberList
                members={members}
                currentUserId={user?.id}
                isParent={isParent}
                onEditMember={setEditingMember}
                onRemoveMember={isParent ? handleRemoveMember : undefined}
              />
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
                <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
                <h3 className="font-medium text-gray-900">No members yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add family members to start assigning chores.
                </p>
                {isParent && (
                  <Button className="mt-4" onClick={() => setShowAddMember(true)}>
                    Add First Member
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invites' && isParent && (
          <InviteCodeSection
            inviteCodes={inviteCodes || []}
            onGenerateCode={handleGenerateCode}
            isGenerating={isGeneratingCode || loadingInvites}
          />
        )}
      </main>

      {/* Modals */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSubmit={handleAddMember}
      />

      <EditMemberModal
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSubmit={handleEditMember}
      />
    </div>
  );
}
