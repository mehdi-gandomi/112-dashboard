import React, { useState } from 'react';
import { DateObject } from 'react-multi-date-picker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import persian from 'react-date-object/calendars/persian';
import { DetailsModalProps } from '../types';
import OperatorsPieChart from './OperatorsPieChart';
import OperatorsTable from './OperatorsTable';

const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  loading,
  error,
  data,
  selectedDate,
  onDateChange
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  
  const formatTimeFromSeconds = (seconds: number): string => {
    if (!seconds && seconds !== 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      remainingSeconds.toString().padStart(2, '0')
    ].join(':');
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
      'unique_callers': 'تماس‌گیرندگان منحصر به فرد',
      'unique_callers_per_day': 'تماس‌گیرندگان منحصر به فرد در روز',
      'total_talk_time_per_day': 'کل زمان مکالمه در روز',
      'avg_talk_time_per_day': 'میانگین زمان مکالمه در روز',
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
      'count': 'تعداد',
      // Peak hour analysis translations
      'total_talk_time': 'کل زمان مکالمه',
      'unique_callers_per_hour': 'تماس‌گیرندگان منحصر به فرد در ساعت',
      'max_duration_per_hour': 'حداکثر مدت تماس در ساعت',
      'avg_duration': 'میانگین مدت تماس',
      // Repeated caller analysis translations

      'province_name': 'نام استان',
      'selected_province': 'استان انتخاب شده',
      'peak_hour_analysis': 'تحلیل ساعات اوج',
      'repeated_caller_analysis': 'تحلیل تماس‌گیرندگان مکرر',
      'repeated_callers': 'تماس‌گیرندگان مکرر'
    };
    
    return translations[columnName] || columnName.replace(/_/g, ' ');
  };

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${isFullscreen ? 'w-full h-full max-w-none max-h-none m-0' : 'max-w-4xl w-full mx-4 p-6 max-h-[80vh]'} overflow-y-auto transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">جزئیات داده‌ها</h3>
          <div className="flex gap-2">
            <button
              onClick={toggleFullscreen}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-300 mr-2"
              title={isFullscreen ? "خروج از حالت تمام صفحه" : "نمایش تمام صفحه"}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0v5m16 0V4m0 0h-5m5 0l-5 5M4 16v4m0 0h5m-5 0l5-5m11 5l-5-5m5 5v-4m0 4h-5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
            >
              بستن
            </button>
          </div>
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
                  const jalali = dateStr;
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
                {/* Province Display - Moved to top position */}
                {data.currentRecord.province_name && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4 sticky top-0 z-10 shadow-md">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 text-lg text-center">
                      {translateColumnName('selected_province')}: {data.currentRecord.province_name}
                    </h4>
                  </div>
                )}
                
                {/* Summary Card */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                    خلاصه روز {data.currentRecord.report_date || data.currentRecord.date}
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
                        {safeToFixed(data.currentRecord.call_completion_rate)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">میانگین زمان پاسخگویی</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.average_speed_of_answer_asa)}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تماس‌های بدون پاسخ</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToLocaleString(data.currentRecord.number_unanswerd)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">میانگین زمان مکالمه</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.average_handle_time_aht)}s
                      </div>
                    </div>
                    {/* <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">سطح سرویس</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.service_level)}%
                      </div>
                    </div> */}
                    {/* <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">نرخ رها کردن تماس</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToFixed(data.currentRecord.call_abandonment_rate)}%
                      </div>
                    </div> */}
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مدت زمان کل</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {data.currentRecord.duration_seconds ? formatTimeFromSeconds(data.currentRecord.duration_seconds) : (data.currentRecord.duration || "00:00:00")}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">مدت زمان پاسخ داده شده</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {data.currentRecord.duration_answered_seconds ? formatTimeFromSeconds(data.currentRecord.duration_answered_seconds) : (data.currentRecord.duration_answered || "00:00:00")}
                      </div>
                    </div>
                  </div>
                  
                  {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تماس‌های ناموفق</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToLocaleString(data.currentRecord.number_failed)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">تماس‌های مشغول</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {safeToLocaleString(data.currentRecord.number_busy)}
                      </div>
                    </div>
                  </div> */}
                </div>

                {/* Hourly Call Volume Chart */}
                {Array.isArray(data.currentRecord.hourly_call_volume) && data.currentRecord.hourly_call_volume.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                      حجم تماس‌های ساعتی - {data.currentRecord.report_date || data.currentRecord.date}
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.currentRecord.hourly_call_volume}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour_readable" 
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
                            dataKey="avg_duration" 
                            fill="#10B981" 
                            name="میانگین مدت تماس"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Peak Hour Analysis Chart */}
                {Array.isArray(data.currentRecord.peak_hour_analysis) && data.currentRecord.peak_hour_analysis.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-100 text-lg">
                      تحلیل ساعات اوج - {data.currentRecord.report_date || data.currentRecord.date}
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.currentRecord.peak_hour_analysis}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="hour_readable" 
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
                              name === 'call_count' ? 'تعداد تماس' : 
                              name === 'avg_duration' ? 'میانگین مدت تماس' : 
                              name === 'unique_callers_per_hour' ? 'تماس‌گیرندگان منحصر به فرد' : name
                            ]}
                            labelFormatter={(label) => `ساعت: ${label}`}
                          />
                          <Legend 
                            formatter={(value) => 
                              value === 'call_count' ? 'تعداد تماس' : 
                              value === 'avg_duration' ? 'میانگین مدت تماس' : 
                              value === 'unique_callers_per_hour' ? 'تماس‌گیرندگان منحصر به فرد' : value
                            }
                          />
                          <Line 
                            type="monotone" 
                            dataKey="call_count" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#DBEAFE' }}
                            name="تعداد تماس"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="avg_duration" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2, fill: '#D1FAE5' }}
                            name="میانگین مدت تماس"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="unique_callers_per_hour" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#F59E0B', strokeWidth: 2, fill: '#FEF3C7' }}
                            name="تماس‌گیرندگان منحصر به فرد"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Repeated Caller Analysis */}
                {data.currentRecord.repeated_caller_analysis && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold mb-3 text-purple-800 dark:text-purple-200 text-lg">
                      تحلیل تماس‌گیرندگان مکرر
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600 dark:text-gray-400">درصد تماس‌گیرندگان مکرر</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {safeToFixed(data.currentRecord.repeated_caller_analysis.repeated_caller_rate_percentage)}%
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600 dark:text-gray-400">کل تماس‌گیرندگان مکرر</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {safeToLocaleString(data.currentRecord.repeated_caller_analysis.total_repeated_callers)}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <div className="text-sm text-gray-600 dark:text-gray-400">کل تماس‌گیرندگان منحصر به فرد</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {safeToLocaleString(data.currentRecord.repeated_caller_analysis.unique_callers_total)}
                        </div>
                      </div>
                    </div>
                    
                    {Array.isArray(data.currentRecord.repeated_caller_analysis.repeated_callers) && 
                     data.currentRecord.repeated_caller_analysis.repeated_callers.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                          <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                شماره تماس‌گیرنده
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                تعداد تماس
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                اولین تماس
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                آخرین تماس
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                فاصله زمانی (دقیقه)
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                میانگین زمان مکالمه
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {data.currentRecord.repeated_caller_analysis.repeated_callers.map((caller: any, index: number) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {caller.caller_number}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {safeToLocaleString(caller.call_count)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {caller.first_call}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {caller.last_call}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {safeToLocaleString(caller.time_span_minutes)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                  {formatTimeFromSeconds(caller.avg_talk_time_seconds)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Operators Distribution Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Operators Pie Chart */}
                  <OperatorsPieChart 
                    summaryData={{
                      mci: data.currentRecord.mci,
                      irancell: data.currentRecord.irancell,
                      rightel: data.currentRecord.rightel,
                      fixed: data.currentRecord.fixed,
                      taliya: data.currentRecord.taliya,
                      espadan: data.currentRecord.espadan,
                      other: data.currentRecord.other,
                      total_number: data.currentRecord.total_number
                    }}
                    title="توزیع اپراتورهای شبکه"
                  />
                  
                  {/* Operators Table */}
                  <OperatorsTable 
                    summaryData={{
                      mci: data.currentRecord.mci,
                      irancell: data.currentRecord.irancell,
                      rightel: data.currentRecord.rightel,
                      fixed: data.currentRecord.fixed,
                      taliya: data.currentRecord.taliya,
                      espadan: data.currentRecord.espadan,
                      other: data.currentRecord.other,
                      total_number: data.currentRecord.total_number
                    }}
                    title="جدول اپراتورهای شبکه"
                  />
                </div>
                {/* , 'operator_missed_call_rate' */}
                {/* Data Tables */}
                {data.currentRecord && ['handled_calls_per_operator', 'average_talk_time_per_operator', 'operator_answer_rate', 'daily_call_volume', 'daily_call_trend'].map((k) => (
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
                                col != "day_number" && <th key={col} className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 font-medium border-b border-gray-200 dark:border-gray-500">
                                  {translateColumnName(col)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.currentRecord[k].map((row: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                {Object.keys(data.currentRecord[k][0]).map((col) => {
                                  if (col === "day_number") {
                                    return null;
                                  }
                                  const raw = row[col];
                                  let content: any = raw;
                                  if (col === 'date' || col === 'report_date' || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw))) {
                                    content = toJalaliDate(String(raw));
                                  } else if (col === 'day_name' && typeof raw === 'string') {
                                    content = translateDayName(raw);
                                  } else if ((col.includes('talk_time') || col.includes('duration') || col.includes('queue_time'))) {
                                    content = formatTimeFromSeconds(+raw);
                                  }
                                  return (
                                    <td key={col} className="px-3 py-2 text-right" dir="ltr">
                                      {typeof content === 'number' && !col.includes('talk_time') && !col.includes('duration') && !col.includes('queue_time') 
                                        ? content.toLocaleString() 
                                        : String(content)}
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
