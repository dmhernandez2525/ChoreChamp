import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useApiPlatformAnalytics,
  useApiPlatformDeveloperApiKeys,
  useApiPlatformKeyUsage,
  useApiPlatformMarketplaceApps,
  useApiPlatformMarketplaceRequests,
  useApiPlatformOAuthClients,
  useApiPlatformOpenApi,
  useApiPlatformOverview,
  useApiPlatformSdkPackages,
  useApiPlatformWebhookDeliveries,
  useApiPlatformWebhooks,
  useCreateApiKey,
  useCreateApiPlatformOAuthClient,
  useCreateApiPlatformWebhook,
  useEmitApiPlatformWebhook,
  useMembers,
  useRequestApiPlatformMarketplaceApp,
  useReviewApiPlatformMarketplaceRequest,
  useRevokeApiKey,
  useUpdateApiPlatformKeySettings,
  useUpdateApiPlatformWebhook,
  useUpsertApiPlatformSdkPackage,
} from '@chorechamp/api-client';
import type { ApiPlatformScope, ApiPlatformWebhookEventType } from '@chorechamp/types';
import { Button } from '@chorechamp/ui';
import { useAuth } from '../context/AuthContext';

type DeveloperTab =
  | 'overview'
  | 'keys'
  | 'webhooks'
  | 'marketplace'
  | 'oauth'
  | 'sdk'
  | 'analytics'
  | 'openapi';

const allScopes: ApiPlatformScope[] = [
  'chores:read',
  'chores:write',
  'members:read',
  'rewards:read',
  'webhooks:write',
  'analytics:read',
  'marketplace:read',
];

const webhookEventTypes: ApiPlatformWebhookEventType[] = [
  'chore.completed',
  'reward.claimed',
  'streak.updated',
  'member.invited',
  'assignment.submitted',
];

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return 'N/A';
  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString();
}

function parseMaybeJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object payload.');
  }
  return parsed as Record<string, unknown>;
}

