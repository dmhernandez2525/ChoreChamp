import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useHousehold,
  useMembers,
  useSubscriptionPlans,
  useSubscriptionStatus,
  useCreateCheckoutSession,
  useCreatePortalSession,
} from '@chorechamp/api-client';
import { Button, cn } from '@chorechamp/ui';
import { Skeleton } from '../components/common';
import { useAuth } from '../context/AuthContext';

const formatDate = (value: Date | string | null) => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

export default function Subscription() {
  const { householdId } = useParams<{ householdId: string }>();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: household, isLoading: loadingHousehold } = useHousehold(householdId!);
  const { data: members, isLoading: loadingMembers } = useMembers(householdId!);
  const { data: plansData, isLoading: loadingPlans } = useSubscriptionPlans(householdId!);
  const { data: statusData, isLoading: loadingStatus } = useSubscriptionStatus(householdId!);
  const createCheckout = useCreateCheckoutSession(householdId!);
  const createPortal = useCreatePortalSession(householdId!);

  const subscription = statusData?.subscription;
  const memberCount = members?.length ?? 0;
  const currentMember = useMemo(() => {
    if (!members || !user) return null;
    return members.find((member) => member.userId === user.id) || null;
  }, [members, user]);
  const isParent = currentMember?.role === 'parent';

  const isLoading =
    loadingHousehold || loadingMembers || loadingPlans || loadingStatus || !householdId;

  const hasStripe = subscription?.provider === 'stripe';

  const handleCheckout = async (tier: 'family' | 'premium') => {
    if (!householdId) return;
    try {
      setError(null);
      const response = await createCheckout.mutateAsync({
        tier,
        billingInterval,
        successUrl: `${window.location.origin}/households/${householdId}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/households/${householdId}/subscription?canceled=true`,
      });
      window.location.assign(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    }
  };

  const handlePortal = async () => {
    if (!householdId) return;
    try {
      setError(null);
      const response = await createPortal.mutateAsync({
        returnUrl: `${window.location.origin}/households/${householdId}/subscription`,
      });
      window.location.assign(response.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
    }
  };

  const plans = plansData?.plans ?? [];
  const trialDays = plansData?.trialDays ?? 14;

  const statusBadge = useMemo(() => {
    if (!subscription) return { label: 'Free', tone: 'bg-gray-100 text-gray-700' };
    const labelMap: Record<string, string> = {
      free: 'Free',
      trialing: 'Trial',
      active: 'Active',
      past_due: 'Past Due',
      grace_period: 'Grace Period',
      canceled: 'Canceled',
      expired: 'Expired',
    };
    const label = labelMap[subscription.status] ?? 'Free';
    const tone =
      subscription.status === 'active' || subscription.status === 'trialing'
        ? 'bg-emerald-100 text-emerald-700'
        : subscription.status === 'grace_period' || subscription.status === 'past_due'
          ? 'bg-amber-100 text-amber-700'
          : subscription.status === 'canceled' || subscription.status === 'expired'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700';
    return { label, tone };
  }, [subscription]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
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
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4">
          <Link
            to={`/households/${householdId}/settings`}
            className="text-gray-500 hover:text-gray-700"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
            <p className="text-sm text-gray-500">{household.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusBadge.tone)}>
              {statusBadge.label}
            </span>
            {subscription?.isGrandfathered && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Grandfathered Pricing
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Tier</p>
              <p className="text-base font-semibold text-gray-900">
                {subscription?.tier ? subscription.tier : 'free'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-base font-semibold text-gray-900">
                {subscription?.memberLimit ? `${memberCount} / ${subscription.memberLimit}` : `${memberCount} / Unlimited`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Renewal</p>
              <p className="text-base font-semibold text-gray-900">
                {formatDate(subscription?.currentPeriodEnd ?? null)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
            {subscription?.trialEndsAt && (
              <span>Trial ends on {formatDate(subscription.trialEndsAt)}</span>
            )}
            {subscription?.gracePeriodEndsAt && (
              <span>Grace period until {formatDate(subscription.gracePeriodEndsAt)}</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {subscription?.provider === 'revenuecat' ? (
              <Button variant="outline" disabled>
                Manage in Mobile App
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handlePortal}
                disabled={!hasStripe || createPortal.isPending || !isParent}
              >
                {createPortal.isPending ? 'Opening Portal...' : 'Manage Billing'}
              </Button>
            )}
          </div>
          {!isParent && (
            <p className="mt-3 text-sm text-gray-500">
              Only parents can manage subscription billing.
            </p>
          )}
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
              <p className="text-sm text-gray-600">All upgrades include a {trialDays}-day free trial.</p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition',
                  billingInterval === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600'
                )}
                onClick={() => setBillingInterval('monthly')}
              >
                Monthly
              </button>
              <button
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium transition',
                  billingInterval === 'annual' ? 'bg-blue-600 text-white' : 'text-gray-600'
                )}
                onClick={() => setBillingInterval('annual')}
              >
                Annual
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = subscription?.tier === plan.tier;
              const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const priceLabel = price === 0 ? 'Free' : `$${price.toFixed(2)}`;
              const intervalLabel = price === 0 ? '' : billingInterval === 'annual' ? '/year' : '/month';

              return (
                <div
                  key={plan.tier}
                  className={cn(
                    'rounded-xl border bg-white p-6 shadow-sm',
                    plan.highlight ? 'border-blue-600 shadow-lg' : 'border-gray-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    {plan.highlight && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">{priceLabel}</span>
                    <span className="ml-1 text-sm text-gray-500">{intervalLabel}</span>
                    {billingInterval === 'annual' && plan.annualSavingsLabel && price > 0 && (
                      <p className="mt-1 text-xs text-emerald-600">{plan.annualSavingsLabel}</p>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    {plan.features.map((feature) => (
                      <li key={feature}>✓ {feature}</li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    {plan.tier === 'free' ? (
                      <Button variant="outline" disabled>
                        {isCurrent ? 'Current Plan' : 'Free Forever'}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleCheckout(plan.tier as 'family' | 'premium')}
                        disabled={isCurrent || createCheckout.isPending || !isParent}
                      >
                        {isCurrent ? 'Current Plan' : createCheckout.isPending ? 'Redirecting...' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
