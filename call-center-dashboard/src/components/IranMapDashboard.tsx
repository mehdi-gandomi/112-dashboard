import React, { useState } from 'react';
import type { ProvinceData, ProvinceOption } from '../types';
import province from "../data/province.json";
import MapSea from "./mapSea";
// Metric keys to show
type MetricKey = 'number_answered' | 'number_unanswerd' | 'congestion' | 'number_busy' | 'number_failed';


const metricConfig: Record<MetricKey, { labelFa: string; tooltip: string }> = {
  number_answered: { labelFa: 'پاسخ‌داده', tooltip: 'تعداد تماس‌های پاسخ داده شده' },
  number_unanswerd: { labelFa: 'بدون پاسخ', tooltip: 'تعداد تماس‌های بدون پاسخ' },
  congestion: { labelFa: 'ازدحام', tooltip: 'تعداد تماس‌های متاثر از ازدحام' },
  number_busy: { labelFa: 'اشغال', tooltip: 'تعداد تماس‌های اشغال' },
  number_failed: { labelFa: 'ناموفق', tooltip: 'تعداد تماس‌های ناموفق' },
};

interface IranMapDashboardProps {
  provincesData: ProvinceData[];
  provincesOptions: ProvinceOption[];
  width?: number;
  onSelectProvinceById?: (provinceId: string) => void;
}


const IranMapDashboard: React.FC<IranMapDashboardProps> = ({ provincesData, provincesOptions, width = 700, onSelectProvinceById }) => {
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    x: number;
    y: number;
    provinceData: ProvinceData | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    provinceData: null
  });

  const selectProvinceHandler = (id: number) => {
    if (id && onSelectProvinceById) onSelectProvinceById(String(id));
  };

  const handleMouseEnter = (event: React.MouseEvent, provinceId: number) => {
    const provinceData = provincesData.find(p => Number(p.province_id) === provinceId);
    if (provinceData) {
      setTooltipData({
        show: true,
        x: event.clientX,
        y: event.clientY,
        provinceData
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  return (
    <div className=" p-4">
      <div className="iran-map-container" >
        <svg
          height="100%"
          className=""
          version="1.1"
          width="auto"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 700 600"
          preserveAspectRatio="xMinYMin"
        >
          {province.map((provinceItem, index) => (

            <g key={index} className="province-item">
              <path
                id={provinceItem.province}
                stroke="#9d9d9d"
                d={provinceItem.d}
                style={{
                  overflow: "hidden",
                  position: "relative",
                  left: "-0.6px",
                  cursor: "pointer",
                }}
                onClick={() => selectProvinceHandler(provinceItem.id)}
                onMouseEnter={(e) => handleMouseEnter(e, provinceItem.id)}
                onMouseLeave={handleMouseLeave}
              />
              <text key={index}
                x={provinceItem.labelX || 10}
                y={provinceItem.labelY || 20}
                fontSize={`${provinceItem.province === 'چهارمحال و بختیاری' || provinceItem.province === 'کهگیلویه' ? '8' : '10'}`} pointerEvents="none" style={{ userSelect: 'none', zIndex: '10' }} transform={provinceItem.transform ? provinceItem.transform : ''} >
                {provinceItem.province}
              </text>
            </g>


          ))}
          <MapSea />
        </svg>
      </div>
      
      {/* Tooltip */}
      {tooltipData.show && tooltipData.provinceData && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs p-3 rounded shadow-lg pointer-events-none"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <h5 className="font-bold mb-2 text-sm border-b border-gray-600 pb-1">
            {tooltipData.provinceData.province_name}
          </h5>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{metricConfig.number_answered.labelFa}:</span>
              <span className="font-medium" dir="ltr">
                {tooltipData.provinceData.number_answered?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{metricConfig.number_unanswerd.labelFa}:</span>
              <span className="font-medium" dir="ltr">
                {tooltipData.provinceData.number_unanswerd?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{metricConfig.number_busy.labelFa}:</span>
              <span className="font-medium" dir="ltr">
                {tooltipData.provinceData.number_busy?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{metricConfig.number_failed.labelFa}:</span>
              <span className="font-medium" dir="ltr">
                {tooltipData.provinceData.number_failed?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{metricConfig.congestion.labelFa}:</span>
              <span className="font-medium" dir="ltr">
                {tooltipData.provinceData.congestion?.toLocaleString() || '0'}
              </span>
            </div>
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="flex justify-between font-bold">
                <span>کل تماس‌ها:</span>
                <span dir="ltr">
                  {tooltipData.provinceData.total_number?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IranMapDashboard;
