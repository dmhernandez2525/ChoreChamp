import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { DemoRole } from '../lib/demo-mode';

interface DemoAuthContextType {
  isDemoMode: boolean;
  demoRole: DemoRole | null;
  demoHouseholdId: string;
  demoMemberId: string;
  enterDemo: (role: DemoRole) => void;
  exitDemo: () => void;
}

const DEMO_HOUSEHOLD_ID = 'demo-household';
const DEMO_PARENT_ID = 'demo-parent';
const DEMO_CHILD_ID = 'demo-child-emma';

const DemoAuthContext = createContext<DemoAuthContextType | null>(null);

// Storage key for persisting demo state
const DEMO_STATE_KEY = 'chorechamp_demo_state';

interface StoredDemoState {
  isDemoMode: boolean;
  demoRole: DemoRole | null;
}

function loadDemoState(): StoredDemoState {
  try {
    const stored = sessionStorage.getItem(DEMO_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return { isDemoMode: false, demoRole: null };
}

function saveDemoState(state: StoredDemoState): void {
  try {
    sessionStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

function clearDemoState(): void {
  try {
    sessionStorage.removeItem(DEMO_STATE_KEY);
  } catch {
    // Ignore errors
  }
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const initialState = loadDemoState();
  const [isDemoMode, setIsDemoMode] = useState(initialState.isDemoMode);
  const [demoRole, setDemoRole] = useState<DemoRole | null>(initialState.demoRole);

  const enterDemo = useCallback((role: DemoRole) => {
    setIsDemoMode(true);
    setDemoRole(role);
    saveDemoState({ isDemoMode: true, demoRole: role });
  }, []);

  const exitDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoRole(null);
    clearDemoState();
  }, []);

  const demoMemberId = demoRole === 'parent' ? DEMO_PARENT_ID : DEMO_CHILD_ID;

  return (
    <DemoAuthContext.Provider
      value={{
        isDemoMode,
        demoRole,
        demoHouseholdId: DEMO_HOUSEHOLD_ID,
        demoMemberId,
        enterDemo,
        exitDemo,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
}
