'use client';

/**
 * ShelfCard Component for ShelfScan AI
 * Displays individual shelf status with color-coded indicators and action buttons
 */

import React from 'react';
import { Shelf } from '../lib/types';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Package
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
  switch (status) {
    case 'empty':
      return {
        label: 'Empty/Critical',
        bgColor: 'bg-red-950/50 border-red-800/50 dark:bg-red-950/30 dark:border-red-700/40',
        icon: AlertTriangle,
        iconColor: 'text-red-400',
        textColor: 'text-red-400'
      };
    case 'low':
      return {
        label: 'Low Stock',
        bgColor: 'bg-amber-950/50 border-amber-800/50 dark:bg-amber-950/30 dark:border-amber-700/40',
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        textColor: 'text-amber-400'
      };
    case 'ok':
      return {
        label: 'Good Stock',
        bgColor: 'bg-emerald-950/50 border-emerald-800/50 dark:bg-emerald-950/30 dark:border-emerald-700/40',
        icon: CheckCircle,
        iconColor: 'text-emerald-400',
        textColor: 'text-emerald-400'
      };
    default:
      return {
        label: 'Unknown',
        bgColor: 'bg-slate-950/50 border-slate-800/50 dark:bg-slate-950/30 dark:border-slate-700/40',
        icon: Package,
        iconColor: 'text-slate-400',
        textColor: 'text-slate-400'
      };
  }
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
// MAIN COMPONENT - Updated with MagicPath styling
// ============================================================================

const ShelfCard: React.FC<ShelfCardProps> = ({
  shelf,
  onViewDetails,
  onMarkRestocked,
  onRequestRescan,
  className = ''
}) => {

  
  const statusConfig = getStatusConfig(shelf.status);
  const metrics = calculateMetrics(shelf);
  const StatusIcon = statusConfig.icon;
  const criticalProduct = metrics.criticalItems[0];

  return (
    <div 
      className={`
        rounded-xl border backdrop-blur-sm transition-all duration-200 hover:bg-card/70 cursor-pointer
        ${statusConfig.bgColor} ${className}
      `}
      role="article"
      aria-label={`Shelf ${shelf.id} status: ${statusConfig.label}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Shelf {shelf.id}</h3>
            <StatusIcon className={`w-4 h-4 ${statusConfig.iconColor}`} />
          </div>
          <span className="text-xs text-muted-foreground">{shelf.aisle}</span>
        </div>
        
        {/* Status and Info */}
        <div className="space-y-1 mb-3">
          <p className="text-sm text-foreground">{statusConfig.label}</p>
          <p className="text-xs text-muted-foreground">{formatTimeAgo(shelf.lastScanned)}</p>
          <p className="text-xs text-muted-foreground">{shelf.items.length} products</p>
          {shelf.status !== 'ok' && metrics.criticalItems.length > 0 && (
            <p className="text-xs text-muted-foreground">{metrics.criticalItems.length} critical</p>
          )}
          {criticalProduct && (
            <div className="mt-2">
              <p className="text-xs font-medium text-foreground">Most Critical:</p>
              <p className="text-xs text-muted-foreground">
                                 {criticalProduct.product}{' '}
                <span className={statusConfig.textColor}>
                  ({shelf.status === 'empty' ? 'Empty' : 'Low'})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {shelf.status === 'ok' ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRequestRescan?.(shelf.id);
              }}
              className="w-full px-3 py-2 bg-gradient-to-r from-primary to-blue-500 text-white text-sm rounded hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
            >
              <RefreshCw className="w-4 h-4" />
              Rescan
            </button>
          ) : (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (criticalProduct) {
                                         onMarkRestocked?.(shelf.id, criticalProduct.product);
                  }
                }}
                className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm rounded hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                Mark Restocked
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestRescan?.(shelf.id);
                }}
                className="w-full px-3 py-2 bg-gradient-to-r from-primary to-blue-500 text-white text-sm rounded hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                <RefreshCw className="w-4 h-4" />
                Rescan
              </button>
            </>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(shelf.id);
            }}
            className="w-full px-3 py-2 border border-border/50 text-muted-foreground text-sm rounded hover:bg-card/50 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShelfCard; 