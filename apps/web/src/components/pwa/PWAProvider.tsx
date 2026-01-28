import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OfflineIndicator } from './OfflineIndicator';
import { InstallPrompt } from './InstallPrompt';
import { UpdateNotification } from './UpdateNotification';

interface PWAContextValue {
  isOnline: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
}

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  isInstalled: false,
  isStandalone: false,
});

export function usePWA() {
  return useContext(PWAContext);
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      ('standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone);

    setIsStandalone(!!isRunningStandalone);
    setIsInstalled(!!isRunningStandalone);

    // Online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // App installed listener
    const handleInstalled = () => setIsInstalled(true);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const value: PWAContextValue = {
    isOnline,
    isInstalled,
    isStandalone,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
      <OfflineIndicator />
      <InstallPrompt />
      <UpdateNotification />
    </PWAContext.Provider>
  );
}
