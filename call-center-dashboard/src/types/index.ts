export interface CallTypeData {
  type_call: number;
  type_call_name: string;
  events_count: number;
}

export interface ProvinceData {
  province_name?: string;
  province_id?: string;
  total_number?: number;
  number_answered?: number;
  number_answered_operator?: number;
  events_count?: number;
  number_unanswerd?: number;
  number_failed?: number;
  number_busy?: number;
  congestion?: number;
  duration?: number;
  duration_answered?: number;
  rightel?: number; 
  irancell?: number; 
  fixed?: number; 
  unknown?: number; 
  other?: number; 
  taliya?: number; 
  espadan?: number; 
  mci?: number;
  unique_callers?: number; 
  answered_calls?: number; 
  abandoned_calls?: number; 
  short_answered_calls_5s?: number; 
  anonymous_calls?: number;
  queue_calls?: number; 
  short_calls_less_than_5s?: number; 
  call_completion_rate?: number; 
  call_abandonment_rate?: number; 
  answer_rate?: number;
  short_call_rate?: number; 
  service_level?: number; 
  fcr_rate?: number; 
  average_handle_time_aht?: number; 
  average_wait_time?: number;
  queue_wait_time?: number; 
  total_talk_time?: number; 
  total_wait_time?: number; 
  max_wait_time?: number;
  transfer_time?: string;
  transfer_date?: string;
  call_types?: CallTypeData[];
}

export interface ProvinceOption {
  id: number;
  name: string;
}

export interface DailyMetrics {
  record_id?: number;
  report_date: string;
  total_number?: number;
  number_answered?: number;
  abandoned_calls?: number;
  answer_rate?: number;
  average_handle_time_aht?: number;
  average_wait_time?: number;
}

export interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: any;
  trend?: number;
  color?: string;
}

export interface ProvinceCardProps {
  provinceData: ProvinceData;
  isFirst?: boolean;
  provinceId?: string | null;
  onOpenDetails?: (provinceId: string, startDate: string, endDate: string) => void;
  startDate?: any;
  endDate?: any;
  callTypes?: CallTypeData[];
  onShowCallTypes?: () => void;
}

export interface OperatorsTableProps {
  summaryData: any;
  title?: string;
}

export interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  data: any;
  selectedDate: any;
  onDateChange: (date: any) => void;
}
