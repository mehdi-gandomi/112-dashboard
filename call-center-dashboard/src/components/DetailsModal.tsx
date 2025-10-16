import React from 'react';
import { DateObject } from 'react-multi-date-picker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import persian from 'react-date-object/calendars/persian';
import { DetailsModalProps } from '../types';

const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  loading,
  error,
  data,
  selectedDate,
  onDateChange
}) => {
  // Helper functions
  const safeToFixed = (value: any, decimals: number = 1): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  const safeToLocaleString = (value: any): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const englishToPersianDay: { [key: string]: string } = {
    'saturday': 'شنبه',
    'sunday': 'یکشنبه',
    'monday': 'دوشنبه',
    'tuesday': 'سه‌شنبه',
    'wednesday': 'چهارشنبه',
    'thursday': 'پنجشنبه',
    'friday': 'جمعه',
    'sat': 'شنبه',
    'sun': 'یکشنبه',
    'mon': 'دوشنبه',
    'tue': 'سه‌شنبه',
    'wed': 'چهارشنبه',
    'thu': 'پنجشنبه',
    'fri': 'جمعه'
  };

  const toJalaliDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
      // Try common formats using DateObject, then convert to Persian calendar
      let d: any;
      // If formatted like YYYY/MM/DD or YYYY-MM-DD
      if (/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(dateStr)) {
        // DateObject can parse string, then convert
        d = new DateObject(dateStr);
      } else {
        // Fallback to JS Date
        d = new DateObject(new Date(dateStr));
      }
      const p = d.convert(persian);
      return p.format('YYYY/MM/DD');
    } catch (e) {
      return dateStr;
    }
  };

  const translateDayName = (value: string): string => {
    const key = String(value || '').toLowerCase();
    return englishToPersianDay[key] || value;
  };

  const translateColumnName = (columnName: string): string => {
    const translations: { [key: string]: string } = {
      'operator': 'اپراتور',
      'handled_calls': 'تماس‌های رسیدگی شده',
      'total_calls': 'کل تماس‌ها',
      'missed_calls': 'تماس‌های از دست رفته',
      'avg_talk_time_seconds': 'میانگین زمان مکالمه (ثانیه)',
      'missed_call_rate_percentage': 'درصد تماس‌های از دست رفته',
      'answer_rate_percentage': 'درصد پاسخ‌دهی',
      'hour_number': 'شماره ساعت',
      'hour_formatted': 'ساعت (فرمت)',
      'hour_readable': 'ساعت (قابل خواندن)',
      'call_count': 'تعداد تماس',
      'answered_calls': 'تماس‌های پاسخ داده شده',
      'day_number': 'شماره روز',
      'day_name': 'نام روز',
      'date': 'تاریخ',
      'avg_duration_seconds': 'میانگین مدت زمان (ثانیه)',
      'origin_type': 'نوع منشأ',
      'answered_count': 'تعداد پاسخ داده شده',
      'average_queue_time_seconds': 'میانگین زمان صف (ثانیه)',
      'max_queue_time_seconds': 'بیشترین زمان صف (ثانیه)',
      'min_queue_time_seconds': 'کمترین زمان صف (ثانیه)',
      'total_queue_calls': 'کل تماس‌های صف',
      'total_count': 'تعداد کل',
      'answered_with_zero_billsec': 'پاسخ داده شده با صفر ثانیه',
      'no_answer_zero_billsec': 'بدون پاسخ با صفر ثانیه',
      'percentage': 'درصد',
      'caller_number': 'شماره تماس‌گیرنده',
      'first_call': 'اولین تماس',
      'last_call': 'آخرین تماس',
      'time_span_minutes': 'فاصله زمانی (دقیقه)',
      'repeated_caller_rate_percentage': 'درصد تماس‌گیرندگان مکرر',
      'total_repeated_callers': 'کل تماس‌گیرندگان مکرر',
      'unique_callers_total': 'کل تماس‌گیرندگان منحصر',
      'duration_range': 'محدوده مدت زمان',
      'avg_duration_in_range': 'میانگین مدت زمان در محدوده',
      'average_abandoned_duration_seconds': 'میانگین مدت زمان قطع شده (ثانیه)',
      'min_abandoned_duration_seconds': 'کمترین مدت زمان قطع شده (ثانیه)',
      'max_abandoned_duration_seconds': 'بیشترین مدت زمان قطع شده (ثانیه)',
      'abandoned_under_5s': 'قطع شده زیر ۵ ثانیه',
      'abandoned_6_15s': 'قطع شده ۶ تا ۱۵ ثانیه',
      'abandoned_over_15s': 'قطع شده بالای ۱۵ ثانیه',
      'total_abandoned': 'کل قطع شده',
      'breakdown_by_reason': 'تجزیه بر اساس دلیل',
      'no_answer': 'بدون پاسخ',
      'busy': 'اشغال',
      'congestion': 'ازدحام',
      'metric': 'شاخص',
      'value': 'مقدار',
      'reason': 'دلیل',
      'count': 'تعداد'
    };
    
    return translations[columnName] || columnName.replace(/_/g, ' ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">جزئیات داده‌ها</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
          >
            بستن
          </button>
        </div>
        
        {/* Date Selection */}
        {!loading && !error && data?.records && data.records.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">انتخاب تاریخ:</label>
              <select
                value={selectedDate?.format('YYYY/MM/DD') || ''}
                onChange={(e) => {
                  const selectedDateStr = e.target.value;
                  if (selectedDateStr) {
                    const [year, month, day] = selectedDateStr.split('/').map(Number);
                    const newDate = new DateObject({ year, month, day, calendar: persian });
                    onDateChange(newDate);
                  }
                }}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {data.records.map((record: any) => {
                  const dateStr = record.date || record.report_date;
                  const jalali = toJalaliDate(dateStr);
                  return (
                    <option key={dateStr} value={jalali}>
                      {jalali}
                    </option>
                  );
                })}
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {data.records.length} روز داده موجود
              </span>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="text-center text-gray-600 dark:text-gray-300">در حال بارگذاری...</div>
        )}
        {error && (
          <div className="text-center text-red-600 dark:text-red-400">{error}</div>
        )}
        {!loading && !error && data && (
          <div className="space-y-6">
            {/* Show current record data */}
            {data.currentRecord && (
              <>
                {/* Summary Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                    خلاصه روز {toJalaliDate(data.currentRecord.report_date || data.currentRecord.date)}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">کل تماس‌ها</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToLocaleString(data.currentRecord.total_number)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تماس‌های پاسخ داده شده</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToLocaleString(data.currentRecord.number_answered)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نرخ پاسخ‌دهی</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.answer_rate)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">میانگین زمان انتظار</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.average_wait_time)}s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hourly Call Volume Chart */}
                {/* {Array.isArray(data.currentRecord.hourly_call_volume) && data.currentRecord.hourly_call_volume.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                      حجم تماس‌های ساعتی - {data.currentRecord.report_date || data.currentRecord.date}
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.currentRecord.hourly_call_volume}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour_formatted" 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            labelStyle={{ color: '#F9FAFB' }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="call_count" 
                            fill="#3B82F6" 
                            name="کل تماس‌ها"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="answered_calls" 
                            fill="#10B981" 
                            name="تماس‌های پاسخ داده شده"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )} */}

                {/* Peak Hour Analysis Chart */}
                {/* {Array.isArray(data.currentRecord.peak_hour_analysis) && data.currentRecord.peak_hour_analysis.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                      تحلیل ساعات اوج - {data.currentRecord.report_date || data.currentRecord.date}
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.currentRecord.peak_hour_analysis}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour_formatted" 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            labelStyle={{ color: '#F9FAFB' }}
                            formatter={(value: any, name: string) => [
                              typeof value === 'number' ? value.toLocaleString() : value,
                              name === 'call_count' ? 'کل تماس‌ها' : name === 'answered_calls' ? 'تماس‌های پاسخ داده شده' : name
                            ]}
                            labelFormatter={(label) => `ساعت: ${label}`}
                          />
                          <Legend 
                            formatter={(value) => value === 'call_count' ? 'کل تماس‌ها' : value === 'answered_calls' ? 'تماس‌های پاسخ داده شده' : value}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="call_count" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#DBEAFE' }}
                            name="کل تماس‌ها"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="answered_calls" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#D1FAE5' }}
                            name="تماس‌های پاسخ داده شده"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )} */}

                {/* Average Duration by Hour Chart */}
                {Array.isArray(data.currentRecord.avg_duration_by_hour) && data.currentRecord.avg_duration_by_hour.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                      میانگین مدت زمان بر اساس ساعت - {data.currentRecord.report_date || data.currentRecord.date}
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.currentRecord.avg_duration_by_hour}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour_readable" 
                            stroke="#6B7280"
                            fontSize={10}
                            tick={{ fill: '#6B7280' }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis 
                            stroke="#6B7280"
                            fontSize={12}
                            tick={{ fill: '#6B7280' }}
                            label={{ value: 'ثانیه', position: 'insideLeft', style: { textAnchor: 'middle' } }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            labelStyle={{ color: '#F9FAFB' }}
                            formatter={(value: any) => [
                              `${value} ثانیه`,
                              'میانگین مدت زمان'
                            ]}
                            labelFormatter={(label) => `ساعت: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="avg_duration_seconds" 
                            stroke="#8B5CF6" 
                            fill="#8B5CF6"
                            fillOpacity={0.3}
                            strokeWidth={2}
                            name="میانگین مدت زمان"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Data Tables */}
                {data.currentRecord && ['handled_calls_per_operator', 'average_talk_time_per_operator', 'operator_missed_call_rate', 'operator_answer_rate', 'daily_call_volume', 'daily_call_trend'].map((k) => (
                  Array.isArray(data.currentRecord[k]) && data.currentRecord[k].length > 0 && (
                    <div key={k} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                        {k === 'handled_calls_per_operator' ? 'تماس‌های رسیدگی شده توسط اپراتور' :
                         k === 'average_talk_time_per_operator' ? 'میانگین زمان مکالمه هر اپراتور' :
                         k === 'operator_missed_call_rate' ? 'نرخ تماس‌های از دست رفته اپراتور' :
                         k === 'operator_answer_rate' ? 'نرخ پاسخ‌دهی اپراتور' :
                         k === 'daily_call_volume' ? 'حجم تماس‌های روزانه' :
                         k === 'daily_call_trend' ? 'روند تماس‌های روزانه' : k.replace(/_/g, ' ')}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg">
                          <thead className="bg-gray-100 dark:bg-gray-600">
                            <tr>
                              {Object.keys(data.currentRecord[k][0]).map((col) => (
                                <th key={col} className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 font-medium border-b border-gray-200 dark:border-gray-500">
                                  {translateColumnName(col)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.currentRecord[k].map((row: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                {Object.keys(data.currentRecord[k][0]).map((col) => {
                                  const raw = row[col];
                                  let content: any = raw;
                                  if (col === 'date' || col === 'report_date' || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw))) {
                                    content = toJalaliDate(String(raw));
                                  } else if (col === 'day_name' && typeof raw === 'string') {
                                    content = translateDayName(raw);
                                  }
                                  return (
                                    <td key={col} className="px-3 py-2 text-right" dir="ltr">
                                      {typeof content === 'number' ? content.toLocaleString() : String(content)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ))}

                {/* Additional data sections can be added here */}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsModal;
