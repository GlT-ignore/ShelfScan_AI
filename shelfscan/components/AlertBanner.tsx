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
  AlertTriangle, 
  ExternalLink 
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
        bg-amber-950/30 border border-amber-700/40 rounded-xl p-6 backdrop-blur-sm transition-all duration-200
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-label={showCounts ? `${alertCount} active alerts` : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">Active Alerts</h2>
          {showCounts && (
            <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-medium border border-amber-500/30">
              {alertCount}
            </span>
          )}
        </div>
        
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-primary hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Alert List */}
      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <div 
            key={alert.id}
            className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <span 
                className={`px-2 py-1 rounded text-xs font-medium ${
                  alert.type === 'empty' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {alert.type === 'empty' ? 'EMPTY' : 'LOW STOCK'}
              </span>
              <div>
                <p className="font-medium text-foreground">{alert.product}</p>
                <p className="text-sm text-muted-foreground">
                  Shelf {alert.shelf} • {formatTimeAgo(alert.timestamp)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm rounded hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
            >
              Acknowledge
            </button>
          </div>
        ))}
      </div>
      
      {/* More Alerts Indicator */}
      {showCounts && remainingCount > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={onViewAll}
            className="text-primary hover:text-blue-300 text-sm font-medium transition-colors"
          >
            +{remainingCount} more alerts • View All Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertBanner; 