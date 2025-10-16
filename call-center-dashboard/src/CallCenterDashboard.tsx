import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Clock, Users, TrendingUp, TrendingDown, AlertCircle, Activity, Timer, UserCheck, Sun, Moon, User as UserIcon, ChevronDown, LogOut, Download } from 'lucide-react';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import OperatorsPieChart from './components/OperatorsPieChart';

// Components
import MetricCard from './components/MetricCard';
import ProvinceCard from './components/ProvinceCard';
import OperatorsTable from './components/OperatorsTable';
import DetailsModal from './components/DetailsModal';
import IranMapDashboard from './components/IranMapDashboard';
import ProvincesMetricsChart from './components/ProvincesMetricsChart';
import BackToTopButton from './components/BackToTopButton';
// Types
import { ProvinceData, ProvinceOption, DailyMetrics } from './types';

// Utilities
import { 
  toEnglishDigits, 
  safeToFixed, 
  safeToLocaleString, 
  getProvinceNamesForAll,
  calculateSummary,
  generateProvinceData
} from './utils/helpers';

// Translations
import translations from './translations/fa.json';

const CallCenterDashboard = ({ user, token, onLogout }: { user?: any; token?: string; onLogout?: () => void }) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('all');
  const [provincesOptions, setProvincesOptions] = useState<ProvinceOption[]>([]);
  const [allProvincesData, setAllProvincesData] = useState<ProvinceData[]>([]);
  const [summaryData, setSummaryData] = useState<ProvinceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [startDate, setStartDate] = useState<DateObject | null>(new DateObject({ calendar: persian }).subtract(5,'d'));
  const [endDate, setEndDate] = useState<DateObject | null>(new DateObject({ calendar: persian }));
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [selectedDetailDate, setSelectedDetailDate] = useState<DateObject | null>(new DateObject({ calendar: persian }));
  const [currentProvinceId, setCurrentProvinceId] = useState<string>('');
  const [currentStartDate, setCurrentStartDate] = useState<string>('');
  const [currentEndDate, setCurrentEndDate] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  const apiUrl: string = ((import.meta as any)?.env?.VITE_BASE_API_URL as string) || 'https://112.rcs.ir/api';

  // Initialize theme from localStorage or default to system
  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'system' | 'light' | 'dark' | null) || 'system';
    setTheme(saved);
  }, []);

  // Function to handle Excel export
  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      // Prepare the date parameters
      const startRaw = (startDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
      const endRaw = (endDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
      const start = toEnglishDigits(startRaw);
      const end = toEnglishDigits(endRaw);
      
      // Create the export URL
      const exportUrl = `${apiUrl}/export_excel.php?province_id=${encodeURIComponent(selectedProvinceId)}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
      
      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = exportUrl;
      if (token) {
        // For authenticated requests, we need to handle it differently
        const response = await fetch(exportUrl, { 
          headers: { Authorization: `Bearer ${token}` },
          method: 'GET'
        });
        
        if (!response.ok) throw new Error('Export failed');
        
        // Get the blob from the response
        const blob = await response.blob();
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        
        // Set the filename from the Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            link.download = filenameMatch[1];
          } else {
            link.download = `call-center-data-${start}-to-${end}.xlsx`;
          }
        } else {
          link.download = `call-center-data-${start}-to-${end}.xlsx`;
        }
      } else {
        // For non-authenticated requests, we can directly set the href
        link.download = `call-center-data-${start}-to-${end}.xlsx`;
      }
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export error:', error);
      alert(translations.dashboard.exportError || 'خطا در دریافت فایل اکسل');
    } finally {
      setExportLoading(false);
    }
  };

  // Apply theme and persist, also react to system changes when in system mode
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', dark);
    };
    apply();
    localStorage.setItem('theme', theme);
    const handle = () => theme === 'system' && apply();
    media.addEventListener('change', handle);
    return () => media.removeEventListener('change', handle);
  }, [theme]);

  const setThemeExplicit = (value: 'system' | 'light' | 'dark') => setTheme(value);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle province selection from Iran map by ID: scroll to the province card
  const handleSelectProvinceById = (provinceId: string) => {
    const el = document.getElementById(`province-card-${provinceId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Initialize province based on user province if available
  useEffect(() => {
    const u = user || (localStorage.getItem('authUser') ? JSON.parse(localStorage.getItem('authUser') as string) : null);
    const pid = u?.province_id;
    if (pid !== undefined && pid !== null) {
      setSelectedProvinceId(String(pid === 0 ? 'all' : pid));
    }
  }, [user]);

  // Fetch provinces from backend
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await fetch(`${apiUrl}/provinces.php`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const data = await res.json();
        if (Array.isArray(data?.provinces)) {
          setProvincesOptions(data.provinces);
        }
      } catch (e) {
        // Fallback: keep empty; user can still use simulated "all"
      }
    };
    loadProvinces();
  }, []);

  // شبیه‌سازی فراخوانی API
  const fetchData = async (province: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      if (province === 'all') {
        // Call backend with province_id=0 and selected Jalali date range (defaults to today)
        const startRaw = (startDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
        const endRaw = (endDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
        const start = toEnglishDigits(startRaw);
        const end = toEnglishDigits(endRaw);
        const url = `${apiUrl}/province_metrics.php?province_id=0&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const summary = (data?.summary || {}) as any;
        const metricsArr = Array.isArray(data?.metrics) ? data.metrics : [];
        const provincesData = metricsArr.map((row: any) => ({
          province_name: row.province_name ?? String(row.province_id ?? ''),
          transfer_time: row.transfer_time,
          transfer_date: row.transfer_date,
          province_id: row.province_id,
          total_number: row.total_number || 0,
          number_answered: row.number_answered || 0,
          number_answered_operator: row.number_answered_operator || 0,
          events_count: row.events_count || 0,
          number_unanswerd: row.number_unanswerd || 0,
          number_failed: row.number_failed || 0,
          number_busy: row.number_busy || 0,
          congestion: row.congestion || 0,
          rightel: row.rightel || 0,
          irancell: row.irancell || 0,
          fixed: row.fixed || 0,
          unknown: row.unknown || 0,
          taliya: row.taliya || 0,
          espadan: row.espadan || 0,
          mci: row.mci || 0,
          abandoned_calls: row.abandoned_calls || 0,
          short_calls_less_than_5s: row.short_calls_less_than_5s || 0,
          answer_rate: row.answer_rate || 0,
          call_abandonment_rate: row.call_abandonment_rate || 0,
          service_level: row.service_level || 0,
          fcr_rate: row.fcr_rate || 0,
          average_handle_time_aht: row.average_handle_time_aht || 0,
          average_wait_time: row.average_wait_time || 0,
          queue_calls: row.queue_calls || 0,
          total_wait_time: row.total_wait_time || 0,
        }));
        setAllProvincesData(provincesData);
        setDailyMetrics([]);
        setSummaryData({
          total_number: summary.total_number || 0,
          number_answered: summary.number_answered || 0,
          number_answered_operator: summary.number_answered_operator || 0,
          events_count: summary.events_count || 0,
          number_unanswerd: summary.number_unanswerd || 0,
          number_failed: summary.number_failed || 0,
          number_busy: summary.number_busy || 0,
          congestion: summary.congestion || 0,
          rightel: summary.rightel || 0,
          irancell: summary.irancell || 0,
          fixed: summary.fixed || 0,
          unknown: summary.unknown || 0,
          taliya: summary.taliya || 0,
          espadan: summary.espadan || 0,
          mci: summary.mci || 0,
          abandoned_calls: summary.abandoned_calls || 0,
          short_calls_less_than_5s: summary.short_calls_less_than_5s || 0,
          answer_rate: summary.answer_rate || 0,
          call_abandonment_rate: summary.call_abandonment_rate || 0,
          service_level: summary.service_level || 0,
          fcr_rate: summary.fcr_rate || 0,
          average_handle_time_aht: summary.average_handle_time_aht || 0,
          average_wait_time: summary.average_wait_time || 0,
          queue_calls: summary.queue_calls || 0,
          total_wait_time: summary.total_wait_time || 0,
        });
      } else {
        // Fetch from backend using province_id and Jalali dates
        const startRaw = (startDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
        const endRaw = (endDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
        const start = toEnglishDigits(startRaw);
        const end = toEnglishDigits(endRaw);
        const url = `${apiUrl}/province_metrics.php?province_id=${encodeURIComponent(province)}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const m = (data?.summary || {}) as any;
        const dailyArr = Array.isArray(data?.metrics) ? (data.metrics as any[]) : [];
        const provinceData: ProvinceData = {
          province_name: provincesOptions.find(p => String(p.id) === province)?.name || '',
          transfer_time: m.transfer_time,
          transfer_date: m.transfer_date,
          province_id: province,
          total_number: m.total_number || 0,
          number_answered: m.number_answered || 0,
          number_answered_operator: m.number_answered_operator || 0,
          events_count: m.events_count || 0,
          number_unanswerd: m.number_unanswerd || 0,
          number_failed: m.number_failed || 0,
          number_busy: m.number_busy || 0,
          congestion: m.congestion || 0,
          rightel: m.rightel || 0,
          irancell: m.irancell || 0,
          fixed: m.fixed || 0,
          unknown: m.unknown || 0,
          taliya: m.taliya || 0,
          espadan: m.espadan || 0,
          mci: m.mci || 0,
          abandoned_calls: m.abandoned_calls || 0,
          short_calls_less_than_5s: m.short_calls_less_than_5s || 0,
          answer_rate: m.answer_rate || 0,
          call_abandonment_rate: m.call_abandonment_rate || 0,
          service_level: m.service_level || 0,
          fcr_rate: m.fcr_rate || 0,
          average_handle_time_aht: m.average_handle_time_aht || 0,
          average_wait_time: m.average_wait_time || 0,
          queue_calls: m.queue_calls || 0,
          total_wait_time: m.total_wait_time || 0,
        };
        setAllProvincesData([provinceData]);
        setDailyMetrics(
          dailyArr.map((row: any) => ({
            record_id: row.record_id ? Number(row.record_id) : undefined,
            report_date: String(row.report_date ?? ''),
            total_number: row.total_number || 0,
            number_answered: row.number_answered || 0,
            abandoned_calls: row.abandoned_calls || 0,
            answer_rate: row.answer_rate || 0,
            average_handle_time_aht: row.average_handle_time_aht || 0,
            average_wait_time: row.average_wait_time || 0,
          }))
        );
        setSummaryData(provinceData);
      }
    } catch (err) {
      setError(translations.dashboard.error);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDailyRecordDetails = async (provinceId?: string, startDateParam?: string, endDateParam?: string) => {
    if (!provinceId) return;
    
    setDetailsModalOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    setDetailsData(null);
    
    // Set current parameters for date selection
    setCurrentProvinceId(provinceId);
    setCurrentStartDate(startDateParam || '');
    setCurrentEndDate(endDateParam || '');
    
    // Set initial selected date to start date
    if (startDateParam) {
      const [year, month, day] = startDateParam.split('/').map(Number);
      setSelectedDetailDate(new DateObject({ year, month, day, calendar: persian }));
    } else {
      setSelectedDetailDate(new DateObject({ calendar: persian }));
    }
    
    try {
      const startRaw = startDateParam || (startDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
      const endRaw = endDateParam || (endDate ?? new DateObject({ calendar: persian })).format('YYYY/MM/DD');
      const start = toEnglishDigits(startRaw);
      const end = toEnglishDigits(endRaw);
      
      const url = `${apiUrl}/daily_record_details.php?province_id=${encodeURIComponent(provinceId)}&start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setDetailsData(data);
    } catch (e: any) {
      setDetailsError(translations.modal.error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDetailDateChange = async (newDate: DateObject | null) => {
    if (!newDate || !currentProvinceId || !detailsData?.records) return;
    
    setSelectedDetailDate(newDate);
    const selectedDateStr = newDate.format('YYYY/MM/DD');
    
    // Find the record for the selected date
    const selectedRecord = detailsData.records.find((record: any) => 
      record.date === selectedDateStr || record.report_date === selectedDateStr
    );
    
    if (selectedRecord) {
      setDetailsData({
        ...detailsData,
        currentRecord: {
          ...selectedRecord,
          report_date: selectedRecord.date || selectedRecord.report_date
        }
      });
    }
  };

  useEffect(() => {
    fetchData(selectedProvinceId);
  }, [selectedProvinceId]);

  if (loading && !summaryData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{translations.dashboard.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => fetchData(selectedProvinceId)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {translations.dashboard.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{translations.dashboard.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{translations.dashboard.subtitle}</p>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center gap-2">
                <select
                  value={selectedProvinceId}
                  onChange={(e) => setSelectedProvinceId(e.target.value)}
                  className="block w-48 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{translations.dashboard.allProvinces}</option>
                  {provincesOptions.map(p => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{translations.dashboard.from}</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={startDate}
                    onChange={(d) => setStartDate(d as DateObject)}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    
                      inputClass="w-32 sm:w-36 px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">{translations.dashboard.to}</label>
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    value={endDate}
                    onChange={(d) => setEndDate(d as DateObject)}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    inputClass="w-32 sm:w-36 px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <button
                onClick={() => fetchData(selectedProvinceId)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? translations.dashboard.updating : translations.dashboard.update}
              </button>
              
              {/* Excel Export Button */}
              <button
                onClick={handleExportExcel}
                disabled={exportLoading || loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                title="دریافت فایل اکسل"
              >
                <Download className="h-4 w-4" />
                {exportLoading ? 'در حال دریافت...' : 'دریافت اکسل'}
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="ml-3 flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title={user?.username || user?.name || 'کاربر'}
                >
                  <UserIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute left-0 mt-2 w-44 origin-top-left rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                    <div className="py-1">
                      <button
                        className="w-full text-right flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => { setIsUserMenuOpen(false); setIsProfileOpen(true); }}
                      >
                        <UserIcon className="h-4 w-4" /> پروفایل
                      </button>
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onLogout?.(); }}
                        className="w-full text-right flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4" /> خروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsProfileOpen(false)}></div>
          <div className="relative z-40 w-full max-w-sm mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">پروفایل کاربر</h3>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">✕</button>
            </div>
            <div className="px-5 py-4 space-y-3 text-sm text-gray-800 dark:text-gray-200">
              <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">نام کاربری</span><span dir="ltr">{user?.username || user?.name || '-'}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">شناسه استان</span><span>{String(user?.province_id ?? '-')}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500 dark:text-gray-400">استان انتخابی</span><span>{selectedProvinceId === 'all' ? translations.dashboard.allProvinces : (provincesOptions.find(p => String(p.id) === selectedProvinceId)?.name || selectedProvinceId)}</span></div>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button onClick={() => setIsProfileOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">بستن</button>
              <button onClick={() => { setIsProfileOpen(false); onLogout?.(); }} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">خروج</button>
            </div>
          </div>
        </div>
      )}
        
      <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedProvinceId === 'all' ? (
          <>
            {/* Summary */}
            {summaryData && (
              <ProvinceCard 
                provinceData={summaryData} 
                isFirst={true} 
                provinceId={summaryData.province_id}
                onOpenDetails={openDailyRecordDetails}
                startDate={startDate}
                endDate={endDate}
              />
            )}
            
            

            {/* Provinces Metrics Chart */}
            {selectedProvinceId == 'all' && (
              <ProvincesMetricsChart 
              provincesData={allProvincesData}
              selectedMetrics={['total_number', 'number_answered', 'number_unanswerd', 'number_failed', 'number_busy', 'congestion']}
            />
            )}

            {/* Iran Map Dashboard (only when all provinces selected) */}
            <div className="mb-8 flex">
              <IranMapDashboard 
                provincesData={allProvincesData}
                provincesOptions={provincesOptions}
                onSelectProvinceById={handleSelectProvinceById}
              />
              <div className="w-full">
                {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {/* <MetricCard
                title={translations.metrics.totalCalls}
                value={summaryData?.total_number?.toLocaleString() || '0'}
                subValue={`${summaryData?.unique_callers?.toLocaleString() || '0'} ${translations.metrics.uniqueCallers}`}
                icon={Phone}
                trend={5.2}
                color="blue"
              />
              <MetricCard
                title={translations.metrics.answeredCalls}
                value={summaryData?.number_answered?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.answer_rate, 1) || '0'}% ${translations.metrics.answerRate}`}
                icon={PhoneCall}
                trend={2.1}
                color="green"
              />
              <MetricCard
                title={translations.metrics.abandonedCalls}
                value={summaryData?.abandoned_calls?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.call_abandonment_rate, 1) || '0'}% ${translations.metrics.abandonmentRate}`}
                icon={PhoneOff}
                trend={-1.8}
                color="red"
              /> */}
              <MetricCard
                title={translations.metrics.averageWaitTime}
                value={`${safeToFixed(summaryData?.average_wait_time, 1) || '0'}ثانیه`}
                
                icon={Clock}
                trend={-0.5}
                color="yellow"
              />
              <MetricCard
                title={translations.metrics.serviceLevel}
                value={`${safeToFixed(summaryData?.service_level, 1) || '0'}%`}
                subValue={translations.metrics.serviceLevelStandard}
                icon={Activity}
                trend={3.2}
                color="purple"
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              
              <MetricCard
                title={translations.metrics.shortCalls}
                value={summaryData?.short_calls_less_than_5s?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.short_call_rate, 1) || '0'}% از کل`}
                icon={Timer}
                trend={-2.1}
                color="orange"
              />
              <MetricCard
                title={translations.metrics.busyCalls}
                value={summaryData?.number_busy?.toLocaleString() || '0'}
                subValue={translations.metrics.needsOptimization}
                icon={AlertCircle}
                trend={-1.2}
                color="gray"
              />
            </div>
              </div>
            </div>

            {/* Operators Table */}
            <div className="grid grid-cols-2 gap-6">
  <OperatorsTable summaryData={summaryData} />
  <OperatorsPieChart summaryData={summaryData} />
</div>

                         {/* Province Details */}
             <div className="space-y-6">
               <h2 className="text-xl font-bold text-gray-900 mb-4">جزئیات استان‌ها</h2>
               {allProvincesData
  
  .sort((a, b) =>
    String(a.province_name ?? '').localeCompare(
      String(b.province_name ?? ''),
      'fa',
      { numeric: true, sensitivity: 'base' }
    )
  )
  .map((provinceData, index) => (
    <ProvinceCard
      key={index}
      provinceData={provinceData}
      provinceId={provinceData.province_id}
      onOpenDetails={openDailyRecordDetails}
      startDate={startDate}
      endDate={endDate}
    />
  ))}
             </div>
          </>
        ) : (
          <>
            {/* Selected Province */}
            {allProvincesData.length > 0 && (
              <ProvinceCard 
                provinceData={allProvincesData[0]} 
                provinceId={allProvincesData[0].province_id}
                onOpenDetails={openDailyRecordDetails}
                startDate={startDate}
                endDate={endDate}
              />
            )}

            {/* Province Metrics Chart */}
            <ProvincesMetricsChart 
              provincesData={allProvincesData}
              selectedMetrics={['total_number', 'number_answered', 'number_unanswerd', 'number_failed', 'number_busy', 'congestion']}
            />
            
            {/* Key Metrics for Selected Province */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title={translations.metrics.totalCalls}
                value={summaryData?.total_number?.toLocaleString() || '0'}
                subValue={`${summaryData?.unique_callers?.toLocaleString() || '0'} ${translations.metrics.uniqueCallers}`}
                icon={Phone}
                trend={5.2}
                color="blue"
              />
              <MetricCard
                title={translations.metrics.answeredCalls}
                value={summaryData?.number_answered?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.answer_rate, 1) || '0'}% ${translations.metrics.answerRate}`}
                icon={PhoneCall}
                trend={2.1}
                color="green"
              />
              <MetricCard
                title={translations.metrics.abandonedCalls}
                value={summaryData?.abandoned_calls?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.call_abandonment_rate, 1) || '0'}% ${translations.metrics.abandonmentRate}`}
                icon={PhoneOff}
                trend={-1.8}
                color="red"
              />
              <MetricCard
                title={translations.metrics.averageHandleTime}
                value={`${safeToFixed(summaryData?.average_handle_time_aht, 1) || '0'}ثانیه`}
                subValue={`${safeToFixed(summaryData?.average_wait_time, 1) || '0'}ثانیه ${translations.metrics.averageWaitTime}`}
                icon={Clock}
                trend={-0.5}
                color="yellow"
              />
            </div>

            {/* Additional Metrics for Selected Province */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title={translations.metrics.serviceLevel}
                value={`${safeToFixed(summaryData?.service_level, 1) || '0'}%`}
                subValue={translations.metrics.serviceLevelStandard}
                icon={Activity}
                trend={3.2}
                color="purple"
              />
              <MetricCard
                title={translations.metrics.firstCallResolution}
                value={`${safeToFixed(summaryData?.fcr_rate, 1) || '0'}%`}
                subValue={translations.metrics.qualityOfService}
                icon={UserCheck}
                trend={1.5}
                color="indigo"
              />
              <MetricCard
                title={translations.metrics.shortCalls}
                value={summaryData?.short_calls_less_than_5s?.toLocaleString() || '0'}
                subValue={`${safeToFixed(summaryData?.short_call_rate, 1) || '0'}% از کل`}
                icon={Timer}
                trend={-2.1}
                color="orange"
              />
              <MetricCard
                title={translations.metrics.busyCalls}
                value={summaryData?.number_busy?.toLocaleString() || '0'}
                subValue={translations.metrics.needsOptimization}
                icon={AlertCircle}
                trend={-1.2}
                color="gray"
              />
            </div>

            {/* Operators Table for Selected Province */}
            <OperatorsTable 
              summaryData={summaryData} 
              title={`${translations.operators.title} - ${selectedProvinceId === 'all' ? 'همه' : (provincesOptions.find(p => String(p.id) === selectedProvinceId)?.name || '')}`}
            />

            {/* Daily Trend for Selected Province */}
            {selectedProvinceId !== 'all' && dailyMetrics.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {translations.dailyTrend.title} ({startDate?.format('YYYY/MM/DD')} تا {endDate?.format('YYYY/MM/DD')})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.date}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.totalCalls}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.answered}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.abandoned}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.answerRate}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.aht}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.averageWait}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{translations.dailyTrend.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dailyMetrics.map((d, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800" dir="ltr">{d.report_date}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToLocaleString(d.total_number)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToLocaleString(d.number_answered)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToLocaleString(d.abandoned_calls)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToFixed(d.answer_rate, 1)}%</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToFixed(d.average_handle_time_aht, 1)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">{safeToFixed(d.average_wait_time, 1)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600" dir="ltr">
                            <button
                              onClick={() => openDailyRecordDetails(selectedProvinceId, d.report_date, d.report_date)}
                              className="cursor-pointer text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                              disabled={!d.record_id}
                              title={d.record_id ? `شناسه رکورد: ${d.record_id}` : 'شناسه رکورد موجود نیست'}
                            >
                              جزئیات {d.record_id ? `(${d.record_id})` : ''}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          {translations.dashboard.lastUpdate}: {new Date().toLocaleString('fa-IR')} | {translations.dashboard.autoRefresh} {refreshInterval / 1000} {translations.dashboard.seconds} | {translations.dashboard.province}: {selectedProvinceId === 'all' ? translations.dashboard.allProvinces : (provincesOptions.find(p => String(p.id) === selectedProvinceId)?.name || '')} | {translations.dashboard.dateRange}: {startDate?.format('YYYY/MM/DD')} {translations.dashboard.to} {endDate?.format('YYYY/MM/DD')}
        </div>
      </div>

      {/* Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        loading={detailsLoading}
        error={detailsError}
        data={detailsData}
        selectedDate={selectedDetailDate}
        onDateChange={handleDetailDateChange}
      />
      <BackToTopButton />
    </div>
  );
};

export default CallCenterDashboard;
