/**
 * Alert Utilities
 * 
 * Centralized logic for alert prioritization, sorting, and filtering.
 * Ensures consistent behavior across all alert displays.
 */

import { Alert } from './types';

// ============================================================================
// PRIORITY & SEVERITY SCORING
// ============================================================================

/**
 * Get numeric priority score for an alert (lower = higher priority)
 */
export const getAlertPriority = (alert: Alert): number => {
  // Base severity score
  let score = alert.type === 'empty' ? 0 : 100;
  
  // Add time component (newer alerts have higher priority)
  const ageInMinutes = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60);
  score += ageInMinutes * 0.1; // Small time penalty
  
  // Acknowledged alerts have lower priority
  if (alert.acknowledged) {
    score += 10000; // Move to bottom
  }
  
  return score;
};

/**
 * Get severity level for an alert
 */
export const getAlertSeverity = (alert: Alert): 'critical' | 'high' | 'medium' | 'low' => {
  if (alert.type === 'empty') {
    return 'critical';
  }
  
  if (alert.type === 'low') {
    const ageInHours = (Date.now() - new Date(alert.timestamp).getTime()) / (1000 * 60 * 60);
    if (ageInHours > 24) return 'high';
    if (ageInHours > 4) return 'medium';
    return 'low';
  }
  
  return 'low';
};

/**
 * Check if an alert is urgent (requires immediate attention)
 */
export const isUrgentAlert = (alert: Alert): boolean => {
  if (alert.acknowledged) return false;
  
  return alert.type === 'empty' || getAlertSeverity(alert) === 'high';
};

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

/**
 * Sort alerts by priority (most urgent first)
 */
export const sortAlertsByPriority = (alerts: Alert[]): Alert[] => {
  return [...alerts].sort((a, b) => getAlertPriority(a) - getAlertPriority(b));
};

/**
 * Sort alerts by timestamp (newest first)
 */
export const sortAlertsByTime = (alerts: Alert[]): Alert[] => {
  return [...alerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

/**
 * Sort alerts by location (shelf ID)
 */
export const sortAlertsByLocation = (alerts: Alert[]): Alert[] => {
  return [...alerts].sort((a, b) => a.shelf.localeCompare(b.shelf));
};

/**
 * Sort alerts by product name
 */
export const sortAlertsByProduct = (alerts: Alert[]): Alert[] => {
  return [...alerts].sort((a, b) => a.product.localeCompare(b.product));
};

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter alerts by type
 */
export const filterAlertsByType = (
  alerts: Alert[], 
  types: Array<'empty' | 'low'> | 'all'
): Alert[] => {
  if (types === 'all') return alerts;
  return alerts.filter(alert => types.includes(alert.type));
};

/**
 * Filter alerts by acknowledgment status
 */
export const filterAlertsByStatus = (
  alerts: Alert[], 
  status: 'acknowledged' | 'unacknowledged' | 'all'
): Alert[] => {
  if (status === 'all') return alerts;
  if (status === 'acknowledged') return alerts.filter(alert => alert.acknowledged);
  return alerts.filter(alert => !alert.acknowledged);
};

/**
 * Filter alerts by date range
 */
export const filterAlertsByDateRange = (
  alerts: Alert[], 
  range: 'today' | 'week' | 'month' | 'all'
): Alert[] => {
  if (range === 'all') return alerts;
  
  const now = new Date();
  let cutoffDate: Date;
  
  switch (range) {
    case 'today':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return alerts;
  }
  
  return alerts.filter(alert => new Date(alert.timestamp) >= cutoffDate);
};

/**
 * Filter alerts by search term (product name or shelf)
 */
export const filterAlertsBySearch = (alerts: Alert[], searchTerm: string): Alert[] => {
  if (!searchTerm.trim()) return alerts;
  
  const search = searchTerm.toLowerCase();
  return alerts.filter(alert => 
    alert.product.toLowerCase().includes(search) ||
    alert.shelf.toLowerCase().includes(search)
  );
};

/**
 * Filter alerts by severity level
 */
export const filterAlertsBySeverity = (
  alerts: Alert[], 
  severities: Array<'critical' | 'high' | 'medium' | 'low'> | 'all'
): Alert[] => {
  if (severities === 'all') return alerts;
  return alerts.filter(alert => severities.includes(getAlertSeverity(alert)));
};

// ============================================================================
// COMBINED FILTERING & SORTING
// ============================================================================

export interface AlertFilterOptions {
  type?: 'all' | 'empty' | 'low';
  status?: 'all' | 'acknowledged' | 'unacknowledged';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  search?: string;
  severity?: 'all' | Array<'critical' | 'high' | 'medium' | 'low'>;
  sortBy?: 'priority' | 'time' | 'location' | 'product';
}

/**
 * Apply comprehensive filtering and sorting to alerts
 */
export const processAlerts = (alerts: Alert[], options: AlertFilterOptions = {}): Alert[] => {
  let result = [...alerts];
  
  // Apply filters
  if (options.type && options.type !== 'all') {
    result = filterAlertsByType(result, [options.type]);
  }
  
  if (options.status && options.status !== 'all') {
    result = filterAlertsByStatus(result, options.status);
  }
  
  if (options.dateRange && options.dateRange !== 'all') {
    result = filterAlertsByDateRange(result, options.dateRange);
  }
  
  if (options.search) {
    result = filterAlertsBySearch(result, options.search);
  }
  
  if (options.severity && options.severity !== 'all') {
    result = filterAlertsBySeverity(result, options.severity);
  }
  
  // Apply sorting
  switch (options.sortBy) {
    case 'time':
      result = sortAlertsByTime(result);
      break;
    case 'location':
      result = sortAlertsByLocation(result);
      break;
    case 'product':
      result = sortAlertsByProduct(result);
      break;
    case 'priority':
    default:
      result = sortAlertsByPriority(result);
      break;
  }
  
  return result;
};

// ============================================================================
// ALERT STATISTICS
// ============================================================================

/**
 * Get comprehensive alert statistics
 */
export const getAlertStats = (alerts: Alert[]) => {
  const total = alerts.length;
  const unacknowledged = alerts.filter(a => !a.acknowledged).length;
  const acknowledged = total - unacknowledged;
  
  const byType = {
    empty: alerts.filter(a => a.type === 'empty').length,
    low: alerts.filter(a => a.type === 'low').length
  };
  
  const bySeverity = {
    critical: alerts.filter(a => getAlertSeverity(a) === 'critical').length,
    high: alerts.filter(a => getAlertSeverity(a) === 'high').length,
    medium: alerts.filter(a => getAlertSeverity(a) === 'medium').length,
    low: alerts.filter(a => getAlertSeverity(a) === 'low').length
  };
  
  const urgent = alerts.filter(isUrgentAlert).length;
  
  return {
    total,
    unacknowledged,
    acknowledged,
    urgent,
    byType,
    bySeverity
  };
};

// ============================================================================
// TIME FORMATTING UTILITIES
// ============================================================================

/**
 * Format timestamp as relative time
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const alertTime = new Date(timestamp).getTime();
  const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
};

/**
 * Format timestamp as absolute date/time
 */
export const formatAbsoluteTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 