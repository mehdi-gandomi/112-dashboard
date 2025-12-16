import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// اگر نوع ProvinceData در مسیر دیگری است، مطابق پروژه‌ی خودتان تنظیم کنید
export interface ProvinceData {
  mci?: number | string;
  irancell?: number | string;
  rightel?: number | string;
  fixed?: number | string;
  taliya?: number | string;
  espadan?: number | string;
  other?: number | string;
  total_number?: number | string;
}

interface OperatorsPieChartProps {
  summaryData: ProvinceData | null;
  title?: string;
  /** اگر نمودار داخل تب/آکاردئون رندر می‌شود و هنگام باز/بسته شدن باید رفرش شود،
   *  این مقدار را تغییر دهید تا کل نمودار remount شود. */
  visibilityKey?: string | number;
  /** حداقل ارتفاع ظرف برای اطمینان از داشتن فضا در حالت Responsive */
  minHeight?: number;
}

/**
 * نسخه‌ی کاملاً اصلاح‌شده با این تغییرات:
 * - تبدیل مطمئن تمام مقادیر به Number (مشکل داده‌های رشته‌ای)
 * - جلوگیری از رندر وقتی مجموع صفر است و نمایش Empty state
 * - اعمال minHeight روی ظرف و استفاده از ResponsiveContainer با debounce
 * - Tooltip سفارشی با درصد و تعداد
 * - لیبل درصد فقط برای سگمنت‌های > 5%
 * - Legend با رنگ صحیح هر آیتم
 */
const OperatorsPieChart: React.FC<OperatorsPieChartProps> = ({
  summaryData,
  title = 'نمودار دایره‌ای اپراتورها',
  visibilityKey,
  minHeight = 320,
}) => {
  // مبدل امن عددی
  const N = (v: unknown, fallback = 0): number => {
    const num = Number(v);
    return Number.isFinite(num) ? num : fallback;
  };

  // داده‌ی خام + تبدیل عددی
  const raw = useMemo(
    () => [
      { name: 'همراه اول', value: N(summaryData?.mci), color: '#3B82F6' },
      { name: 'ایرانسل', value: N(summaryData?.irancell), color: '#F59E0B' },
      { name: 'رایتل', value: N(summaryData?.rightel), color: '#10B981' },
      { name: 'تلفن ثابت', value: N(summaryData?.fixed), color: '#8B5CF6' },
      { name: 'تالیا', value: N(summaryData?.taliya), color: '#EC4899' },
      { name: 'اسپادان', value: N(summaryData?.espadan), color: '#6366F1' },
      { name: 'بدون سیم کارت', value: N(summaryData?.other), color: '#6B7280' },
    ],
    [summaryData]
  );

  // بررسی و تنظیم مقادیر اگر مجموع بیش از 100 درصد باشد
  const adjustedRaw = useMemo(() => {
    const totalProvided = N(summaryData?.total_number);
    const totalComputed = raw.reduce((s, d) => s + d.value, 0);
    
    // اگر مجموع بیش از 100 درصد نیست، نیازی به تنظیم نیست
    if (totalComputed <= totalProvided || totalProvided === 0) {
      return raw;
    }
    
    // مقدار اضافی که باید از "بدون سیم کارت" کم شود
    const excess = totalComputed - totalProvided;
    
    // پیدا کردن ایندکس "بدون سیم کارت"
    const otherIndex = raw.findIndex(item => item.name === 'بدون سیم کارت');
    
    // اگر "بدون سیم کارت" وجود نداشت یا مقدار آن کمتر از مقدار اضافی بود
    if (otherIndex === -1 || raw[otherIndex].value <= excess) {
      // کاهش نسبی از همه مقادیر
      const ratio = totalProvided / totalComputed;
      return raw.map(item => ({
        ...item,
        value: Math.max(0, Math.round(item.value * ratio))
      }));
    }
    
    // کاهش مقدار اضافی از "بدون سیم کارت"
    return raw.map((item, index) => 
      index === otherIndex 
        ? { ...item, value: Math.max(0, item.value - excess) }
        : item
    );
  }, [raw, summaryData?.total_number]);

  const totalProvided = N(summaryData?.total_number);
  const totalComputed = adjustedRaw.reduce((s, d) => s + d.value, 0);
  // اگر total_number داده نشده بود، از مجموع محاسبه شده استفاده کن
  const TOTAL = totalProvided > 0 ? totalProvided : totalComputed;

  // فقط اپراتورهای دارای مقدار > 0 نمایش داده شوند
  const data = raw.filter((d) => d.value > 0);

  // در صورت نبود داده، Empty State
  if (!TOTAL || TOTAL <= 0 || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400">داده‌ای برای نمایش وجود ندارد</p>
      </div>
    );
  }

  // Tooltip سفارشی
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const { name, value, payload: row } = payload[0];
      const percent = ((value / TOTAL) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">تماس‌ها: {Number(value).toLocaleString('fa-IR')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">درصد: {percent}%</p>
        </div>
      );
    }
    return null;
  };

  // لیبل درصد روی هر سگمنت (نمایش فقط اگر >5%)
  const renderLabel = (entry: any) => {
    const p = ((entry.value / TOTAL) * 100).toFixed(1);
    return Number(p) > 5 ? `${p}%` : '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6" key={visibilityKey}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">{title}</h3>

      {/* ظرف با ارتفاع تضمین‌شده */}
      <div style={{ width: '100%', minHeight }}>
        <ResponsiveContainer width="100%" height={300} debounce={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={0}
              labelLine={false}
              label={renderLabel}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="bottom"
              height={36}
              // نمایش نام با رنگ همان سگمنت
              formatter={(value: any, entry: any) => (
                <span style={{ color: (entry?.payload as any)?.color || '#111827' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* آمار کلی */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          مجموع کل: {TOTAL.toLocaleString('fa-IR')} تماس
        </p>
      </div>
    </div>
  );
};

export default OperatorsPieChart;
