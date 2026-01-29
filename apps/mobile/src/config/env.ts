import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
}

const getConfig = (): Config => {
  const extra = Constants.expoConfig?.extra;

  return {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || extra?.apiUrl || 'https://chorechamp-api-u0o9.onrender.com',
    appName: Constants.expoConfig?.name || 'ChoreChamp',
    version: Constants.expoConfig?.version || '1.0.0',
  };
};

export const config = getConfig();