export default function ApiPlatformIntegrations() {
  const { householdId } = useParams<{ householdId: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<DeveloperTab>('overview');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeySecret, setNewApiKeySecret] = useState<string | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [settingsDrafts, setSettingsDrafts] = useState<
    Record<string, { scopes: ApiPlatformScope[]; rateLimitPerMinute: number }>
  >({});

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    targetUrl: '',
    secret: '',
    eventTypes: ['chore.completed'] as ApiPlatformWebhookEventType[],
  });
  const [emitForm, setEmitForm] = useState({
    eventType: 'chore.completed' as ApiPlatformWebhookEventType,
    payloadJson: '{"source":"developer-portal"}',
  });

  const [marketplaceRequestForm, setMarketplaceRequestForm] = useState({
    appId: '',
    configurationJson: '{}',
  });

  const [oauthForm, setOauthForm] = useState({
    name: '',
    redirectUris: 'https://example.com/callback',
    scopes: ['chores:read', 'members:read'] as ApiPlatformScope[],
  });
  const [oauthSecret, setOauthSecret] = useState<string | null>(null);

  const [sdkForm, setSdkForm] = useState({
    language: 'javascript' as 'javascript' | 'python' | 'swift' | 'kotlin',
    packageName: '@chorechamp/sdk-js',
    version: '1.0.0',
    repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript',
    docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript/README.md',
    installCommand: 'npm install @chorechamp/sdk-js',
  });

  const { data: members } = useMembers(householdId ?? '');
  const currentMember = useMemo(
    () => members?.find((member) => member.userId === user?.id) ?? null,
    [members, user]
  );
  const isParent = currentMember?.role === 'parent';

  const enabled = Boolean(householdId && isParent);

  const overviewQuery = useApiPlatformOverview(householdId ?? '', { enabled });
  const developerKeysQuery = useApiPlatformDeveloperApiKeys(householdId ?? '', { enabled });
  const webhooksQuery = useApiPlatformWebhooks(householdId ?? '', { enabled });
  const webhookDeliveriesQuery = useApiPlatformWebhookDeliveries(householdId ?? '', { enabled });
  const marketplaceAppsQuery = useApiPlatformMarketplaceApps(householdId ?? '', { enabled });
  const marketplaceRequestsQuery = useApiPlatformMarketplaceRequests(householdId ?? '', { enabled });
  const oauthClientsQuery = useApiPlatformOAuthClients(householdId ?? '', { enabled });
  const sdkPackagesQuery = useApiPlatformSdkPackages(householdId ?? '', { enabled });
  const analyticsQuery = useApiPlatformAnalytics(householdId ?? '', { enabled });
  const openApiQuery = useApiPlatformOpenApi(householdId ?? '', {
    enabled: enabled && activeTab === 'openapi',
  });

  const selectedKeyUsageQuery = useApiPlatformKeyUsage(householdId ?? '', selectedKeyId, {
    enabled: enabled && !!selectedKeyId,
  });

  const createApiKey = useCreateApiKey(householdId ?? '');
  const revokeApiKey = useRevokeApiKey(householdId ?? '');
  const updateApiKeySettings = useUpdateApiPlatformKeySettings(householdId ?? '');

  const createWebhook = useCreateApiPlatformWebhook(householdId ?? '');
  const updateWebhook = useUpdateApiPlatformWebhook(householdId ?? '');
  const emitWebhook = useEmitApiPlatformWebhook(householdId ?? '');

  const requestMarketplaceApp = useRequestApiPlatformMarketplaceApp(householdId ?? '');
  const reviewMarketplaceRequest = useReviewApiPlatformMarketplaceRequest(householdId ?? '');

  const createOAuthClient = useCreateApiPlatformOAuthClient(householdId ?? '');
  const upsertSdkPackage = useUpsertApiPlatformSdkPackage(householdId ?? '');

  const apiKeys = developerKeysQuery.data?.keys ?? [];
  const webhooks = webhooksQuery.data?.subscriptions ?? [];
  const deliveries = webhookDeliveriesQuery.data?.deliveries ?? [];
  const marketplaceApps = marketplaceAppsQuery.data?.apps ?? [];
  const marketplaceRequests = marketplaceRequestsQuery.data?.requests ?? [];
  const oauthClients = oauthClientsQuery.data?.clients ?? [];
  const sdkPackages = sdkPackagesQuery.data?.sdkPackages ?? [];

  useEffect(() => {
    if (!selectedKeyId && apiKeys.length > 0) {
      setSelectedKeyId(apiKeys[0].id);
    }
  }, [selectedKeyId, apiKeys]);

  useEffect(() => {
    const draft: Record<string, { scopes: ApiPlatformScope[]; rateLimitPerMinute: number }> = {};
    for (const key of apiKeys) {
      const fallbackScopes: ApiPlatformScope[] = ['chores:read', 'members:read'];
      draft[key.id] = {
        scopes: (key.settings?.scopes as ApiPlatformScope[] | undefined) ?? fallbackScopes,
        rateLimitPerMinute: key.settings?.rateLimitPerMinute ?? 120,
      };
    }
    setSettingsDrafts(draft);
  }, [apiKeys]);

  async function runAction(action: () => Promise<void>) {
    try {
      setError(null);
      setMessage(null);
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    }
  }

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim() || !householdId) return;
    await runAction(async () => {
      const result = await createApiKey.mutateAsync({ name: newApiKeyName.trim() });
      setNewApiKeyName('');
      setNewApiKeySecret(result.secret);
      setMessage('API key created. Copy the secret now; it will only be shown once.');
      await Promise.all([developerKeysQuery.refetch(), overviewQuery.refetch(), analyticsQuery.refetch()]);
    });
  };

  const handleRevokeApiKey = async (keyId: string) => {
    await runAction(async () => {
      await revokeApiKey.mutateAsync(keyId);
      setMessage('API key revoked.');
      if (selectedKeyId === keyId) {
        const next = apiKeys.find((key) => key.id !== keyId);
        setSelectedKeyId(next?.id ?? '');
      }
      await Promise.all([developerKeysQuery.refetch(), overviewQuery.refetch(), analyticsQuery.refetch()]);
    });
  };

  const toggleScope = (keyId: string, scope: ApiPlatformScope) => {
    setSettingsDrafts((previous) => {
      const current = previous[keyId] ?? { scopes: [], rateLimitPerMinute: 120 };
      const hasScope = current.scopes.includes(scope);
      const scopes = hasScope
        ? current.scopes.filter((value) => value !== scope)
        : [...current.scopes, scope];
      return {
        ...previous,
        [keyId]: {
          ...current,
          scopes,
        },
      };
    });
  };

  const handleSaveKeySettings = async (keyId: string) => {
    const draft = settingsDrafts[keyId];
    if (!draft || draft.scopes.length === 0) {
      setError('Select at least one API scope before saving.');
      return;
    }

    await runAction(async () => {
      await updateApiKeySettings.mutateAsync({
        keyId,
        data: {
          scopes: draft.scopes,
          rateLimitPerMinute: draft.rateLimitPerMinute,
        },
      });
      setMessage('API key settings saved.');
      await Promise.all([developerKeysQuery.refetch(), selectedKeyUsageQuery.refetch()]);
    });
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.targetUrl.trim() || !webhookForm.secret.trim()) {
      setError('Webhook name, URL, and secret are required.');
      return;
    }

    await runAction(async () => {
      await createWebhook.mutateAsync({
        name: webhookForm.name.trim(),
        targetUrl: webhookForm.targetUrl.trim(),
        secret: webhookForm.secret,
        eventTypes: webhookForm.eventTypes,
      });
      setWebhookForm({
        name: '',
        targetUrl: '',
        secret: '',
        eventTypes: ['chore.completed'],
      });
      setMessage('Webhook subscription created.');
      await Promise.all([webhooksQuery.refetch(), overviewQuery.refetch()]);
    });
  };

  const handleUpdateWebhookStatus = async (
    subscriptionId: string,
    status: 'active' | 'paused' | 'disabled'
  ) => {
    await runAction(async () => {
      await updateWebhook.mutateAsync({
        subscriptionId,
        data: { status },
      });
      setMessage('Webhook status updated.');
      await Promise.all([webhooksQuery.refetch(), webhookDeliveriesQuery.refetch()]);
    });
  };

  const handleEmitWebhook = async () => {
    await runAction(async () => {
      const payload = parseMaybeJson(emitForm.payloadJson);
      const response = await emitWebhook.mutateAsync({
        eventType: emitForm.eventType,
        payload,
      });
      setMessage(`Webhook event sent to ${response.dispatchedCount} subscriptions.`);
      await Promise.all([webhookDeliveriesQuery.refetch(), analyticsQuery.refetch()]);
    });
  };

  const handleRequestMarketplaceApp = async () => {
    if (!marketplaceRequestForm.appId) {
      setError('Select a marketplace app to request.');
      return;
    }

    await runAction(async () => {
      const configuration = parseMaybeJson(marketplaceRequestForm.configurationJson);
      await requestMarketplaceApp.mutateAsync({
        appId: marketplaceRequestForm.appId,
        configuration,
      });
      setMessage('Marketplace integration request submitted.');
      await Promise.all([marketplaceRequestsQuery.refetch(), overviewQuery.refetch()]);
    });
  };

  const handleReviewMarketplaceRequest = async (
    requestId: string,
    decision: 'approve' | 'reject'
  ) => {
    await runAction(async () => {
      await reviewMarketplaceRequest.mutateAsync({
        requestId,
        data: {
          decision,
          reviewNote: decision === 'approve' ? 'Approved by parent.' : 'Rejected by parent.',
        },
      });
      setMessage(`Request ${decision}d.`);
      await Promise.all([marketplaceRequestsQuery.refetch(), overviewQuery.refetch()]);
    });
  };

  const handleCreateOAuthClient = async () => {
    if (!oauthForm.name.trim()) {
      setError('OAuth client name is required.');
      return;
    }

    const redirectUris = oauthForm.redirectUris
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);

    if (redirectUris.length === 0) {
      setError('At least one redirect URI is required.');
      return;
    }

    await runAction(async () => {
      const response = await createOAuthClient.mutateAsync({
        name: oauthForm.name.trim(),
        redirectUris,
        scopes: oauthForm.scopes,
      });
      setOauthSecret(response.clientSecret);
      setOauthForm((previous) => ({ ...previous, name: '' }));
      setMessage('OAuth client created. Copy the client secret now.');
      await Promise.all([oauthClientsQuery.refetch(), overviewQuery.refetch()]);
    });
  };

  const toggleOAuthScope = (scope: ApiPlatformScope) => {
    setOauthForm((previous) => {
      const hasScope = previous.scopes.includes(scope);
      return {
        ...previous,
        scopes: hasScope
          ? previous.scopes.filter((value) => value !== scope)
          : [...previous.scopes, scope],
      };
    });
  };

  const applySdkPreset = (language: 'javascript' | 'python' | 'swift' | 'kotlin') => {
    if (language === 'javascript') {
      setSdkForm({
        language,
        packageName: '@chorechamp/sdk-js',
        version: '1.0.0',
        repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript',
        docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/javascript/README.md',
        installCommand: 'npm install @chorechamp/sdk-js',
      });
      return;
    }

    if (language === 'python') {
      setSdkForm({
        language,
        packageName: 'chorechamp-sdk',
        version: '1.0.0',
        repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/python',
        docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/python/README.md',
        installCommand: 'pip install chorechamp-sdk',
      });
      return;
    }

    if (language === 'swift') {
      setSdkForm({
        language,
        packageName: 'ChoreChampSDK',
        version: '1.0.0',
        repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/swift',
        docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/swift/README.md',
        installCommand: 'Swift Package Manager URL import',
      });
      return;
    }

    setSdkForm({
      language,
      packageName: 'com.chorechamp:sdk-kotlin',
      version: '1.0.0',
      repoUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/kotlin',
      docsUrl: 'https://github.com/dmhernandez2525/ChoreChamp/tree/main/sdk/kotlin/README.md',
      installCommand: 'implementation("com.chorechamp:sdk-kotlin:1.0.0")',
    });
  };

  const handleSaveSdkPackage = async () => {
    await runAction(async () => {
      await upsertSdkPackage.mutateAsync(sdkForm);
      setMessage('SDK package metadata saved.');
      await Promise.all([sdkPackagesQuery.refetch(), overviewQuery.refetch()]);
    });
  };

  if (!householdId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <p className="text-gray-600">Missing household id.</p>
      </div>
    );
  }

  if (!isParent) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-bold text-gray-900">Developer Platform</h1>
          <p className="mt-2 text-sm text-gray-600">Parent membership is required for API platform management.</p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link to={`/households/${householdId}`}>Back to Household</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: DeveloperTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'keys', label: 'API Keys' },
    { id: 'webhooks', label: 'Webhooks' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'oauth', label: 'OAuth' },
    { id: 'sdk', label: 'SDKs' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'openapi', label: 'OpenAPI' },
  ];

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="border-b bg-[var(--app-surface)] shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={`/households/${householdId}`} className="text-gray-500 hover:text-gray-700">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">API Platform & Integrations</h1>
              <p className="text-sm text-gray-500">OAuth2, webhooks, marketplace approvals, SDK distribution</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => openApiQuery.refetch()}>
            Refresh
          </Button>
        </div>

        <div className="mx-auto flex max-w-6xl gap-2 border-t px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
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

        {newApiKeySecret && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">New API key secret</p>
            <p className="mt-1 break-all font-mono text-xs">{newApiKeySecret}</p>
            <button
              className="mt-2 text-xs font-medium underline"
              onClick={() => setNewApiKeySecret(null)}
            >
              Clear secret
            </button>
          </div>
        )}

        {oauthSecret && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 text-sm text-violet-800">
            <p className="font-semibold">New OAuth client secret</p>
            <p className="mt-1 break-all font-mono text-xs">{oauthSecret}</p>
            <button
              className="mt-2 text-xs font-medium underline"
              onClick={() => setOauthSecret(null)}
            >
              Clear secret
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">API Requests (24h)</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {overviewQuery.data?.usage.requestsLast24Hours ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Webhooks</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{overviewQuery.data?.webhookCount ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">OAuth Clients</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {overviewQuery.data?.oauthClientCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Marketplace Requests</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {overviewQuery.data?.marketplaceRequestCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">SDK Packages</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{overviewQuery.data?.sdkPackageCount ?? 0}</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Top Endpoints (24h)</h2>
              <div className="mt-3 space-y-2 text-sm">
                {(overviewQuery.data?.usage.topEndpoints ?? []).map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
                    <span className="font-mono text-xs text-gray-700">{endpoint.path}</span>
                    <span className="text-gray-900">{endpoint.requests}</span>
                  </div>
                ))}
                {(overviewQuery.data?.usage.topEndpoints ?? []).length === 0 && (
                  <p className="text-gray-500">No API traffic yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'keys' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Create API Key</h2>
              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <input
                  value={newApiKeyName}
                  onChange={(event) => setNewApiKeyName(event.target.value)}
                  placeholder="Automation Bot Key"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <Button onClick={handleCreateApiKey}>Create Key</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Keys & Access Scopes</h2>
                {apiKeys.map((key) => {
                  const draft = settingsDrafts[key.id];
                  return (
                    <div key={key.id} className="rounded-md border border-gray-100 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-900">{key.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{key.keyPrefix}...</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleRevokeApiKey(key.id)}>
                          Revoke
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {allScopes.map((scope) => (
                          <label key={`${key.id}-${scope}`} className="flex items-center gap-2 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={draft?.scopes.includes(scope) ?? false}
                              onChange={() => toggleScope(key.id, scope)}
                            />
                            {scope}
                          </label>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-700">Rate/min</label>
                        <input
                          type="number"
                          min={10}
                          max={5000}
                          value={draft?.rateLimitPerMinute ?? 120}
                          onChange={(event) =>
                            setSettingsDrafts((previous) => ({
                              ...previous,
                              [key.id]: {
                                scopes: previous[key.id]?.scopes ?? ['chores:read'],
                                rateLimitPerMinute: Number(event.target.value),
                              },
                            }))
                          }
                          className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm"
                        />
                        <Button size="sm" onClick={() => handleSaveKeySettings(key.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {apiKeys.length === 0 && <p className="text-sm text-gray-500">No API keys yet.</p>}
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Usage Events</h2>
                <select
                  value={selectedKeyId}
                  onChange={(event) => setSelectedKeyId(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                    </option>
                  ))}
                </select>

                <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                  {(selectedKeyUsageQuery.data?.usage ?? []).map((event) => (
                    <div key={event.id} className="rounded border border-gray-100 p-2 text-xs text-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono">{event.requestMethod} {event.requestPath}</span>
                        <span className={event.statusCode >= 400 ? 'text-red-600' : 'text-emerald-700'}>
                          {event.statusCode}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-gray-500">
                        <span>{event.responseTimeMs}ms</span>
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {(selectedKeyUsageQuery.data?.usage ?? []).length === 0 && (
                    <p className="text-sm text-gray-500">No usage events for this key yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'webhooks' && (
          <section className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Create Webhook Subscription</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  value={webhookForm.name}
                  onChange={(event) => setWebhookForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Primary Integration"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={webhookForm.targetUrl}
                  onChange={(event) => setWebhookForm((previous) => ({ ...previous, targetUrl: event.target.value }))}
                  placeholder="https://example.com/webhooks/chorechamp"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={webhookForm.secret}
                  onChange={(event) => setWebhookForm((previous) => ({ ...previous, secret: event.target.value }))}
                  placeholder="Webhook secret"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="rounded-md border border-gray-200 p-2">
                  <p className="text-xs font-medium text-gray-700">Event Types</p>
                  <div className="mt-1 grid grid-cols-2 gap-1">
                    {webhookEventTypes.map((eventType) => (
                      <label key={eventType} className="flex items-center gap-1 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={webhookForm.eventTypes.includes(eventType)}
                          onChange={() =>
                            setWebhookForm((previous) => {
                              const hasType = previous.eventTypes.includes(eventType);
                              const eventTypes = hasType
                                ? previous.eventTypes.filter((value) => value !== eventType)
                                : [...previous.eventTypes, eventType];
                              return {
                                ...previous,
                                eventTypes,
                              };
                            })
                          }
                        />
                        {eventType}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={handleCreateWebhook}>Create Webhook</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Subscriptions</h2>
                {webhooks.map((subscription) => (
                  <div key={subscription.id} className="rounded-md border border-gray-100 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{subscription.name}</p>
                        <p className="text-xs text-gray-500 break-all">{subscription.targetUrl}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs uppercase tracking-wide text-gray-700">
                        {subscription.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Failures: {subscription.failureCount} • Last: {formatDate(subscription.lastTriggeredAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleUpdateWebhookStatus(subscription.id, 'active')}>
                        Activate
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateWebhookStatus(subscription.id, 'paused')}>
                        Pause
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateWebhookStatus(subscription.id, 'disabled')}>
                        Disable
                      </Button>
                    </div>
                  </div>
                ))}
                {webhooks.length === 0 && <p className="text-sm text-gray-500">No webhooks configured yet.</p>}
              </div>

              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">Emit Test Event</h2>
                <select
                  value={emitForm.eventType}
                  onChange={(event) =>
                    setEmitForm((previous) => ({
                      ...previous,
                      eventType: event.target.value as ApiPlatformWebhookEventType,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {webhookEventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {eventType}
                    </option>
                  ))}
                </select>
                <textarea
                  value={emitForm.payloadJson}
                  onChange={(event) =>
                    setEmitForm((previous) => ({ ...previous, payloadJson: event.target.value }))
                  }
                  rows={6}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
                />
                <Button onClick={handleEmitWebhook}>Send Event</Button>

                <h3 className="pt-3 text-sm font-semibold text-gray-900">Recent Deliveries</h3>
                <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
                  {deliveries.slice(0, 20).map((delivery) => (
                    <div key={delivery.id} className="rounded border border-gray-100 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono">{delivery.eventType}</span>
                        <span className={delivery.status === 'failed' ? 'text-red-600' : 'text-emerald-700'}>
                          {delivery.status}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-500">
                        HTTP: {delivery.responseStatus ?? 'N/A'} • {formatDate(delivery.createdAt)}
                      </div>
                    </div>
                  ))}
                  {deliveries.length === 0 && <p className="text-sm text-gray-500">No deliveries yet.</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'marketplace' && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Request Marketplace Integration</h2>
              <select
                value={marketplaceRequestForm.appId}
                onChange={(event) =>
                  setMarketplaceRequestForm((previous) => ({ ...previous, appId: event.target.value }))
                }
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select an app</option>
                {marketplaceApps.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} ({app.vendor})
                  </option>
                ))}
              </select>
              <textarea
                value={marketplaceRequestForm.configurationJson}
                onChange={(event) =>
                  setMarketplaceRequestForm((previous) => ({
                    ...previous,
                    configurationJson: event.target.value,
                  }))
                }
                rows={5}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
              />
              <div className="mt-3">
                <Button onClick={handleRequestMarketplaceApp}>Submit Request</Button>
              </div>

              <h3 className="mt-5 text-sm font-semibold text-gray-900">Available Apps</h3>
              <div className="mt-2 space-y-2 text-sm">
                {marketplaceApps.map((app) => (
                  <div key={app.id} className="rounded border border-gray-100 p-2">
                    <p className="font-medium text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-600">{app.description}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Category: {app.category} • {app.pricingSummary ?? 'Pricing unavailable'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Approval Workflow</h2>
              <div className="mt-3 space-y-2">
                {marketplaceRequests.map((request) => (
                  <div key={request.id} className="rounded border border-gray-100 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">Request {request.id.slice(0, 8)}</p>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs uppercase tracking-wide text-gray-700">
                        {request.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Requested: {formatDate(request.requestedAt)}</p>
                    {request.status === 'pending' && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => handleReviewMarketplaceRequest(request.id, 'approve')}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewMarketplaceRequest(request.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {marketplaceRequests.length === 0 && (
                  <p className="text-sm text-gray-500">No marketplace requests yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'oauth' && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Create OAuth Client</h2>
              <input
                value={oauthForm.name}
                onChange={(event) => setOauthForm((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="My Integration App"
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <label className="mt-3 block text-xs font-medium text-gray-700">Redirect URIs (one per line)</label>
              <textarea
                value={oauthForm.redirectUris}
                onChange={(event) =>
                  setOauthForm((previous) => ({ ...previous, redirectUris: event.target.value }))
                }
                rows={4}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs"
              />

              <p className="mt-3 text-xs font-medium text-gray-700">Scopes</p>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {allScopes.map((scope) => (
                  <label key={scope} className="flex items-center gap-2 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={oauthForm.scopes.includes(scope)}
                      onChange={() => toggleOAuthScope(scope)}
                    />
                    {scope}
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <Button onClick={handleCreateOAuthClient}>Create OAuth Client</Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Registered OAuth Clients</h2>
              <div className="mt-3 space-y-2">
                {oauthClients.map((client) => (
                  <div key={client.id} className="rounded border border-gray-100 p-3 text-sm">
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="mt-1 break-all font-mono text-xs text-gray-600">{client.clientId}</p>
                    <p className="mt-1 text-xs text-gray-500">Scopes: {client.scopes.join(', ')}</p>
                    <p className="mt-1 text-xs text-gray-500">Redirect URIs: {client.redirectUris.join(', ')}</p>
                    <p className="mt-1 text-xs text-gray-500">Created: {formatDate(client.createdAt)}</p>
                  </div>
                ))}
                {oauthClients.length === 0 && <p className="text-sm text-gray-500">No OAuth clients yet.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'sdk' && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">SDK Metadata Publisher</h2>
              <label className="mt-3 block text-xs font-medium text-gray-700">Language</label>
              <select
                value={sdkForm.language}
                onChange={(event) =>
                  applySdkPreset(event.target.value as 'javascript' | 'python' | 'swift' | 'kotlin')
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
              </select>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <input
                  value={sdkForm.packageName}
                  onChange={(event) => setSdkForm((previous) => ({ ...previous, packageName: event.target.value }))}
                  placeholder="Package name"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={sdkForm.version}
                  onChange={(event) => setSdkForm((previous) => ({ ...previous, version: event.target.value }))}
                  placeholder="Version"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={sdkForm.repoUrl}
                  onChange={(event) => setSdkForm((previous) => ({ ...previous, repoUrl: event.target.value }))}
                  placeholder="Repository URL"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={sdkForm.docsUrl}
                  onChange={(event) => setSdkForm((previous) => ({ ...previous, docsUrl: event.target.value }))}
                  placeholder="Docs URL"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={sdkForm.installCommand}
                  onChange={(event) =>
                    setSdkForm((previous) => ({ ...previous, installCommand: event.target.value }))
                  }
                  placeholder="Install command"
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="mt-3">
                <Button onClick={handleSaveSdkPackage}>Save SDK Package</Button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Published SDK Packages</h2>
              <div className="mt-3 space-y-2">
                {sdkPackages.map((pkg) => (
                  <div key={pkg.id} className="rounded border border-gray-100 p-3 text-sm">
                    <p className="font-medium text-gray-900">{pkg.language.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-gray-600">{pkg.packageName} v{pkg.version}</p>
                    <p className="mt-1 break-all text-xs text-gray-500">Install: {pkg.installCommand}</p>
                    <p className="mt-1 text-xs text-gray-500">Updated: {formatDate(pkg.updatedAt)}</p>
                  </div>
                ))}
                {sdkPackages.length === 0 && <p className="text-sm text-gray-500">No SDK packages configured yet.</p>}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'analytics' && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Usage Summary</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <p>Total requests: {analyticsQuery.data?.usage.totalRequests ?? 0}</p>
                <p>Requests (24h): {analyticsQuery.data?.usage.requestsLast24Hours ?? 0}</p>
                <p>Failures (24h): {analyticsQuery.data?.usage.failuresLast24Hours ?? 0}</p>
                <p>Avg response (24h): {analyticsQuery.data?.usage.averageResponseMs ?? 0}ms</p>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">Top Endpoints</h3>
              <div className="mt-2 space-y-2 text-xs">
                {(analyticsQuery.data?.usage.topEndpoints ?? []).map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center justify-between rounded border border-gray-100 px-2 py-1">
                    <span className="font-mono text-gray-700">{endpoint.path}</span>
                    <span className="text-gray-900">{endpoint.requests}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-gray-900">Per-Key Traffic</h2>
              <div className="mt-3 space-y-2 text-sm">
                {(analyticsQuery.data?.perKey ?? []).map((row) => (
                  <div key={row.apiKeyId} className="rounded border border-gray-100 p-2">
                    <p className="font-mono text-xs text-gray-700">{row.apiKeyId}</p>
                    <div className="mt-1 flex items-center justify-between text-gray-600">
                      <span>Requests: {row.requests}</span>
                      <span>Failures: {row.failures}</span>
                    </div>
                  </div>
                ))}
                {(analyticsQuery.data?.perKey ?? []).length === 0 && (
                  <p className="text-sm text-gray-500">No API key traffic recorded yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'openapi' && (
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">OpenAPI Document</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!openApiQuery.data) return;
                  void navigator.clipboard.writeText(JSON.stringify(openApiQuery.data, null, 2));
                  setMessage('OpenAPI JSON copied to clipboard.');
                }}
              >
                Copy JSON
              </Button>
            </div>
            <pre className="mt-3 max-h-[560px] overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(openApiQuery.data ?? {}, null, 2)}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
}
