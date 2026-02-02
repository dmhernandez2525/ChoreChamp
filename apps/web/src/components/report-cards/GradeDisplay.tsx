import type { LetterGrade } from '@chorechamp/types';

interface GradeDisplayProps {
  letterGrade?: LetterGrade | string | null;
  percentageGrade?: number | null;
  gpaValue?: number | null;
  showAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const gradeColors: Record<string, string> = {
  'A+': 'bg-green-100 text-green-800 border-green-300',
  'A': 'bg-green-100 text-green-800 border-green-300',
  'A-': 'bg-green-50 text-green-700 border-green-200',
  'B+': 'bg-blue-100 text-blue-800 border-blue-300',
  'B': 'bg-blue-100 text-blue-800 border-blue-300',
  'B-': 'bg-blue-50 text-blue-700 border-blue-200',
  'C+': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'C': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'C-': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'D+': 'bg-orange-100 text-orange-800 border-orange-300',
  'D': 'bg-orange-100 text-orange-800 border-orange-300',
  'D-': 'bg-orange-50 text-orange-700 border-orange-200',
  'F': 'bg-red-100 text-red-800 border-red-300',
};

const sizeClasses = {
  sm: 'text-sm px-2 py-0.5',
  md: 'text-base px-3 py-1',
  lg: 'text-lg px-4 py-2',
};

export function GradeDisplay({ letterGrade, percentageGrade, gpaValue, showAll = false, size = 'md' }: GradeDisplayProps) {
  const colorClass = letterGrade ? gradeColors[letterGrade] || 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-gray-100 text-gray-800 border-gray-300';

  if (showAll) {
    return (
      <div className="flex items-center gap-2">
        {letterGrade && (
          <span className={`inline-flex items-center rounded-md border font-semibold ${colorClass} ${sizeClasses[size]}`}>
            {letterGrade}
          </span>
        )}
        {percentageGrade !== null && percentageGrade !== undefined && (
          <span className="text-gray-600 text-sm">
            {percentageGrade.toFixed(1)}%
          </span>
        )}
        {gpaValue !== null && gpaValue !== undefined && (
          <span className="text-gray-500 text-sm">
            ({gpaValue.toFixed(2)} GPA)
          </span>
        )}
      </div>
    );
  }

  // Show just the letter grade
  if (letterGrade) {
    return (
      <span className={`inline-flex items-center rounded-md border font-semibold ${colorClass} ${sizeClasses[size]}`}>
        {letterGrade}
      </span>
    );
  }

  // Show percentage if no letter grade
  if (percentageGrade !== null && percentageGrade !== undefined) {
    return (
      <span className={`inline-flex items-center rounded-md border font-semibold bg-gray-100 text-gray-800 border-gray-300 ${sizeClasses[size]}`}>
        {percentageGrade.toFixed(1)}%
      </span>
    );
  }

  // Show GPA if nothing else
  if (gpaValue !== null && gpaValue !== undefined) {
    return (
      <span className={`inline-flex items-center rounded-md border font-semibold bg-gray-100 text-gray-800 border-gray-300 ${sizeClasses[size]}`}>
        {gpaValue.toFixed(2)}
      </span>
    );
  }

  return <span className="text-gray-400">N/A</span>;
}
