'use client';

/**
 * ShelfCard Component for ShelfScan AI
 * Displays individual shelf status with color-coded indicators and action buttons
 */

import React, { useState, useEffect } from 'react';
import { Shelf } from '../lib/types';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Clock,
  Package,
  MapPin
} from 'lucide-react';

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

interface ShelfCardProps {
  shelf: Shelf;
  onViewDetails?: (shelfId: string) => void;
  onMarkRestocked?: (shelfId: string, productName: string) => void;
  onRequestRescan?: (shelfId: string) => void;
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats timestamp to relative time (e.g., "2 hours ago")
 */
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const scanTime = new Date(timestamp);
  const diffInMs = now.getTime() - scanTime.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

/**
 * Gets the status configuration for styling and display
 */
const getStatusConfig = (status: Shelf['status']) => {
  const configs = {
    ok: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      badgeColor: 'bg-green-100 text-green-800',
      icon: CheckCircle,
      label: 'Good Stock'
    },
    low: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200', 
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
      label: 'Low Stock'
    },
    empty: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      badgeColor: 'bg-red-100 text-red-800',
      icon: AlertTriangle,
      label: 'Empty/Critical'
    }
  };
  
  return configs[status];
};

/**
 * Calculates shelf metrics for display
 */
const calculateMetrics = (shelf: Shelf) => {
  const totalItems = shelf.items.length;
  const emptyItems = shelf.items.filter(item => item.count === 0);
  const lowItems = shelf.items.filter(item => item.count > 0 && item.count < item.threshold);
  const okItems = shelf.items.filter(item => item.count >= item.threshold);
  
  return {
    totalItems,
    emptyCount: emptyItems.length,
    lowCount: lowItems.length,
    okCount: okItems.length,
    criticalItems: [...emptyItems, ...lowItems],
    hasIssues: emptyItems.length > 0 || lowItems.length > 0
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ShelfCard: React.FC<ShelfCardProps> = ({
  shelf,
  onViewDetails,
  onMarkRestocked,
  onRequestRescan,
  className = ''
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const statusConfig = getStatusConfig(shelf.status);
  const metrics = calculateMetrics(shelf);
  const StatusIcon = statusConfig.icon;
  // Get the most critical product for quick action
  const criticalProduct = metrics.criticalItems[0];
  // Only show counts and relative times after mount
  const showCounts = isMounted;
  return (
    <div 
      className={`
        rounded-lg border-2 transition-all duration-300 
        hover:shadow-lg hover:scale-[1.02] cursor-pointer touch-manipulation
        active:scale-[0.98] active:shadow-md
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        ${className}
        overflow-hidden min-w-0
        min-h-[420px] w-full
      `}
      role="article"
      aria-label={`Shelf ${shelf.id} status: ${statusConfig.label}`}
      onClick={() => onViewDetails?.(shelf.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewDetails?.(shelf.id);
        }
      }}
      tabIndex={0}
    >
      {/* HEADER SECTION */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-bold ${statusConfig.textColor}`}>
              Shelf {shelf.id}
            </h3>
            <StatusIcon 
              size={20} 
              className={statusConfig.iconColor}
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin size={14} aria-hidden="true" />
            <span>{shelf.aisle}</span>
          </div>
        </div>
        
        {/* STATUS BADGE */}
        <div className="flex items-center gap-2 mb-3">
          <span 
            className={`
              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
              ${statusConfig.badgeColor}
            `}
          >
            {statusConfig.label}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={12} aria-hidden="true" />
            <span>{showCounts ? formatTimeAgo(shelf.lastScanned) : ''}</span>
          </div>
        </div>
      </div>
      
      {/* METRICS SECTION */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1 text-sm">
            <Package size={14} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-foreground">
              {showCounts ? metrics.totalItems : ''} product{showCounts && metrics.totalItems !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* ISSUE INDICATORS */}
          {showCounts && metrics.emptyCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              <AlertTriangle size={12} aria-hidden="true" />
              {metrics.emptyCount} empty
            </span>
          )}
          {showCounts && metrics.lowCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              <AlertTriangle size={12} aria-hidden="true" />
              {metrics.lowCount} low
            </span>
          )}
        </div>
        
        {/* CRITICAL PRODUCT INFO */}
        {showCounts && criticalProduct && (
          <div className="mb-4 p-2 bg-card/50 rounded border border-border">
            <div className="text-xs text-muted-foreground mb-1">Most Critical:</div>
            <div className="text-sm font-medium text-foreground">
              {criticalProduct.product}
              <span className={`ml-2 text-xs ${
                criticalProduct.count === 0 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                ({criticalProduct.count === 0 ? 'Empty' : `${criticalProduct.count} left`})
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* TOUCH-OPTIMIZED ACTION BUTTONS SECTION */}
      <div className="px-4 pb-4">
        <div className="flex flex-row gap-3 mb-3">
          {showCounts && metrics.hasIssues && criticalProduct && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMarkRestocked?.(shelf.id, criticalProduct.product);
              }}
              className="flex-1 min-w-0 min-w-[120px] whitespace-nowrap text-xs sm:text-sm font-medium px-1.5 sm:px-3 py-3 min-h-[48px] bg-green-600 text-white rounded-lg border-2 border-green-600 hover:bg-green-700 hover:border-green-700 active:bg-green-800 active:scale-[0.98] transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 inline-flex items-center justify-center gap-2"
              aria-label={`Mark ${criticalProduct.product} as restocked on shelf ${shelf.id}`}
            >
              <CheckCircle size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Mark Restocked</span>
              <span className="sm:hidden">Restock</span>
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRequestRescan?.(shelf.id);
            }}
            className="flex-1 min-w-0 min-w-[120px] whitespace-nowrap text-xs sm:text-sm md:text-base font-medium px-2 sm:px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:bg-blue-800 active:scale-[0.98] transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center justify-center gap-2"
            aria-label={`Request rescan for shelf ${shelf.id}`}
          >
            <RefreshCw size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Rescan</span>
            <span className="sm:hidden">Scan</span>
          </button>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(shelf.id);
          }}
          className="w-full min-w-0 whitespace-nowrap text-xs sm:text-sm md:text-base font-medium px-2 sm:px-4 py-3 min-h-[48px] bg-card text-foreground rounded-lg border-2 border-border hover:bg-muted hover:border-border active:bg-muted active:scale-[0.98] transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 inline-flex items-center justify-center gap-2"
          aria-label={`View details for shelf ${shelf.id}`}
        >
          <Package size={16} aria-hidden="true" />
          <span>View Details</span>
        </button>
      </div>
    </div>
  );
};

export default ShelfCard; 