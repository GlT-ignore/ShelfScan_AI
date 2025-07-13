'use client';

import React from 'react';
import { Alert } from '../lib/types';
import { AlertTriangle, Bell } from 'lucide-react';
import Link from 'next/link';

interface AlertBannerProps {
  alerts: Alert[];
  onViewAlerts: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onViewAlerts }) => {
  if (alerts.length === 0) return null;

  const urgentAlerts = alerts.filter(alert => !alert.acknowledged);
  const emptyAlerts = urgentAlerts.filter(alert => alert.type === 'empty');
  const lowStockAlerts = urgentAlerts.filter(alert => alert.type === 'low');

  return (
    <div className="bg-gradient-to-r from-red-50 to-amber-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Inventory Alerts Active
            </h3>
            <p className="text-sm text-red-700">
              {emptyAlerts.length > 0 && `${emptyAlerts.length} empty shelf${emptyAlerts.length > 1 ? 's' : ''}`}
              {emptyAlerts.length > 0 && lowStockAlerts.length > 0 && ', '}
              {lowStockAlerts.length > 0 && `${lowStockAlerts.length} low stock alert${lowStockAlerts.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        
        <button
          onClick={onViewAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 
                   transition-colors text-sm font-medium"
        >
          <Bell size={16} />
          View Alerts
        </button>
      </div>
    </div>
  );
};

export default AlertBanner; 