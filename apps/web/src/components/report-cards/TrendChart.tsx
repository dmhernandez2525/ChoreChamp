import { AcademicTrend, PERIOD_NAMES } from '@chorechamp/types';

interface TrendChartProps {
  trends: AcademicTrend[];
  metricType: 'gpa' | 'grade' | 'attendance';
  title?: string;
}

export function TrendChart({ trends, metricType, title }: TrendChartProps) {
  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-5 text-center text-gray-500">
        No trend data available
      </div>
    );
  }

  // Sort trends by period number
  const sortedTrends = [...trends].sort((a, b) => a.periodNumber - b.periodNumber);

  // Calculate min/max for scaling
  const values = sortedTrends.map(t => t.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Calculate chart dimensions
  const chartHeight = 150;

  const getYPosition = (value: number) => {
    return chartHeight - ((value - minValue) / range) * (chartHeight - 20) - 10;
  };

  const getMetricLabel = () => {
    switch (metricType) {
      case 'gpa': return 'GPA';
      case 'attendance': return 'Attendance %';
      case 'grade': return 'Grade';
      default: return 'Value';
    }
  };

  const formatValue = (value: number) => {
    switch (metricType) {
      case 'gpa': return value.toFixed(2);
      case 'attendance': return `${value.toFixed(1)}%`;
      default: return value.toString();
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendArrow = (direction: string) => {
    switch (direction) {
      case 'up': return '\u2191';
      case 'down': return '\u2193';
      default: return '\u2192';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h4 className="font-semibold text-gray-900 mb-4">
        {title || `${getMetricLabel()} Trend`}
      </h4>

      {/* Simple Line Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => (
            <line
              key={i}
              x1="0"
              y1={10 + fraction * (chartHeight - 20)}
              x2="100%"
              y2={10 + fraction * (chartHeight - 20)}
              stroke="#e5e7eb"
              strokeDasharray="4"
            />
          ))}

          {/* Line connecting points */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={sortedTrends.map((t, i) => {
              const x = (i / (sortedTrends.length - 1 || 1)) * 100;
              const y = getYPosition(t.value);
              return `${x}%,${y}`;
            }).join(' ')}
          />

          {/* Data points */}
          {sortedTrends.map((trend, i) => {
            const x = (i / (sortedTrends.length - 1 || 1)) * 100;
            const y = getYPosition(trend.value);
            return (
              <g key={trend.id}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r="6"
                  fill="#3b82f6"
                  className="hover:fill-blue-700 cursor-pointer"
                />
                <title>
                  {PERIOD_NAMES[trend.periodType as keyof typeof PERIOD_NAMES]?.[trend.periodNumber - 1] || `P${trend.periodNumber}`}: {formatValue(trend.value)}
                </title>
              </g>
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>{formatValue(maxValue)}</span>
          <span>{formatValue(minValue)}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {sortedTrends.map((trend, i) => (
          <span key={i}>
            {PERIOD_NAMES[trend.periodType as keyof typeof PERIOD_NAMES]?.[trend.periodNumber - 1] || `P${trend.periodNumber}`}
          </span>
        ))}
      </div>

      {/* Trend Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Latest: </span>
            <span className="font-semibold">{formatValue(sortedTrends[sortedTrends.length - 1].value)}</span>
          </div>
          {sortedTrends.length > 1 && (
            <div className={`flex items-center gap-1 ${getTrendColor(sortedTrends[sortedTrends.length - 1].trendDirection)}`}>
              <span className="text-lg">{getTrendArrow(sortedTrends[sortedTrends.length - 1].trendDirection)}</span>
              {sortedTrends[sortedTrends.length - 1].changePercent !== null && (
                <span className="text-sm">
                  {sortedTrends[sortedTrends.length - 1].changePercent! > 0 ? '+' : ''}
                  {sortedTrends[sortedTrends.length - 1].changePercent!.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
