import { Link, useNavigate } from 'react-router-dom';
import { DEMO_ROLES, type DemoRole } from '../lib/demo-mode';

interface DemoRoleSelectorProps {
  title?: string;
  subtitle?: string;
}

export function DemoRoleSelector({
  title = 'Welcome to ChoreChamp Demo',
  subtitle = 'Select a role to explore the app',
}: DemoRoleSelectorProps) {
  const navigate = useNavigate();

  const handleRoleSelect = (role: DemoRole) => {
    navigate(`/demo/${role}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">🏆</div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>

        {/* Demo Mode Banner */}
        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
          <span className="inline-flex items-center gap-2 text-sm text-blue-700">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
            Demo Mode - No sign up required
          </span>
        </div>

        {/* Role Selection */}
        <div className="space-y-4">
          {DEMO_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className="w-full rounded-lg bg-white p-6 text-left shadow-md transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{role.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.label}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
