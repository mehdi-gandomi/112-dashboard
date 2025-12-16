import React from 'react';
import { X } from 'lucide-react';
import { CallTypeData } from '../types';

interface CallTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  callTypes: CallTypeData[];
}

const CallTypesModal: React.FC<CallTypesModalProps> = ({ isOpen, onClose, callTypes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">انواع تماس</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-auto p-4 flex-grow">
          <div className="grid grid-cols-1 gap-4">
            {callTypes.map((callType) => (
              <div 
                key={callType.type_call} 
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{callType.type_call_name}</span>
                  {/* <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">کد: {callType.type_call}</span> */}
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {callType.events_count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallTypesModal;