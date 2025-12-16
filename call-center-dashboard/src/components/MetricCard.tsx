import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCardProps } from '../types';

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  color = 'blue' 
}) => {
  const getMetricCardColorClasses = (colorKey: string) => {
    const map: Record<string, { border: string; iconBg: string; iconText: string }> = {
      blue: { border: 'border-blue-500', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
      green: { border: 'border-green-500', iconBg: 'bg-green-100', iconText: 'text-green-600' },
      red: { border: 'border-red-500', iconBg: 'bg-red-100', iconText: 'text-red-600' },
      yellow: { border: 'border-yellow-500', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
      purple: { border: 'border-purple-500', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
      indigo: { border: 'border-indigo-500', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
      orange: { border: 'border-orange-500', iconBg: 'bg-orange-100', iconText: 'text-orange-600' },
      gray: { border: 'border-gray-500', iconBg: 'bg-gray-100', iconText: 'text-gray-600' },
    };
    return map[colorKey] ?? map.blue;
  };

  const { border, iconBg, iconText } = getMetricCardColorClasses(color);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-r-4 ${border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-right">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-right" dir="ltr">{value}</p>
          {subValue && <p className="text-sm text-gray-500 dark:text-gray-400 text-right">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-full ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconText}`} />
        </div>
      </div>
    
    </div>
  );
};

export default MetricCard;
