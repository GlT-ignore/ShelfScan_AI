'use client';

/**
 * Alerts Page
 * 
 * Comprehensive view of all inventory alerts with advanced filtering,
 * sorting, and management capabilities.
 */

import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft,
  Filter, 
  Search,
  AlertTriangle, 
  Package, 
  CheckCircle,
  MapPin,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { AppProvider, useAlerts } from '../../lib/context/AppContext';
import { Alert } from '../../lib/types';
import { MobileNavigation, DesktopNavigation } from '../../components/MobileNavigation';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusColor = (type: string, acknowledged: boolean) => {
  if (acknowledged) return 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50';
  if (type === 'empty') return 'bg-red-950/50 text-red-400 border-red-800/50';
  return 'bg-amber-950/50 text-amber-400 border-amber-800/50';
};

const formatTimeAgo = (timestamp: string) => {
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

// ============================================================================
// FILTER CONTROLS COMPONENT
// ============================================================================

interface FilterControlsProps {
  filters: {
    type: 'all' | 'empty' | 'low';
    status: 'all' | 'acknowledged' | 'unacknowledged';
    search: string;
    dateRange: 'all' | 'today' | 'week' | 'month';
  };
  onFiltersChange: (filters: {
    type: 'all' | 'empty' | 'low';
    status: 'all' | 'acknowledged' | 'unacknowledged';
    search: string;
    dateRange: 'all' | 'today' | 'week' | 'month';
  }) => void;
  onClearFilters: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const hasActiveFilters = filters.type !== 'all' || 
                          filters.status !== 'all' || 
                          filters.search !== '' || 
                          filters.dateRange !== 'all';

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-3">
          <Filter size={20} className="text-blue-400" />
          Filter Alerts
        </h2>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-600 
                     text-slate-100 rounded-lg hover:from-slate-600 hover:to-slate-500 active:scale-95 
                     transition-all duration-200 shadow-lg shadow-slate-900/25 border border-slate-600/50"
          >
            <RotateCcw size={16} />
            <span className="font-medium">Clear Filters</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SEARCH */}
        <div className="relative sm:col-span-2">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, shelves..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg 
                     focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-slate-100 
                     placeholder-slate-400 transition-all duration-200"
          />
        </div>
        
        {/* ALERT TYPE */}
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as 'all' | 'empty' | 'low' })}
          className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-100
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
        >
          <option value="all">All Types</option>
          <option value="empty">🚨 Empty Shelves</option>
          <option value="low">⚠️ Low Stock</option>
        </select>
        
        {/* ACKNOWLEDGMENT STATUS */}
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as 'all' | 'acknowledged' | 'unacknowledged' })}
          className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-100
                   focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
        >
          <option value="all">All Status</option>
          <option value="unacknowledged">📢 Unacknowledged</option>
          <option value="acknowledged">✅ Acknowledged</option>
        </select>
        
        {/* DATE RANGE */}
        <div className="sm:col-span-2">
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value as 'all' | 'today' | 'week' | 'month' })}
            className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-4 py-3 text-slate-100
                     focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ALERT CARD COMPONENT
