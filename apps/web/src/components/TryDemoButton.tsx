import { useNavigate } from 'react-router-dom';
import { useGuestStore } from '../stores/guest-store';

interface TryDemoButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function TryDemoButton({
  className = '',
  variant = 'secondary',
  size = 'md',
}: TryDemoButtonProps) {
  const navigate = useNavigate();
  const { enterGuestMode, markDemoSeen } = useGuestStore();

  const handleTryDemo = () => {
    enterGuestMode();
    markDemoSeen();
    navigate('/dashboard');
  };

  const baseClasses = 'font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-white text-primary-600 hover:bg-gray-100 border border-gray-200',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
  };

  return (
    <button
      onClick={handleTryDemo}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <span>✨</span>
      Try Demo
    </button>
  );
}
