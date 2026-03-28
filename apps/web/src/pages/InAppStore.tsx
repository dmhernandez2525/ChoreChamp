import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useMembers,
  useStoreCatalog,
  useStoreOffers,
  useStoreWallet,
  useStoreEntitlements,
  useStorePurchases,
  useCreateStorePurchase,
  useApproveStorePurchase,
  useDeclineStorePurchase,
  useRequestStoreRefund,
  useStoreRefundRequests,
  useResolveStoreRefund,
  useStoreControls,
  useUpdateStoreControls,
  useCreateStoreGiftCard,
  useStoreGiftCards,
  useRedeemStoreGiftCard,
} from '@chorechamp/api-client';
import { Button } from '@chorechamp/ui';
import { useAuth } from '../context/AuthContext';

type StoreTab = 'catalog' | 'history' | 'controls' | 'gift-cards';

function formatDate(value: Date | string | null): string {
  if (!value) return 'N/A';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

function formatCost(coinsSpent: number, pointsSpent: number): string {
  if (coinsSpent > 0) return `${coinsSpent} coins`;
  if (pointsSpent > 0) return `${pointsSpent} points`;
  return 'Free';
}

export default function InAppStore() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<StoreTab>('catalog');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [quantityByItem, setQuantityByItem] = useState<Record<string, number>>({});
  const [purchasePin, setPurchasePin] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [giftTier, setGiftTier] = useState<'family' | 'premium'>('premium');
  const [giftMonths, setGiftMonths] = useState(1);
  const [giftEmail, setGiftEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [giftCodeToRedeem, setGiftCodeToRedeem] = useState('');

  const [controlsPinInput, setControlsPinInput] = useState('');
  const [controlsForm, setControlsForm] = useState({
    requireParentApproval: true,
    requirePinForPurchases: false,
    dailyCoinLimit: 5000,
    dailyPointLimit: 2000,
    allowGiftCards: true,
    allowLimitedTimeOffers: true,
  });

  const { data: membersRaw, isLoading: loadingMembers } = useMembers(householdId ?? '');
  const members = Array.isArray(membersRaw) ? membersRaw : [];
  const currentMember = useMemo(
    () => members.find((member) => member.userId === user?.id) ?? null,
    [members, user]
  );
  const isParent = currentMember?.role === 'parent';

  useEffect(() => {
    if (!selectedMemberId && currentMember) {
      setSelectedMemberId(currentMember.id);
    }
  }, [selectedMemberId, currentMember]);

  const catalogOptions = useMemo(
    () => ({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
    }),
    [selectedCategory]
  );

  const {
    data: catalogItemsRaw,
    isLoading: loadingCatalog,
    refetch: refetchCatalog,
  } = useStoreCatalog(householdId ?? '', catalogOptions);
  const catalogItems = Array.isArray(catalogItemsRaw) ? catalogItemsRaw : [];
  const { data: offers } = useStoreOffers(householdId ?? '');
  const { data: wallet, refetch: refetchWallet } = useStoreWallet(householdId ?? '');
  const { data: entitlements } = useStoreEntitlements(householdId ?? '');
  const { data: purchasesRaw, refetch: refetchPurchases } = useStorePurchases(householdId ?? '');
  const purchases = Array.isArray(purchasesRaw) ? purchasesRaw : [];
  const { data: refundsRaw, refetch: refetchRefunds } = useStoreRefundRequests(householdId ?? '', isParent);
  const refunds = Array.isArray(refundsRaw) ? refundsRaw : [];
  const controlsMemberId = isParent ? selectedMemberId : undefined;
  const { data: controls, refetch: refetchControls } = useStoreControls(householdId ?? '', controlsMemberId);
  const { data: giftCardsRaw, refetch: refetchGiftCards } = useStoreGiftCards(householdId ?? '', isParent);
  const giftCards = Array.isArray(giftCardsRaw) ? giftCardsRaw : [];

  const createPurchase = useCreateStorePurchase(householdId ?? '');
  const approvePurchase = useApproveStorePurchase(householdId ?? '');
  const declinePurchase = useDeclineStorePurchase(householdId ?? '');
  const requestRefund = useRequestStoreRefund(householdId ?? '');
  const resolveRefund = useResolveStoreRefund(householdId ?? '');
  const updateControls = useUpdateStoreControls(householdId ?? '');
  const createGiftCard = useCreateStoreGiftCard(householdId ?? '');
  const redeemGiftCard = useRedeemStoreGiftCard(householdId ?? '');

  useEffect(() => {
    if (!controls) return;
    setControlsForm({
      requireParentApproval: controls.requireParentApproval,
      requirePinForPurchases: controls.requirePinForPurchases,
      dailyCoinLimit: controls.dailyCoinLimit,
      dailyPointLimit: controls.dailyPointLimit,
      allowGiftCards: controls.allowGiftCards,
      allowLimitedTimeOffers: controls.allowLimitedTimeOffers,
    });
  }, [controls]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const item of catalogItems) unique.add(item.category);
    return ['all', ...Array.from(unique)];
  }, [catalogItems]);

  const isLoading = loadingMembers || loadingCatalog;

  const handleBuy = async (itemId: string) => {
    if (!householdId) return;
    const quantity = quantityByItem[itemId] ?? 1;

    try {
      setError(null);
      setMessage(null);
      const response = await createPurchase.mutateAsync({
        itemId,
        quantity,
        ...(isParent && selectedMemberId ? { memberId: selectedMemberId } : {}),
        ...(purchasePin ? { parentPin: purchasePin } : {}),
      });

      if (response.pending) {
        setMessage(response.message ?? 'Purchase is pending approval.');
      } else {
        setMessage('Purchase completed.');
      }

      await Promise.all([
        refetchWallet(),
        refetchPurchases(),
        refetchCatalog(),
        refetchGiftCards(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete purchase.');
    }
  };

  const handleApprovePurchase = async (purchaseId: string) => {
    try {
      setError(null);
      setMessage(null);
      await approvePurchase.mutateAsync({
        purchaseId,
        request: purchasePin ? { parentPin: purchasePin } : undefined,
      });
      setMessage('Purchase approved.');
      await Promise.all([refetchWallet(), refetchPurchases(), refetchCatalog()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve purchase.');
    }
  };

  const handleDeclinePurchase = async (purchaseId: string) => {
    try {
      setError(null);
      setMessage(null);
      await declinePurchase.mutateAsync(purchaseId);
      setMessage('Purchase declined.');
      await refetchPurchases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline purchase.');
    }
  };

  const handleRequestRefund = async (purchaseId: string) => {
    const reason = window.prompt('Reason for refund request');
    if (!reason) return;

    try {
      setError(null);
      setMessage(null);
      await requestRefund.mutateAsync({
        purchaseId,
        request: { reason },
      });
      setMessage('Refund request submitted.');
      await Promise.all([refetchPurchases(), refetchRefunds()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit refund request.');
    }
  };

  const handleResolveRefund = async (
    refundId: string,
    decision: 'approve' | 'reject'
  ) => {
    try {
      setError(null);
      setMessage(null);
      await resolveRefund.mutateAsync({
        refundId,
        request: {
          decision,
          note: decision === 'approve' ? 'Approved by parent.' : 'Rejected by parent.',
        },
      });
      setMessage(
        decision === 'approve'
          ? 'Refund approved and applied.'
          : 'Refund request rejected.'
      );
      await Promise.all([refetchRefunds(), refetchPurchases(), refetchWallet()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve refund request.');
    }
  };

  const handleSaveControls = async () => {
    if (!householdId || !selectedMemberId) return;

    try {
      setError(null);
      setMessage(null);
      await updateControls.mutateAsync({
        memberId: selectedMemberId,
        request: {
          ...controlsForm,
          ...(controlsPinInput ? { parentPin: controlsPinInput } : {}),
        },
      });
      setControlsPinInput('');
      setMessage('Purchase controls updated.');
      await refetchControls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update controls.');
    }
  };

  const handleCreateGiftCard = async () => {
    try {
      setError(null);
      setMessage(null);
      await createGiftCard.mutateAsync({
        tier: giftTier,
        durationMonths: giftMonths,
        ...(giftEmail ? { recipientEmail: giftEmail } : {}),
        ...(giftMessage ? { message: giftMessage } : {}),
        ...(purchasePin ? { parentPin: purchasePin } : {}),
      });
      setGiftEmail('');
      setGiftMessage('');
      setMessage('Gift card created.');
      await Promise.all([refetchGiftCards(), refetchPurchases(), refetchWallet()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gift card.');
    }
  };

  const handleRedeemGiftCard = async () => {
    if (!giftCodeToRedeem.trim()) return;
    try {
      setError(null);
      setMessage(null);
      await redeemGiftCard.mutateAsync({ code: giftCodeToRedeem.trim() });
      setGiftCodeToRedeem('');
      setMessage('Gift card redeemed and subscription updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem gift card.');
    }
  };

  if (!householdId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <p className="text-gray-600">Missing household id.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/households/${householdId}`} className="text-gray-500 hover:text-gray-700">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">In-App Purchase Store</h1>
              <p className="text-sm text-gray-500">
                Cosmetics, boosters, bundles, and gifts
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">Wallet</p>
            <p className="text-lg font-semibold text-gray-900">
              {wallet?.choreCoinsBalance ?? 0} coins
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-2 border-t px-4">
          {([
            { id: 'catalog', label: 'Catalog' },
            { id: 'history', label: 'History' },
            { id: 'controls', label: 'Controls' },
            { id: 'gift-cards', label: 'Gift Cards' },
          ] as Array<{ id: StoreTab; label: string }>).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {isLoading && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Loading store data...
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">ChoreCoins</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{wallet?.choreCoinsBalance ?? 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Lifetime Coins Purchased</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{wallet?.lifetimeCoinsPurchased ?? 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Lifetime Coins Spent</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{wallet?.lifetimeCoinsSpent ?? 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Owned Entitlements</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{entitlements?.length ?? 0}</p>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Purchase PIN</label>
              <input
                value={purchasePin}
                onChange={(event) => setPurchasePin(event.target.value)}
                placeholder="Optional parent PIN"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                type="password"
              />
            </div>
            {isParent && (
              <div>
                <label className="text-sm font-medium text-gray-700">Buy For Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {(members).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Active Offers</p>
              <p className="mt-1 text-sm text-gray-600">
                {(offers?.offers?.length ?? 0)} offer{(offers?.offers?.length ?? 0) === 1 ? '' : 's'} available
              </p>
            </div>
          </div>
        </section>

        {activeTab === 'catalog' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:w-72"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(catalogItems).map((item) => {
                const quantity = quantityByItem[item.id] ?? 1;
                const saleTag = item.salePercent > 0 ? `${item.salePercent}% off` : null;
                const limitedTag = item.isLimitedTime ? 'Limited time' : null;
                return (
                  <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.icon ? `${item.icon} ` : ''}
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {saleTag && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">{saleTag}</span>}
                      {limitedTag && <span className="rounded-full bg-purple-100 px-2 py-1 text-purple-700">{limitedTag}</span>}
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{item.itemType}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>Cost: {item.baseCoinPrice > 0 ? `${item.baseCoinPrice} coins` : `${item.basePointPrice} points`}</p>
                      {item.availableUntil && <p>Ends: {formatDate(item.availableUntil)}</p>}
                      {item.maxPurchasesPerMember !== null && (
                        <p>Limit: {item.maxPurchasesPerMember} per member</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={quantity}
                        onChange={(event) =>
                          setQuantityByItem((prev) => ({
                            ...prev,
                            [item.id]: Math.max(1, Math.min(10, Number(event.target.value) || 1)),
                          }))
                        }
                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                      <Button
                        className="flex-1"
                        onClick={() => handleBuy(item.id)}
                        disabled={createPurchase.isPending}
                      >
                        {createPurchase.isPending ? 'Processing...' : 'Buy'}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
              <p className="mt-1 text-sm text-gray-600">
                Digital receipts and refund workflow are available for each completed purchase.
              </p>
            </div>

            {(purchases).length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
                No purchases yet.
              </div>
            ) : (
              <div className="space-y-3">
                {(purchases).map(({ purchase, item }) => (
                  <div key={purchase.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item?.title ?? 'Gift Card Purchase'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Receipt: {purchase.receiptNumber} • {formatDate(purchase.purchasedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {purchase.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      Cost: {formatCost(purchase.coinsSpent, purchase.pointsSpent)}
                      {purchase.coinsGranted > 0 && ` • Granted ${purchase.coinsGranted} coins`}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {purchase.status === 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => handleRequestRefund(purchase.id)}
                          disabled={requestRefund.isPending}
                        >
                          Request Refund
                        </Button>
                      )}
                      {isParent && purchase.status === 'pending_parent_approval' && (
                        <>
                          <Button
                            onClick={() => handleApprovePurchase(purchase.id)}
                            disabled={approvePurchase.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeclinePurchase(purchase.id)}
                            disabled={declinePurchase.isPending}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isParent && (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-base font-semibold text-gray-900">Refund Requests</h3>
                {(refunds).length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">No refund requests.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {(refunds).map(({ refund, purchase, item }) => (
                      <div key={refund.id} className="rounded-md border border-gray-200 p-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {item?.title ?? 'Unknown Item'} • {refund.status}
                        </p>
                        <p className="mt-1 text-sm text-gray-600">{refund.reason}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Purchase {purchase.receiptNumber} • {formatDate(refund.requestedAt)}
                        </p>
                        {refund.status === 'pending' && (
                          <div className="mt-2 flex gap-2">
                            <Button
                              onClick={() => handleResolveRefund(refund.id, 'approve')}
                              disabled={resolveRefund.isPending}
                            >
                              Approve Refund
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleResolveRefund(refund.id, 'reject')}
                              disabled={resolveRefund.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'controls' && (
          <section className="space-y-4">
            {!isParent ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
                Only parents can edit store controls.
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-lg font-semibold text-gray-900">Parental Purchase Controls</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Require approvals, enforce PIN protection, and limit spending.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member</label>
                    <select
                      value={selectedMemberId}
                      onChange={(event) => setSelectedMemberId(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      {(members).map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Set/Update PIN</label>
                    <input
                      type="password"
                      value={controlsPinInput}
                      onChange={(event) => setControlsPinInput(event.target.value)}
                      placeholder="Leave empty to keep existing PIN"
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={controlsForm.requireParentApproval}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          requireParentApproval: event.target.checked,
                        }))
                      }
                    />
                    Require parent approval
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={controlsForm.requirePinForPurchases}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          requirePinForPurchases: event.target.checked,
                        }))
                      }
                    />
                    Require PIN for purchases
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={controlsForm.allowGiftCards}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          allowGiftCards: event.target.checked,
                        }))
                      }
                    />
                    Allow gift cards
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={controlsForm.allowLimitedTimeOffers}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          allowLimitedTimeOffers: event.target.checked,
                        }))
                      }
                    />
                    Allow limited-time offers
                  </label>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Daily coin limit</label>
                    <input
                      type="number"
                      min={0}
                      value={controlsForm.dailyCoinLimit}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          dailyCoinLimit: Number(event.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Daily point limit</label>
                    <input
                      type="number"
                      min={0}
                      value={controlsForm.dailyPointLimit}
                      onChange={(event) =>
                        setControlsForm((prev) => ({
                          ...prev,
                          dailyPointLimit: Number(event.target.value) || 0,
                        }))
                      }
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Button onClick={handleSaveControls} disabled={updateControls.isPending}>
                    {updateControls.isPending ? 'Saving...' : 'Save Controls'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'gift-cards' && (
          <section className="space-y-4">
            {!isParent ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
                Only parents can create or redeem gift cards.
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Create Gift Card</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tier</label>
                      <select
                        value={giftTier}
                        onChange={(event) => setGiftTier(event.target.value as 'family' | 'premium')}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="family">Family</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Duration (months)</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={giftMonths}
                        onChange={(event) =>
                          setGiftMonths(Math.max(1, Math.min(12, Number(event.target.value) || 1)))
                        }
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Recipient Email (optional)</label>
                      <input
                        value={giftEmail}
                        onChange={(event) => setGiftEmail(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        type="email"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Message (optional)</label>
                      <input
                        value={giftMessage}
                        onChange={(event) => setGiftMessage(event.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={handleCreateGiftCard} disabled={createGiftCard.isPending}>
                      {createGiftCard.isPending ? 'Creating...' : 'Create Gift Card'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Redeem Gift Code</h2>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <input
                      value={giftCodeToRedeem}
                      onChange={(event) => setGiftCodeToRedeem(event.target.value)}
                      placeholder="GIFT-XXXXXX"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm md:w-72"
                    />
                    <Button onClick={handleRedeemGiftCard} disabled={redeemGiftCard.isPending}>
                      {redeemGiftCard.isPending ? 'Redeeming...' : 'Redeem'}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="text-lg font-semibold text-gray-900">Gift Card History</h2>
                  {(giftCards).length === 0 ? (
                    <p className="mt-2 text-sm text-gray-600">No gift cards created yet.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {(giftCards).map((card) => (
                        <div key={card.id} className="rounded-md border border-gray-200 p-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {card.code} • {card.tier} • {card.durationMonths} month(s)
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Status: {card.status} • Created: {formatDate(card.createdAt)}
                          </p>
                          {card.redeemedAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              Redeemed: {formatDate(card.redeemedAt)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

