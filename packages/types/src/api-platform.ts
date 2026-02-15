export type ApiPlatformScope =
  | 'chores:read'
  | 'chores:write'
  | 'members:read'
  | 'rewards:read'
  | 'webhooks:write'
  | 'analytics:read'
  | 'marketplace:read';

export type ApiPlatformWebhookEventType =
  | 'chore.completed'
  | 'reward.claimed'
  | 'streak.updated'
  | 'member.invited'
  | 'assignment.submitted';

export type ApiPlatformWebhookStatus = 'active' | 'paused' | 'disabled';
export type ApiPlatformDeliveryStatus = 'pending' | 'delivered' | 'failed';
export type ApiPlatformAppRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApiPlatformKeySettings {
  apiKeyId: string;
  scopes: ApiPlatformScope[];
  rateLimitPerMinute: number;
  requestsToday: number;
  lastRequestAt: Date | null;
  lastResetDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformUsageEvent {
  id: string;
  apiKeyId: string;
  householdId: string;
  requestPath: string;
  requestMethod: string;
  statusCode: number;
  responseTimeMs: number;
  createdAt: Date;
}

export interface ApiPlatformWebhookSubscription {
  id: string;
  householdId: string;
  createdByMemberId: string;
  name: string;
  targetUrl: string;
  eventTypes: ApiPlatformWebhookEventType[];
  status: ApiPlatformWebhookStatus;
  failureCount: number;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformWebhookDelivery {
  id: string;
  subscriptionId: string;
  householdId: string;
  eventType: ApiPlatformWebhookEventType;
  payload: Record<string, unknown>;
  status: ApiPlatformDeliveryStatus;
  responseStatus: number | null;
  responseBody: string | null;
  attemptCount: number;
  deliveredAt: Date | null;
  createdAt: Date;
}

export interface ApiPlatformOAuthClient {
  id: string;
  householdId: string;
  createdByMemberId: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  scopes: ApiPlatformScope[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformMarketplaceApp {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  description: string;
  category: string;
  websiteUrl: string | null;
  installUrl: string | null;
  logoUrl: string | null;
  pricingSummary: string | null;
  isVerified: boolean;
  status: 'active' | 'inactive';
  supportedEventTypes: ApiPlatformWebhookEventType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformAppRequest {
  id: string;
  householdId: string;
  appId: string;
  requestedByMemberId: string;
  status: ApiPlatformAppRequestStatus;
  requestedAt: Date;
  reviewedByMemberId: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  configuration: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformSdkPackage {
  id: string;
  language: 'javascript' | 'python' | 'swift' | 'kotlin';
  packageName: string;
  version: string;
  repoUrl: string;
  docsUrl: string;
  installCommand: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiPlatformUsageSummary {
  totalRequests: number;
  requestsLast24Hours: number;
  failuresLast24Hours: number;
  averageResponseMs: number;
  topEndpoints: Array<{
    path: string;
    requests: number;
  }>;
}

export interface ApiPlatformOpenApiDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  components: Record<string, unknown>;
  paths: Record<string, unknown>;
}

export interface CreateApiPlatformWebhookSubscriptionRequest {
  name: string;
  targetUrl: string;
  eventTypes: ApiPlatformWebhookEventType[];
  secret: string;
}

export interface UpdateApiPlatformWebhookSubscriptionRequest {
  name?: string;
  targetUrl?: string;
  eventTypes?: ApiPlatformWebhookEventType[];
  status?: ApiPlatformWebhookStatus;
  secret?: string;
}

export interface EmitApiPlatformWebhookEventRequest {
  eventType: ApiPlatformWebhookEventType;
  payload: Record<string, unknown>;
}

export interface UpdateApiPlatformKeySettingsRequest {
  scopes?: ApiPlatformScope[];
  rateLimitPerMinute?: number;
}

export interface CreateApiPlatformOAuthClientRequest {
  name: string;
  redirectUris: string[];
  scopes: ApiPlatformScope[];
}

export interface CreateApiPlatformOAuthClientResponse {
  client: ApiPlatformOAuthClient;
  clientSecret: string;
}

export interface AuthorizeApiPlatformOAuthResponse {
  code: string;
  expiresAt: Date;
  redirectUri: string;
}

export interface AuthorizeApiPlatformOAuthRequest {
  clientId: string;
  householdId: string;
  redirectUri: string;
  scopes: ApiPlatformScope[];
}

export interface ExchangeApiPlatformOAuthTokenRequest {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}

export interface ExchangeApiPlatformOAuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
}

export interface RequestApiPlatformMarketplaceAppRequest {
  appId: string;
  configuration?: Record<string, unknown>;
}

export interface ReviewApiPlatformMarketplaceRequest {
  decision: 'approve' | 'reject';
  reviewNote?: string;
}

export interface CreateApiPlatformSdkPackageRequest {
  language: 'javascript' | 'python' | 'swift' | 'kotlin';
  packageName: string;
  version: string;
  repoUrl: string;
  docsUrl: string;
  installCommand: string;
}

export interface ApiPlatformDeveloperOverview {
  usage: ApiPlatformUsageSummary;
  webhookCount: number;
  oauthClientCount: number;
  marketplaceRequestCount: number;
  sdkPackageCount: number;
}

export interface ApiPlatformPerKeyAnalytics {
  apiKeyId: string;
  requests: number;
  failures: number;
}

export interface ApiPlatformAnalyticsResponse {
  usage: ApiPlatformUsageSummary;
  perKey: ApiPlatformPerKeyAnalytics[];
}
