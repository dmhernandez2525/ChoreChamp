import { useNavigate } from 'react-router-dom';
import { useGuestStore } from '../stores/guest-store';

interface SignUpPromptProps {
  variant?: 'modal' | 'banner' | 'inline';
}

export function SignUpPrompt({ variant = 'modal' }: SignUpPromptProps) {
  const navigate = useNavigate();
  const { shouldShowSignUpPrompt, dismissSignUpPrompt, exitGuestMode } = useGuestStore();

  if (!shouldShowSignUpPrompt()) return null;

  const handleSignUp = () => {
    exitGuestMode();
    navigate('/signup');
  };

  const handleDismiss = () => {
    dismissSignUpPrompt();
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <p className="font-semibold">Enjoying ChoreChamp?</p>
              <p className="text-sm text-white/90">Create an account to save your progress!</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignUp}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Sign Up Free
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">Great progress!</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              You're getting the hang of ChoreChamp! Create a free account to sync your data across devices and invite family members.
            </p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleSignUp}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors text-sm"
              >
                Create Account
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal variant (default)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="text-center">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            You're doing great!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create a free account to save your family's progress, sync across all your devices, and unlock all features.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleSignUp}
              className="w-full bg-primary-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-600 transition-colors"
            >
              Create Free Account
            </button>
            <button
              onClick={handleDismiss}
              className="w-full text-gray-500 dark:text-gray-400 py-2 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Continue exploring
            </button>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Free forever for families • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
