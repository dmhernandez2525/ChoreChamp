import { useNavigate } from 'react-router-dom';
import { useDemoAuth } from '../context/DemoAuthContext';

export function DemoBanner() {
  const { isDemoMode, demoRole, exitDemo } = useDemoAuth();
  const navigate = useNavigate();

  if (!isDemoMode) return null;

  const handleExit = () => {
    exitDemo();
    navigate('/');
  };

  return (
    <div className="bg-blue-600 px-4 py-2 text-center text-sm text-white">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white"></span>
        Demo Mode - Viewing as {demoRole === 'parent' ? 'Parent' : 'Child'}
        <button
          onClick={handleExit}
          className="ml-4 rounded bg-white/20 px-2 py-0.5 hover:bg-white/30 transition-colors"
        >
          Exit Demo
        </button>
      </span>
    </div>
  );
}
