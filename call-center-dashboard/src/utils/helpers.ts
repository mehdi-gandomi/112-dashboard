// Helper function to convert Persian/Arabic digits to English
export const toEnglishDigits = (value: string): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  return value
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
};

// Helper function to safely format numbers
export const safeToFixed = (value: any, decimals: number = 1): string => {
  const num = Number(value);
  return isNaN(num) ? '0' : num.toFixed(decimals);
};

// Helper function to safely format integers
export const safeToLocaleString = (value: any): string => {
  const num = Number(value);
  return isNaN(num) ? '0' : num.toLocaleString();
};

// Function to translate column names to Persian
export const translateColumnName = (columnName: string): string => {
  const translations: { [key: string]: string } = {
    // Operator related
    'operator': 'اپراتور',
    'handled_calls': 'تماس‌های رسیدگی شده',
    'total_calls': 'کل تماس‌ها',
    'missed_calls': 'تماس‌های از دست رفته',
    'avg_talk_time_seconds': 'میانگین زمان مکالمه (ثانیه)',
    'missed_call_rate_percentage': 'درصد تماس‌های از دست رفته',
    'answer_rate_percentage': 'درصد پاسخ‌دهی',
    
    // Hourly and daily
    'hour_number': 'شماره ساعت',
    'hour_formatted': 'ساعت (فرمت)',
    'hour_readable': 'ساعت (قابل خواندن)',
    'call_count': 'تعداد تماس',
    'answered_calls': 'تماس‌های پاسخ داده شده',
    'day_number': 'شماره روز',
    'day_name': 'نام روز',
    'date': 'تاریخ',
    'avg_duration_seconds': 'میانگین مدت زمان (ثانیه)',
    
    // Call origin
    'origin_type': 'نوع منشأ',
    'answered_count': 'تعداد پاسخ داده شده',
    
    // Queue and zero billsec
    'average_queue_time_seconds': 'میانگین زمان صف (ثانیه)',
    'max_queue_time_seconds': 'بیشترین زمان صف (ثانیه)',
    'min_queue_time_seconds': 'کمترین زمان صف (ثانیه)',
    'total_queue_calls': 'کل تماس‌های صف',
    'total_count': 'تعداد کل',
    'answered_with_zero_billsec': 'پاسخ داده شده با صفر ثانیه',
    'no_answer_zero_billsec': 'بدون پاسخ با صفر ثانیه',
    'percentage': 'درصد',
    
    // Repeated caller
    'caller_number': 'شماره تماس‌گیرنده',
    'first_call': 'اولین تماس',
    'last_call': 'آخرین تماس',
    'time_span_minutes': 'فاصله زمانی (دقیقه)',
    'repeated_caller_rate_percentage': 'درصد تماس‌گیرندگان مکرر',
    'total_repeated_callers': 'کل تماس‌گیرندگان مکرر',
    'unique_callers_total': 'کل تماس‌گیرندگان منحصر',
    
    // Call duration
    'duration_range': 'محدوده مدت زمان',
    'avg_duration_in_range': 'میانگین مدت زمان در محدوده',
    
    // Abandoned calls
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
    
    // Generic
    'metric': 'شاخص',
    'value': 'مقدار',
    'reason': 'دلیل',
    'count': 'تعداد'
  };
  
  return translations[columnName] || columnName.replace(/_/g, ' ');
};

// Fallback province names for simulated "all" mode
export const fallbackProvinceNames = [
  'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'مازندران', 'آذربایجان شرقی',
  'خوزستان', 'کرمان', 'گیلان', 'آذربایجان غربی', 'لرستان', 'مرکزی',
  'سیستان و بلوچستان', 'کردستان', 'همدان', 'چهارمحال و بختیاری',
  'قم', 'اردبیل', 'قزوین', 'گلستان', 'زنجان', 'یزد', 'هرمزگان',
  'ایلام', 'بوشهر', 'خراسان جنوبی', 'خراسان شمالی', 'سمنان', 'البرز',
  'کرمانشاه', 'کهگیلویه و بویراحمد'
];

// Get province names for "all" mode
export const getProvinceNamesForAll = (provincesOptions: any[]): string[] =>
  (provincesOptions.length ? provincesOptions.map(p => p.name) : fallbackProvinceNames);

