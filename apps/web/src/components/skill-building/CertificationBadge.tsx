import { SkillCertification } from '@chorechamp/types';

interface CertificationBadgeProps {
  certification: SkillCertification;
  skillName?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function CertificationBadge({ certification, skillName, size = 'md', showDetails = false }: CertificationBadgeProps) {
  const getStatusConfig = () => {
    switch (certification.status) {
      case 'certified':
        return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', icon: '✓' };
      case 'pending_review':
        return { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', icon: '⏳' };
      case 'in_progress':
        return { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', icon: '📝' };
      case 'expired':
        return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', icon: '⚠️' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', icon: '○' };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg',
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-2 rounded-lg border-2 ${config.bg} ${config.border} ${sizeClasses[size]}`}>
        <span>{config.icon}</span>
        <span className={`font-medium ${config.text}`}>{certification.certificationName}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${config.bg} ${config.border} ${sizeClasses[size]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl border">
          {certification.badgeIconUrl ? (
            <img src={certification.badgeIconUrl} alt="" className="w-8 h-8" />
          ) : (
            config.icon
          )}
        </div>
        <div>
          <h4 className={`font-semibold ${config.text}`}>{certification.certificationName}</h4>
          {skillName && <p className="text-sm text-gray-600">{skillName}</p>}
        </div>
      </div>

      {certification.status === 'certified' && certification.certifiedAt && (
        <div className="text-sm text-gray-600 mb-2">
          Certified: {new Date(certification.certifiedAt).toLocaleDateString()}
        </div>
      )}

      {certification.assessmentScore !== null && certification.assessmentScore !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Score:</span>
          <span className={`font-medium ${
            certification.assessmentScore >= certification.assessmentPassingScore
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {certification.assessmentScore}%
          </span>
          <span className="text-gray-400">/ {certification.assessmentPassingScore}% needed</span>
        </div>
      )}

      {certification.expiresAt && (
        <div className="text-sm text-gray-500 mt-2">
          Expires: {new Date(certification.expiresAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
