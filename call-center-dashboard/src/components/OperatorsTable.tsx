import React from 'react';
import { OperatorsTableProps } from '../types';

const OperatorsTable: React.FC<OperatorsTableProps> = ({ summaryData, title = "توزیع اپراتورهای شبکه" }) => {
  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  const operators = [
    { name: 'همراه اول', calls: summaryData?.mci || 0, color: 'bg-blue-100' },
    { name: 'ایرانسل', calls: summaryData?.irancell || 0, color: 'bg-yellow-100' },
    { name: 'رایتل', calls: summaryData?.rightel || 0, color: 'bg-green-100' },
    { name: 'تلفن ثابت', calls: summaryData?.fixed || 0, color: 'bg-purple-100' },
    { name: 'تلیا', calls: summaryData?.taliya || 0, color: 'bg-pink-100' },
    { name: 'اسپادان', calls: summaryData?.espadan || 0, color: 'bg-indigo-100' },
    { name: 'بدون سیم کارت', calls: summaryData?.unknown || 0, color: 'bg-gray-100' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">اپراتور</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">تماس‌ها</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">درصد</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {operators.map((operator, index) => (
              <tr key={index} className={`${operator.color} dark:bg-gray-700/40`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                  {operator.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right" dir="ltr">
                  {operator.calls?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 text-right" dir="ltr">
                  {summaryData?.total_number ? safeToFixed((operator.calls / summaryData.total_number) * 100, 1) : '0'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperatorsTable;
