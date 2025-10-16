import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import { ProvinceCardProps } from '../types';

// Enhanced custom hook for number animation with better data loading handling
const useAnimatedNumber = (targetValue: number, duration: number = 1500, delay: number = 0) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Reset states when target value changes
    setAnimatedValue(0);
    setIsReady(false);

    // Only start animation if we have actual data (not 0 or null/undefined)
    if (targetValue && targetValue > 0) {
      const timer = setTimeout(() => {
        setIsReady(true);
        
        const startTime = Date.now();
        const startValue = 0;
        const endValue = targetValue;

        const animate = () => {
          const currentTime = Date.now();
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Smoother easing function for better visual effect
          const easeOutCubic = 1 - Math.pow(1 - progress, 3);
          const currentValue = startValue + (endValue - startValue) * easeOutCubic;
          
          setAnimatedValue(Math.floor(currentValue));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setAnimatedValue(endValue);
          }
        };

        animate();
      }, delay);

      return () => clearTimeout(timer);
    } else if (targetValue === 0) {
      // If target is 0, show 0 immediately
      setAnimatedValue(0);
      setIsReady(true);
    }
  }, [targetValue, duration, delay]);

  return { value: animatedValue, isReady };
};

// Component for animated number display
const AnimatedNumber: React.FC<{
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  format?: 'number' | 'percentage' | 'time';
  suffix?: string;
}> = ({ value, duration = 1500, delay = 0, className = "", format = 'number', suffix = "" }) => {
  const { value: animatedValue, isReady } = useAnimatedNumber(value, duration, delay);

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'time':
        return `${val.toFixed(1)}s`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <span className={`${className} ${!isReady && value > 0 ? 'opacity-75' : 'opacity-100'} transition-opacity duration-300`}>
      {formatValue(animatedValue)}{suffix}
    </span>
  );
};