// ============================================================================

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onViewShelf: (shelfId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onViewShelf }) => {
  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-6 
                   hover:bg-slate-800/50 transition-all duration-300 ${alert.acknowledged ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border
                          ${getStatusColor(alert.type, alert.acknowledged)}`}>
            <AlertTriangle size={14} />
            {alert.type === 'empty' ? 'EMPTY' : 'LOW STOCK'}
          </span>
          
          {alert.acknowledged && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/30 text-emerald-400 
                           border border-emerald-800/50 rounded-full text-sm font-medium">
              <CheckCircle size={14} />
              ACKNOWLEDGED
            </span>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-sm text-slate-300">{formatDateTime(alert.timestamp)}</div>
          <div className="text-xs text-slate-400">{formatTimeAgo(alert.timestamp)}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Package size={20} className="text-blue-400" />
          <div>
            <div className="text-slate-300 text-sm">Product</div>
            <div className="font-medium text-slate-100">{alert.product}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-blue-400" />
          <div>
            <div className="text-slate-300 text-sm">Location</div>
            <div className="font-medium text-slate-100">Shelf {alert.shelf}</div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {!alert.acknowledged ? (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 
                     text-white rounded-lg hover:from-emerald-500 hover:to-emerald-400 active:scale-95 
                     transition-all duration-200 shadow-lg shadow-emerald-500/25 font-medium"
          >
            <CheckCircle size={16} />
            Acknowledge Alert
          </button>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 px-4 py-2">
            <CheckCircle size={16} />
            <span>Alert Acknowledged</span>
          </div>
        )}
        
        <button
          onClick={() => onViewShelf(alert.shelf)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 
                   text-white rounded-lg hover:from-blue-500 hover:to-blue-400 active:scale-95 
                   transition-all duration-200 shadow-lg shadow-blue-500/25 font-medium"
        >
          <MapPin size={16} />
          View Shelf Details
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN ALERTS PAGE COMPONENT
// ============================================================================

const AlertsPageContent: React.FC = () => {
  const { alerts, acknowledgeAlert } = useAlerts();
  
  // Filter state
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'empty' | 'low',
    status: 'all' as 'all' | 'acknowledged' | 'unacknowledged',
    search: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month'
  });
  
  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Type filter
      if (filters.type !== 'all' && alert.type !== filters.type) return false;
      
      // Status filter
      if (filters.status === 'acknowledged' && !alert.acknowledged) return false;
      if (filters.status === 'unacknowledged' && alert.acknowledged) return false;
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!alert.product.toLowerCase().includes(searchLower) && 
            !alert.shelf.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Date filter
      if (filters.dateRange !== 'all') {
        const alertDate = new Date(alert.timestamp);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            if (alertDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (alertDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (alertDate < monthAgo) return false;
            break;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by acknowledgment (unacknowledged first), then by type (empty first), then by recency
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      if (a.type !== b.type) {
        return a.type === 'empty' ? -1 : 1;
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts, filters]);
  
  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      search: '',
      dateRange: 'all'
    });
  };
  
  const handleViewShelf = (shelfId: string) => {
    // TODO: Navigate to shelf details or open modal
    console.log('View shelf:', shelfId);
  };
  
  // Stats
  const stats = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    empty: alerts.filter(a => a.type === 'empty').length,
    low: alerts.filter(a => a.type === 'low').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* HEADER */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* MOBILE NAVIGATION */}
              <MobileNavigation />
              
              {/* BACK BUTTON FOR DESKTOP */}
              <Link 
                href="/"
                className="hidden md:flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </Link>
              
              <div className="hidden sm:block w-px h-6 bg-slate-600" />
              
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 truncate">Inventory Alerts</h1>
                <div className="text-sm text-slate-400">
                  {filteredAlerts.length} of {stats.total} alerts
                </div>
              </div>
            </div>
            
            {/* RIGHT SIDE */}
            <div className="flex items-center gap-6">
              {/* DESKTOP NAVIGATION */}
              <div className="hidden md:block">
                <DesktopNavigation />
              </div>
              
              {/* QUICK STATS */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">{stats.empty}</div>
                  <div className="text-xs text-slate-400">Empty</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{stats.low}</div>
                  <div className="text-xs text-slate-400">Low Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-400">{stats.unacknowledged}</div>
                  <div className="text-xs text-slate-400">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterControls
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />
        
        {/* ALERTS GRID */}
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm rounded-xl p-12 text-center">
            <AlertTriangle size={64} className="mx-auto text-slate-600 mb-6" />
            <h3 className="text-xl font-semibold text-slate-100 mb-3">No alerts found</h3>
            <p className="text-slate-400 mb-6">
              {filters.type !== 'all' || filters.status !== 'all' || filters.search || filters.dateRange !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'All shelves are properly stocked!'}
            </p>
            {(filters.type !== 'all' || filters.status !== 'all' || filters.search || filters.dateRange !== 'all') && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg 
                         hover:from-blue-500 hover:to-blue-400 active:scale-95 transition-all duration-200 
                         shadow-lg shadow-blue-500/25 font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledgeAlert}
                onViewShelf={handleViewShelf}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE WRAPPER WITH PROVIDER
// ============================================================================

export default function AlertsPage() {
  return (
    <AppProvider>
      <AlertsPageContent />
    </AppProvider>
  );
} 