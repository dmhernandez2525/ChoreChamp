import { ReportCard, ReportCardGrade, PERIOD_NAMES } from '@chorechamp/types';
import { GradeDisplay } from './GradeDisplay';

interface ReportCardCardProps {
  reportCard: ReportCard & { grades: ReportCardGrade[] };
  memberName?: string;
  onView?: () => void;
  onAcknowledge?: () => void;
  isParent?: boolean;
}

export function ReportCardCard({ reportCard, memberName, onView, onAcknowledge, isParent = false }: ReportCardCardProps) {
  const periodLabel = PERIOD_NAMES[reportCard.periodType as keyof typeof PERIOD_NAMES]?.[reportCard.periodNumber - 1] || reportCard.periodName;

  const gradeDistribution = reportCard.grades.reduce((acc, grade) => {
    if (grade.letterGrade) {
      const category = grade.letterGrade.charAt(0);
      acc[category] = (acc[category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          {memberName && (
            <p className="text-sm text-gray-500 mb-1">{memberName}</p>
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            {periodLabel} {reportCard.schoolYear}
          </h3>
          <p className="text-sm text-gray-500">
            Issued: {new Date(reportCard.issueDate).toLocaleDateString()}
          </p>
        </div>
        {reportCard.gpa && (
          <div className="text-right">
            <p className="text-sm text-gray-500">GPA</p>
            <p className="text-2xl font-bold text-blue-600">{reportCard.gpa.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Grade Summary */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(gradeDistribution).sort().map(([category, count]) => (
            <div key={category} className="flex items-center gap-1">
              <GradeDisplay letterGrade={category} size="sm" />
              <span className="text-sm text-gray-600">x{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grades List (collapsed) */}
      <div className="border-t pt-4 mb-4">
        <div className="grid grid-cols-2 gap-2">
          {reportCard.grades.slice(0, 4).map((grade) => (
            <div key={grade.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 truncate">{grade.subjectName}</span>
              <GradeDisplay letterGrade={grade.letterGrade} size="sm" />
            </div>
          ))}
          {reportCard.grades.length > 4 && (
            <p className="text-sm text-gray-500 col-span-2">
              +{reportCard.grades.length - 4} more subjects
            </p>
          )}
        </div>
      </div>

      {/* Bonus & Status */}
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4">
          {reportCard.totalBonusEarned > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">+{reportCard.totalBonusEarned}</span>
              <span className="text-sm text-gray-500">bonus points</span>
            </div>
          )}
          {reportCard.parentAcknowledged ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Acknowledged
            </span>
          ) : isParent ? (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              Needs Review
            </span>
          ) : null}
        </div>

        <div className="flex gap-2">
          {!reportCard.parentAcknowledged && isParent && onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
            >
              Acknowledge
            </button>
          )}
          {onView && (
            <button
              onClick={onView}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
