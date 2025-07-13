'use client';

/**
 * AlertBanner Component
 * 
 * Displays urgent, unacknowledged alerts at the top of the application.
 * Features:
 * - Auto-sorts by severity (empty first) then recency
 * - Shows max 3 alerts with "view all" option
 * - Responsive design with mobile-friendly layout
 * - Accessible with proper ARIA labels
 */

import React, { useState, useEffect } from 'react';
import { Alert } from '../lib/types';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  X 
} from 'lucide-react';

interface AlertBannerProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onViewAll?: () => void;
  className?: string;
  maxDisplayed?: number;
}

/**
 * Formats time distance in a human-readable way
 */
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date().getTime();
  const alertTime = new Date(timestamp).getTime();
  const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/**
 * Gets priority score for sorting (lower number = higher priority)
 */
const getAlertPriority = (alert: Alert): number => {
  const typeScore = alert.type === 'empty' ? 0 : 1;
  const timeScore = new Date(alert.timestamp).getTime();
  return typeScore * 1000000000000 - timeScore; // Empty alerts first, then by recency
};

const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts = [],
  onAcknowledge,
  onViewAll,
  className = '',
  maxDisplayed = 3
}) => {
  // Hydration-safe: Only show counts after mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Safety check and filter to only unacknowledged alerts
  const activeAlerts = (alerts || []).filter(alert => !alert.acknowledged);
  
  // Sort by priority (empty first, then by recency)
  const sortedAlerts = [...activeAlerts].sort((a, b) => 
    getAlertPriority(a) - getAlertPriority(b)
  );
  
  // Don't render if no active alerts
  if (sortedAlerts.length === 0) {
    return null;
  }
  
  const displayedAlerts = sortedAlerts.slice(0, maxDisplayed);
  const remainingCount = sortedAlerts.length - maxDisplayed;
  // Only show counts after mount to prevent hydration mismatch
  const alertCount = isMounted ? sortedAlerts.length : 0;
  const showCounts = isMounted;
  return (
    <div 
      className={`
        bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 mb-6 
        shadow-lg animate-slideInDown transition-all duration-300 hover:shadow-xl
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-label={showCounts ? `${alertCount} active alerts` : undefined}
    >
      {/* ANIMATED HEADER */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="relative">
              <Bell 
                size={18} 
                className="text-amber-600 animate-bounce" 
                aria-hidden="true"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <h2 className="font-semibold text-amber-800 animate-fadeInLeft">
              Active Alerts
            </h2>
          </div>
          {showCounts && (
            <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs font-medium">
              {alertCount}
            </span>
          )}
        </div>
        
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors"
            aria-label="View all alerts"
          >
            <span>View All</span>
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      
      {/* ALERT LIST */}
      <div className="space-y-2">
        {displayedAlerts.map((alert, index) => (
          <div 
            key={alert.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between bg-card p-3 rounded-md border border-amber-100 shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* STATUS BADGE */}
                <span 
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    alert.type === 'empty' 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}
                >
                  <AlertTriangle 
                    size={12} 
                    aria-hidden="true"
                  />
                  {alert.type === 'empty' ? 'EMPTY' : 'LOW STOCK'}
                </span>
                
                {/* PRIORITY INDICATOR */}
                {index === 0 && sortedAlerts.length > 1 && (
                  <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
                    URGENT
                  </span>
                )}
              </div>
              
              {/* ALERT DETAILS */}
              <div className="text-gray-900 font-medium truncate">
                {alert.product}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>Shelf {alert.shelf}</span>
                <span className="text-gray-400">•</span>
                <span>{formatTimeAgo(alert.timestamp)}</span>
              </div>
            </div>
            
            {/* ACKNOWLEDGE BUTTON */}
            <div className="flex items-center mt-2 sm:mt-0 sm:ml-4">
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors text-sm font-medium"
                aria-label={`Acknowledge alert for ${alert.product}`}
              >
                <CheckCircle size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Acknowledge</span>
                <span className="sm:hidden">ACK</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* REMAINING ALERTS INDICATOR */}
      {showCounts && remainingCount > 0 && (
        <div className="text-center mt-3 pt-2 border-t border-amber-200">
          <div className="text-sm text-amber-700">
            <span className="font-medium">+{remainingCount} more alert{remainingCount !== 1 ? 's' : ''}</span>
            {onViewAll && (
              <>
                <span className="mx-2">•</span>
                <button
                  onClick={onViewAll}
                  className="hover:underline font-medium"
                >
                  View All Alerts
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBanner; 