export type ChoreChampAuth =
  | { apiKey: string; accessToken?: never }
  | { accessToken: string; apiKey?: never };

export interface ChoreChampSdkOptions {
  baseUrl?: string;
  auth: ChoreChampAuth;
}

export class ChoreChampSdk {
  private readonly baseUrl: string;
  private readonly auth: ChoreChampAuth;

  constructor(options: ChoreChampSdkOptions) {
    this.baseUrl = options.baseUrl ?? 'https://chorechamp-api-u0o9.onrender.com/api/public/v1';
    this.auth = options.auth;
  }

  private authHeaders(): HeadersInit {
    if ('apiKey' in this.auth) {
      return { 'X-API-Key': this.auth.apiKey };
    }

    return { Authorization: `Bearer ${this.auth.accessToken}` };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(payload.message ?? 'Request failed');
    }

    return response.json() as Promise<T>;
  }

  getOpenApi() {
    return this.request<Record<string, unknown>>('/openapi.json');
  }

  listHouseholdChores(householdId: string) {
    return this.request<{ data: Array<Record<string, unknown>>; count: number }>(
      `/households/${householdId}/chores`
    );
  }

  listHouseholdMembers(householdId: string) {
    return this.request<{ data: Array<Record<string, unknown>>; count: number }>(
      `/households/${householdId}/members`
    );
  }

  emitEvent(
    householdId: string,
    eventType: 'chore.completed' | 'reward.claimed' | 'streak.updated' | 'member.invited' | 'assignment.submitted',
    payload: Record<string, unknown>
  ) {
    return this.request<{ dispatchedCount: number }>(`/households/${householdId}/events/${eventType}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
