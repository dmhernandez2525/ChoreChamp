import * as SecureStore from 'expo-secure-store';

const KEYS = {
  AUTH_TOKEN: 'chorechamp_auth_token',
  USER_DATA: 'chorechamp_user_data',
  ACTIVE_HOUSEHOLD: 'chorechamp_active_household',
  ACTIVE_MEMBER: 'chorechamp_active_member',
} as const;

type StorageKey = (typeof KEYS)[keyof typeof KEYS];

export const storage = {
  async get(key: StorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      console.error(`Error reading ${key} from secure storage`);
      return null;
    }
  },

  async set(key: StorageKey, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      console.error(`Error writing ${key} to secure storage`);
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      console.error(`Error removing ${key} from secure storage`);
    }
  },

  async getJSON<T>(key: StorageKey): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  async setJSON<T>(key: StorageKey, value: T): Promise<void> {
    await this.set(key, JSON.stringify(value));
  },

  // Auth token helpers
  async getAuthToken(): Promise<string | null> {
    return this.get(KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    return this.set(KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    return this.remove(KEYS.AUTH_TOKEN);
  },

  // User data helpers
  async getUserData<T>(): Promise<T | null> {
    return this.getJSON<T>(KEYS.USER_DATA);
  },

  async setUserData<T>(data: T): Promise<void> {
    return this.setJSON(KEYS.USER_DATA, data);
  },

  async removeUserData(): Promise<void> {
    return this.remove(KEYS.USER_DATA);
  },

  // Active household helpers
  async getActiveHousehold(): Promise<string | null> {
    return this.get(KEYS.ACTIVE_HOUSEHOLD);
  },

  async setActiveHousehold(id: string): Promise<void> {
    return this.set(KEYS.ACTIVE_HOUSEHOLD, id);
  },

  async removeActiveHousehold(): Promise<void> {
    return this.remove(KEYS.ACTIVE_HOUSEHOLD);
  },

  // Active member helpers
  async getActiveMember(): Promise<string | null> {
    return this.get(KEYS.ACTIVE_MEMBER);
  },

  async setActiveMember(id: string): Promise<void> {
    return this.set(KEYS.ACTIVE_MEMBER, id);
  },

  async removeActiveMember(): Promise<void> {
    return this.remove(KEYS.ACTIVE_MEMBER);
  },

  // Clear all auth data
  async clearAuth(): Promise<void> {
    await Promise.all([
      this.remove(KEYS.AUTH_TOKEN),
      this.remove(KEYS.USER_DATA),
      this.remove(KEYS.ACTIVE_HOUSEHOLD),
      this.remove(KEYS.ACTIVE_MEMBER),
    ]);
  },
};
