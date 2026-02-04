import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
  revenueCatIosApiKey: string | null;
  revenueCatAndroidApiKey: string | null;
}

const getConfig = (): Config => {
  const extra = Constants.expoConfig?.extra;

  return {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || 'https://chorechamp-api-u0o9.onrender.com',
    appName: Constants.expoConfig?.name || 'ChoreChamp',
    version: Constants.expoConfig?.version || '1.0.0',
    revenueCatIosApiKey:
      process.env.REVENUECAT_IOS_API_KEY || extra?.revenueCatIosApiKey || null,
    revenueCatAndroidApiKey:
      process.env.REVENUECAT_ANDROID_API_KEY || extra?.revenueCatAndroidApiKey || null,
  };
};

export const config = getConfig();
