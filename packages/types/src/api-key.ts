export interface ApiKey {
  id: string;
  householdId: string;
  name: string;
  keyPrefix: string;
  createdByMemberId: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string;
}
