import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area } from 'recharts';
import { ProvinceData } from '../types';
import translations from '../translations/fa.json';

interface ProvincesMetricsChartProps {
  provincesData: ProvinceData[];
  selectedMetrics: string[];
}

const ProvincesMetricsChart: React.FC<ProvincesMetricsChartProps> = ({ 
  provincesData, 
  selectedMetrics = ['total_number', 'number_answered', 'number_unanswerd', 'number_failed', 'number_busy', 'congestion']
}) => {
  // Prepare data for the chart
  const chartData = provincesData
    .filter(province => province.province_name && province.province_name !== 'مجموع کل استان‌ها')
    .map(province => ({
      name: province.province_name,
      total_number: Number(province.total_number || 0),
      number_answered: Number(province.number_answered || 0),
      number_unanswerd: Number(province.number_unanswerd || 0),
      number_failed: Number(province.number_failed || 0),
      number_busy: Number(province.number_busy || 0),
      congestion: Number(province.congestion || 0),
    }))
    .filter(province => {
      // Check if any of the main metrics have data (not 0)
      return province.total_number > 0 || province.number_answered > 0 || 
             province.number_unanswerd > 0 || province.number_failed > 0 || 
             province.number_busy > 0 || province.congestion > 0;
    })
    .sort((a, b) => b.total_number - a.total_number); // Sort by total calls descending

  // Color scheme for different metrics
  const colors = {
    total_number: '#1F2937',
    number_answered: '#10B981',
    number_unanswerd: '#EF4444',
    number_failed: '#6B7280',
    number_busy: '#F59E0B',
    congestion: '#3B82F6',
  };

  // Persian labels for metrics from translations
  const metricLabels = {
    total_number: translations.provincesChart.metrics.total_number,
    number_answered: translations.provincesChart.metrics.number_answered,
    number_unanswerd: translations.provincesChart.metrics.number_unanswerd,
    number_failed: translations.provincesChart.metrics.number_failed,
    number_busy: translations.provincesChart.metrics.number_busy,
    congestion: translations.provincesChart.metrics.congestion,
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {metricLabels[entry.dataKey as keyof typeof metricLabels]}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {metricLabels[entry.dataKey as keyof typeof metricLabels]}
          </span>
        </div>
      ))}
    </div>
  );

  if (!chartData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">{translations.provincesChart.noData}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {translations.provincesChart.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {translations.provincesChart.subtitle}
        </p>
      </div>

      {/* Main Chart - All Metrics Bar Chart */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {translations.provincesChart.mainChartTitle}
        </h4>
        <ResponsiveContainer width="100%" height={650}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 160 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={160}
              interval={0}
              tick={{ 
                fontSize: 11, 
                fontWeight: 'bold',
                dy: 15  // Move text down by 15 pixels
              }}
              axisLine={{ stroke: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
              axisLine={{ stroke: '#6B7280' }}
              tickLine={{ stroke: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            <Bar dataKey="number_answered" fill={colors.number_answered} name={metricLabels.number_answered} barSize={20} />
            <Bar dataKey="number_unanswerd" fill={colors.number_unanswerd} name={metricLabels.number_unanswerd} barSize={20} />
            <Bar dataKey="number_failed" fill={colors.number_failed} name={metricLabels.number_failed+metricLabels.congestion} barSize={20} />
            <Bar dataKey="number_busy" fill={colors.number_busy} name={metricLabels.number_busy} barSize={20} />
            {/* <Bar dataKey="congestion" fill={colors.congestion} name={metricLabels.congestion} barSize={20} /> */}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        {selectedMetrics.map(metric => {
          const total = chartData.reduce((sum, item) => sum + Number(item[metric as keyof typeof item] || 0), 0);
          const avg = total / chartData.length;
          const max = Math.max(...chartData.map(item => Number(item[metric as keyof typeof item] || 0)));
          const min = Math.min(...chartData.map(item => Number(item[metric as keyof typeof item] || 0)));
          
          return (
            <div key={metric} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {metricLabels[metric as keyof typeof metricLabels]}
              </h5>
              <div className="space-y-1 text-xs">
                <div className="text-gray-600 dark:text-gray-400">
                  {translations.provincesChart.statistics.total}: {total.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {translations.provincesChart.statistics.average}: {avg.toFixed(0)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {translations.provincesChart.statistics.maximum}: {max.toLocaleString()}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {translations.provincesChart.statistics.minimum}: {min.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProvincesMetricsChart;