'use client';

import React from 'react';
import { useAlerts, useShelves } from '../lib/context/AppContext';
import { generateRandomScanUpdate, generateMockData } from '../lib/mockData';
import { Alert } from '../lib/types';
import { 
  RotateCcw, 
  Settings, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const DemoController: React.FC = () => {
  const { alerts, addAlert } = useAlerts();
  const { shelves } = useShelves();
  
  // Demo mode is always true for now (can be made configurable later)
  const isDemoMode = true;
  

  const handleTriggerAlert = () => {
    // Generate a random scan update and create an alert from it
    const scanUpdate = generateRandomScanUpdate(shelves);
    if (scanUpdate && scanUpdate.items.length > 0) {
      // Find a product that's low or empty
      const lowProduct = scanUpdate.items.find(item => item.count <= item.threshold);
      if (lowProduct) {
        const alertType: 'low' | 'empty' = lowProduct.count === 0 ? 'empty' : 'low';
        const newAlert: Alert = {
          id: `demo-alert-${Date.now()}`,
          type: alertType,
          shelf: scanUpdate.shelf,
          product: lowProduct.product,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        addAlert(newAlert);
      }
    }
  };

  const handleClearAlerts = () => {
    // Clear all alerts by acknowledging them
    alerts.forEach(alert => {
      if (!alert.acknowledged) {
        // You might want to add a clearAllAlerts action to the context
        // For now, we'll just acknowledge them individually
      }
    });
  };

  const handleResetData = () => {
    // Reset to fresh mock data
    const mockData = generateMockData();
    // This would require adding reset actions to the context
    // For now, just trigger a page refresh as a fallback
    window.location.reload();
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