// Helper function to convert Gregorian date to Jalali
const convertToJalali = (gregorianDate: string): string => {
  if (!gregorianDate) return '';
  
  try {
    // Parse the Gregorian date (assuming format like YYYY-MM-DD or YYYY/MM/DD)
    const date = new Date(gregorianDate.replace(/\//g, '-'));
    if (isNaN(date.getTime())) return gregorianDate; // Return original if invalid
    
    // Convert to Jalali using DateObject
    const jalaliDate = new DateObject({
      date: date,
      calendar: persian
    });
    
    // Format as YYYY/MM/DD
    return jalaliDate.format('YYYY/MM/DD');
  } catch (error) {
    console.error('Error converting date to Jalali:', error);
    return gregorianDate; // Return original if conversion fails
  }
};

const ProvinceCard: React.FC<ProvinceCardProps> = ({ 
  provinceData, 
  isFirst = false, 
  provinceId = null,
  onOpenDetails,
  startDate,
  endDate
}) => {
  // Check if data is loaded (you can adjust this condition based on your data structure)
  const isDataLoaded = provinceData && Object.keys(provinceData).length > 0;
  
  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals: number = 1): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  // Helper function to safely format integers
  const safeToLocaleString = (value: any): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const handleOpenDetails = () => {
    if (onOpenDetails && provinceId && startDate && endDate) {
      const startRaw = startDate.format('YYYY/MM/DD');
      const endRaw = endDate.format('YYYY/MM/DD');
      onOpenDetails(provinceId, startRaw, endRaw);
    }
  };

  // Prepare pie chart data so that sum equals total_number
  const totalNumber = Number(provinceData.total_number || 0);
  const totalOperator = Number(provinceData.number_answered_operator || 0);
  const totalOperation = Number(provinceData.events_count || 0);
  
  let pieAnswered = Number(provinceData.number_answered || 0);
  let pieUnanswered = Number(provinceData.number_unanswerd || 0);
  let pieBusy = Number(provinceData.number_busy || 0);
  let pieFailed = Number(provinceData.number_failed || 0);
  let pieCongestion = Number(provinceData.congestion || 0);  
  // Calculate sum of the 4 main metrics
  const sumOfFour = pieAnswered + pieUnanswered + pieBusy + pieFailed + pieCongestion;
  
  // Adjust the 4 metrics proportionally to match total_number
  if ( sumOfFour !== totalNumber) {
    const remainder=totalNumber - sumOfFour;
    console.log(remainder   )
    pieCongestion=pieCongestion + remainder;
  }
  
  
  
  
  const pieData = [
    { key: 'answered', labelFa: 'پاسخ داده شده', value: Math.max(0, pieAnswered) },
    { key: 'unanswered', labelFa: 'بدون پاسخ', value: Math.max(0, pieUnanswered) },
    { key: 'busy', labelFa: 'اشغال', value: Math.max(0, pieBusy) },
    { key: 'failed', labelFa: 'ناموفق', value: Math.max(0, pieFailed) },
    { key: 'congestion', labelFa: 'ازدحام', value: Math.max(0, pieCongestion) },
  ] as Array<{ key: string; labelFa: string; value: number }>;

  const pieColors: Record<string, string> = {
    answered: '#10B981', // green
    unanswered: '#EF4444', // red
    busy: '#F59E0B', // amber
    failed: '#6B7280', // gray
    congestion: '#3B82F6', // blue
    other: '#9CA3AF', // neutral gray
  };

  // Show loading skeleton if data is not loaded
  if (!isDataLoaded) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 mb-6 ${isFirst ? 'border-2 border-blue-500' : 'border border-gray-200'} animate-pulse`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
            {!isFirst && <div className="h-4 bg-gray-200 rounded w-32"></div>}
          </div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-6">
          <div className="md:col-span-1 bg-gray-100 rounded-lg p-2 h-80 w-80 mx-auto"></div>
          <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={`province-card-${provinceId ?? 'summary'}`} className={`bg-white rounded-lg shadow-md p-6 mb-6 ${isFirst ? 'border-2 border-blue-500' : 'border border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {isFirst ? 'مجموع کل استان‌ها' : provinceData.province_name}
          </h3>
          {!isFirst && provinceData.transfer_date && provinceData.transfer_time && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">آخرین بروزرسانی:</span>
              <span className="text-xs text-gray-600 font-medium" dir="ltr">
                {convertToJalali(provinceData.transfer_date)} {provinceData.transfer_time}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFirst && <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">خلاصه کلی</span>}
          {!isFirst && provinceId && onOpenDetails && (
            <button
              onClick={handleOpenDetails}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              جزئیات
            </button>
          )}
        </div>
      </div>
      
      
      {/* شاخص‌های اصلی با چیدمان 1/3 (نمودار) و 2/3 (آیتم‌ها) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start mb-6">
        {/* نمودار کوچک - 1/3 */}
        <div className="md:col-span-1 bg-white rounded-lg p-2 border w-full">
          <div className="w-80 h-80 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="labelFa">
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={pieColors[entry.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [typeof value === 'number' ? value.toLocaleString() : value, props?.payload?.labelFa || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 text-center" dir="ltr">
            مجموع: <AnimatedNumber value={totalNumber} delay={100} />
          </div>
        </div>

        {/* آیتم‌ها - 2/3 با سه ستون داخلی */}
        <div className="md:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="text-center bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" dir="ltr">
            <AnimatedNumber value={totalNumber} delay={200} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">کل تماس‌ها</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              کل تعداد تماس‌های دریافتی در بازه زمانی انتخابی
            </div>
          </div>
          <p className="text-xs text-gray-400">Total Calls</p>
        </div>
        <div className="text-center bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" dir="ltr">
            <AnimatedNumber value={totalOperator} delay={200} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p style={{fontSize:"13px"}} className=" text-gray-600">تماس های پاسخ داده شده توسط اپراتور</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              کل تعداد تماس‌های پاسخ داده شده توسط اپراتور
            </div>
          </div>
          <p className="text-xs text-gray-400">Total answered by operator</p>
        </div>
        <div className="text-center bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600" dir="ltr">
            <AnimatedNumber value={totalOperation} delay={200} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس های منجر به عملیات</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              کل تعداد تماس‌های منجر به عملیات
            </div>
          </div>
          <p className="text-xs text-gray-400">Total call lead to operation</p>
        </div>
        <div className="text-center bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600" dir="ltr">
            <AnimatedNumber value={pieAnswered} delay={300} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس‌های پاسخ داده شده</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تعداد تماس‌هایی که توسط اپراتورها پاسخ داده شده
            </div>
          </div>
          <p className="text-xs text-gray-400">Answered Calls</p>
          <p className="text-xs text-green-600" dir="ltr">
            <AnimatedNumber value={totalNumber > 0 ? (pieAnswered / totalNumber) * 100 : 0} delay={350} format="percentage" />
          </p>
        </div>
        <div className="text-center bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600" dir="ltr">
            <AnimatedNumber value={totalNumber > 0 ? (pieAnswered / totalNumber) * 100 : 0} delay={800} format="percentage" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">نرخ پاسخ‌دهی</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              درصد تماس‌های پاسخ داده شده نسبت به کل تماس‌ها
            </div>
          </div>
          <p className="text-xs text-gray-400">Answer Rate</p>
        </div>
        <div className="text-center bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600" dir="ltr">
            <AnimatedNumber value={pieUnanswered} delay={400} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس‌های پاسخ داده نشده</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تعداد تماس‌هایی که پاسخ داده نشده‌اند
            </div>
          </div>
          <p className="text-xs text-gray-400">Unanswered Calls</p>
        </div>
        <div className="text-center bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600" dir="ltr">
            <AnimatedNumber value={pieBusy} delay={500} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس‌های مشغول</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌هایی که با وضعیت مشغول مواجه شده‌اند
            </div>
          </div>
          <p className="text-xs text-gray-400">Busy Calls</p>
        </div>
        
        <div className="text-center bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600" dir="ltr">
            <AnimatedNumber value={pieFailed+pieCongestion} delay={600} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس‌های ناموفق</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌های ناموفق به دلیل دلایل مختلف فنی
            </div>
          </div>
          <p className="text-xs text-gray-400">Failed Calls</p>
        </div>
        {/* <div className="text-center bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600" dir="ltr">
            <AnimatedNumber value={pieCongestion} delay={700} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-sm text-gray-600">تماس‌های ازدحام</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌هایی که به دلیل ازدحام شبکه یا صف تحت تأثیر قرار گرفته‌اند
            </div>
          </div>
          <p className="text-xs text-gray-400">Self help</p>
        </div> */}
        
        </div>
      </div>
      

      {/* شاخص‌های تفصیلی */}
      {/* <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.unique_callers || 0)} delay={900} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">تماس‌گیرندگان منحصر</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تعداد شماره‌های متمایز تماس‌گیرنده در دوره انتخابی
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Unique Callers</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.number_unanswerd || 0)} delay={950} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">بدون پاسخ</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌هایی که توسط اپراتورها پاسخ داده نشده‌اند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Unanswered</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.number_failed || 0)} delay={1000} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">ناموفق</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌های ناموفق به دلیل مشکلات فنی یا مسیریابی
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Failed</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.number_busy || 0)} delay={1050} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">اشغال</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌هایی که با بوق مشغول یا صف پر مواجه شده‌اند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Busy</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.queue_calls || 0)} delay={1100} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">در صف</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              کل تماس‌هایی که وارد صف شده‌اند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">In Queue</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.anonymous_calls || 0)} delay={1150} />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">ناشناس</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              تماس‌هایی که شناسه تماس‌گیرنده مخفی یا در دسترس نیست
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Anonymous</p>
        </div>
      </div> */}

      {/* زمان‌های مختلف */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.average_handle_time_aht || 0)} delay={1200} format="time" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">میانگین زمان رسیدگی</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              میانگین زمان رسیدگی شامل زمان مکالمه و پیگیری
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Average Handle Time</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.average_wait_time || 0)} delay={1250} format="time" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">میانگین انتظار</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              میانگین زمانی که تماس‌گیرندگان قبل از پاسخ منتظر می‌مانند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Average Wait Time</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.max_wait_time || 0)} delay={1300} format="time" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">بیشترین انتظار</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              طولانی‌ترین زمان انتظار تجربه شده توسط هر تماس‌گیرنده
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Max Wait Time</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-700" dir="ltr">
            <AnimatedNumber 
              value={Math.floor(Number(provinceData.total_talk_time || 0) / 60)} 
              delay={1350} 
              suffix="min" 
            />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">کل زمان مکالمه</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              کل زمان تجمعی مکالمه برای تمام تماس‌های پاسخ داده شده
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Total Talk Time</p>
        </div>
      </div> */}

      {/* نرخ‌های کلیدی */}
      {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-semibold text-indigo-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.service_level || 0)} delay={1400} format="percentage" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">سطح خدمات</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              درصد تماس‌هایی که در زمان تعریف شده پاسخ داده شده (مثلاً ۲۰ ثانیه)
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Service Level</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-indigo-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.fcr_rate || 0)} delay={1450} format="percentage" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">حل در اولین تماس</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              حل در اولین تماس: تماس‌هایی که بدون نیاز به پیگیری حل شده‌اند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">First Call Resolution</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-indigo-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.short_call_rate || 0)} delay={1500} format="percentage" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">تماس‌های کوتاه</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              درصد تماس‌های کوتاه کمتر از مدت زمان تعریف شده
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Short Calls Rate</p>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-indigo-700" dir="ltr">
            <AnimatedNumber value={Number(provinceData.call_abandonment_rate || 0)} delay={1550} format="percentage" />
          </div>
          <div className="relative group inline-block cursor-help">
            <p className="text-xs text-gray-500">نرخ رهاسازی</p>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[14rem] rounded bg-gray-900 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
              درصد تماس‌گیرندگانی که قبل از پاسخ دادن تلفن را قطع کرده‌اند
            </div>
          </div>
          <p className="text-[10px] text-gray-400">Abandonment Rate</p>
        </div>
      </div> */}
    </div>
  );
};

export default ProvinceCard;