// Calculate summary data for all provinces
export const calculateSummary = (provincesData: any[]) => {
  const percentageKeys = [
    'call_completion_rate',
    'call_abandonment_rate',
    'answer_rate',
    'short_call_rate',
    'service_level',
    'fcr_rate',
  ];
  const averageKeys = [
    'average_handle_time_aht',
    'average_wait_time',
    'queue_wait_time',
  ];

  const summary = provincesData.reduce((acc, province) => {
    Object.keys(province).forEach((key) => {
      if (
        typeof province[key] === 'number' &&
        !percentageKeys.includes(key) &&
        !averageKeys.includes(key)
      ) {
        acc[key] = (acc[key] || 0) + (province[key] || 0);
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const count = provincesData.length || 1;
  percentageKeys.forEach((k) => {
    summary[k] = provincesData.reduce((sum, p) => sum + (p[k] || 0), 0) / count;
  });
  averageKeys.forEach((k) => {
    summary[k] = provincesData.reduce((sum, p) => sum + (p[k] || 0), 0) / count;
  });

  return summary;
};

// Generate province data with realistic variations
export const generateProvinceData = (provinceName: string, index: number) => {
  const realData = {
    "total_number": 54494,
    "number_answered": 44494,
    "number_unanswerd": 1494,
    "number_failed": 500,
    "number_busy": 400,
    "congestion": 100,
    "duration": 650000,
    "duration_answered": 550000,
    "rightel": 100,
    "irancell": 100,
    "fixed": 100,
    "unknown": 100,
    "taliya": 100,
    "espadan": 100,
    "mci": 100,
    "unique_callers": 14932,
    "answered_calls": 34621,
    "abandoned_calls": 38018,
    "short_answered_calls_5s": 13435,
    "anonymous_calls": 7,
    "queue_calls": 13996,
    "short_calls_less_than_5s": 13435,
    "call_completion_rate": 63.53,
    "call_abandonment_rate": 69.77,
    "answer_rate": 63.53,
    "short_call_rate": 24.65,
    "service_level": 100,
    "fcr_rate": 14.98,
    "average_handle_time_aht": 22.06,
    "average_wait_time": 2.15,
    "queue_wait_time": 1,
    "total_talk_time": 686246,
    "total_wait_time": 3869,
    "max_wait_time": 14
  };

  const variation = 0.7 + (Math.sin(index * 0.5) + 1) * 0.4;
  const populationFactor = getProvincePopulationFactor(provinceName);
  const multiplier = variation * populationFactor;
  
  return {
    province_name: provinceName,
    total_number: Math.floor(realData.total_number * multiplier),
    number_answered: Math.floor(realData.number_answered * multiplier),
    number_unanswerd: Math.floor(realData.number_unanswerd * multiplier),
    number_failed: Math.floor(realData.number_failed * multiplier),
    number_busy: Math.floor(realData.number_busy * multiplier),
    congestion: Math.floor(realData.congestion * multiplier),
    duration: Math.floor(realData.duration * multiplier),
    duration_answered: Math.floor(realData.duration_answered * multiplier),
    rightel: Math.floor(realData.rightel * multiplier),
    irancell: Math.floor(realData.irancell * multiplier),
    fixed: Math.floor(realData.fixed * multiplier),
    unknown: Math.floor(realData.unknown * multiplier),
    taliya: Math.floor(realData.taliya * multiplier),
    espadan: Math.floor(realData.espadan * multiplier),
    mci: Math.floor(realData.mci * multiplier),
    unique_callers: Math.floor(realData.unique_callers * multiplier),
    answered_calls: Math.floor(realData.answered_calls * multiplier),
    abandoned_calls: Math.floor(realData.abandoned_calls * multiplier),
    short_answered_calls_5s: Math.floor(realData.short_answered_calls_5s * multiplier),
    anonymous_calls: Math.floor(realData.anonymous_calls * multiplier),
    queue_calls: Math.floor(realData.queue_calls * multiplier),
    short_calls_less_than_5s: Math.floor(realData.short_calls_less_than_5s * multiplier),
    call_completion_rate: realData.call_completion_rate + (Math.random() - 0.5) * 15,
    call_abandonment_rate: realData.call_abandonment_rate + (Math.random() - 0.5) * 20,
    answer_rate: realData.answer_rate + (Math.random() - 0.5) * 15,
    short_call_rate: realData.short_call_rate + (Math.random() - 0.5) * 8,
    service_level: realData.service_level + (Math.random() - 0.5) * 10,
    fcr_rate: realData.fcr_rate + (Math.random() - 0.5) * 5,
    average_handle_time_aht: realData.average_handle_time_aht + (Math.random() - 0.5) * 8,
    average_wait_time: realData.average_wait_time + (Math.random() - 0.5) * 1.5,
    queue_wait_time: realData.queue_wait_time + Math.random() * 0.5,
    total_talk_time: Math.floor(realData.total_talk_time * multiplier),
    total_wait_time: Math.floor(realData.total_wait_time * multiplier),
    max_wait_time: Math.floor(realData.max_wait_time + Math.random() * 10)
  };
};

// Population factor for each province (approximate)
const getProvincePopulationFactor = (provinceName: string) => {
  const populationFactors: { [key: string]: number } = {
    'تهران': 1.8, 'اصفهان': 1.2, 'فارس': 1.1, 'خراسان رضوی': 1.0,
    'مازندران': 0.8, 'آذربایجان شرقی': 0.9, 'خوزستان': 1.0, 'کرمان': 0.7,
    'گیلان': 0.6, 'آذربایجان غربی': 0.7, 'لرستان': 0.5, 'مرکزی': 0.4,
    'سیستان و بلوچستان': 0.6, 'کردستان': 0.4, 'همدان': 0.4, 'چهارمحال و بختیاری': 0.3,
    'قم': 0.3, 'اردبیل': 0.3, 'قزوین': 0.3, 'گلستان': 0.4, 'زنجان': 0.3,
    'یزد': 0.3, 'هرمزگان': 0.4, 'ایلام': 0.2, 'بوشهر': 0.3, 'خراسان جنوبی': 0.2,
    'خراسان شمالی': 0.2, 'سمنان': 0.2, 'البرز': 0.6, 'کرمانشاه': 0.5, 'کهگیلویه و بویراحمد': 0.2
  };
  return populationFactors[provinceName] || 0.5;
};
