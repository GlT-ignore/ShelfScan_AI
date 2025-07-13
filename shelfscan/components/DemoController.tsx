'use client';

import React, { useState } from 'react';
import { useAppContext } from '../lib/context/AppContext';
import { 
  RotateCcw, 
  Settings, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const DemoController: React.FC = () => {
  const { 
    triggerDemoAlert, 
    clearAllAlerts, 
    resetDemoData,
    isDemoMode 
  } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerAlert = () => {
    triggerDemoAlert();
  };

  const handleClearAlerts = () => {
    clearAllAlerts();
  };

  const handleResetData = () => {
    resetDemoData();
  };

  if (!isDemoMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-900">Demo Controls</span>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleTriggerAlert}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 
                     rounded border border-blue-200 hover:bg-blue-100 text-sm font-medium"
          >
            <AlertTriangle size={14} />
            Trigger Alert
          </button>
          
          <button
            onClick={handleClearAlerts}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 
                     rounded border border-green-200 hover:bg-green-100 text-sm font-medium"
          >
            <CheckCircle size={14} />
            Clear Alerts
          </button>
          
          <button
            onClick={handleResetData}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 
                     rounded border border-gray-200 hover:bg-gray-100 text-sm font-medium"
          >
            <RotateCcw size={14} />
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoController;
