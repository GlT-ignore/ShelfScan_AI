'use client';

/**
 * Alerts Page
 * 
 * Comprehensive view of all inventory alerts with advanced filtering,
 * sorting, and management capabilities.
 */

import React, { useState, useMemo } from 'react';
import { AppProvider, useAlerts } from '../../lib/context/AppContext';
import { Alert } from '../../lib/types';
import { MobileNavigation } from '../../components/MobileNavigation';
import { 
  ArrowLeft,
  Filter, 
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Package,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

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
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter size={20} />
          Filter Alerts
        </h2>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium
                     text-gray-600 hover:text-gray-800 border-2 border-gray-300 rounded-lg 
                     hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] 
                     transition-all duration-200 touch-manipulation
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <RotateCcw size={16} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* SEARCH - Touch-optimized */}
        <div className="relative sm:col-span-2">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, shelves..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-4 py-3 min-h-[48px] border-2 border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium
                     touch-manipulation bg-white"
          />
        </div>
        
        {/* ALERT TYPE - Touch-optimized */}
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as 'all' | 'empty' | 'low' })}
          className="border-2 border-gray-300 rounded-lg px-4 py-3 min-h-[48px] text-sm font-medium
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation bg-white"
        >
          <option value="all">All Types</option>
          <option value="empty">🚨 Empty Shelves</option>
          <option value="low">⚠️ Low Stock</option>
        </select>
        
        {/* ACKNOWLEDGMENT STATUS - Touch-optimized */}
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as 'all' | 'acknowledged' | 'unacknowledged' })}
          className="border-2 border-gray-300 rounded-lg px-4 py-3 min-h-[48px] text-sm font-medium
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation bg-white"
        >
          <option value="all">All Status</option>
          <option value="unacknowledged">📢 Unacknowledged</option>
          <option value="acknowledged">✅ Acknowledged</option>
        </select>
        
        {/* DATE RANGE - Touch-optimized, spans both columns on small screens */}
        <div className="sm:col-span-2">
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value as 'all' | 'today' | 'week' | 'month' })}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 min-h-[48px] text-sm font-medium
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation bg-white"
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
// ALERT ROW COMPONENT
// ============================================================================

interface AlertRowProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onViewShelf: (shelfId: string) => void;
}

const AlertRow: React.FC<AlertRowProps> = ({ alert, onAcknowledge, onViewShelf }) => {
  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 ${alert.acknowledged ? 'opacity-60' : ''}`}>
      {/* STATUS */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span 
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              alert.type === 'empty' 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}
          >
            <AlertTriangle size={12} />
            {alert.type === 'empty' ? 'EMPTY' : 'LOW'}
          </span>
          
          {alert.acknowledged && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              <CheckCircle size={12} />
              ACK
            </span>
          )}
        </div>
      </td>
      
      {/* PRODUCT */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">{alert.product}</div>
            <div className="text-sm text-gray-500">
              Product Alert
            </div>
          </div>
        </div>
      </td>
      
      {/* LOCATION */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-gray-400" />
          <div>
            <div className="font-medium text-gray-900">Shelf {alert.shelf}</div>
            <button
              onClick={() => onViewShelf(alert.shelf)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Details
            </button>
          </div>
        </div>
      </td>
      
      {/* TIMESTAMP */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">{formatDateTime(alert.timestamp)}</div>
            <div className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</div>
          </div>
        </div>
      </td>
      
      {/* ACTIONS - Touch-optimized */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {!alert.acknowledged ? (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-green-50 text-green-700 
                       rounded-lg border-2 border-green-200 hover:bg-green-100 hover:border-green-300 
                       active:bg-green-200 active:scale-[0.98] transition-all duration-200 text-sm font-medium
                       touch-manipulation focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <CheckCircle size={16} />
              <span>Acknowledge</span>
            </button>
          ) : (
            <span className="text-sm text-gray-500">Acknowledged</span>
          )}
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// MAIN CONTENT COMPONENT
// ============================================================================

const AlertsPageContent: React.FC = () => {
  const { alerts, acknowledgeAlert } = useAlerts();
  
  const [filters, setFilters] = useState<{
    type: 'all' | 'empty' | 'low';
    status: 'all' | 'acknowledged' | 'unacknowledged';
    search: string;
    dateRange: 'all' | 'today' | 'week' | 'month';
  }>({
    type: 'all',
    status: 'all',
    search: '',
    dateRange: 'all'
  });

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Type filter
      if (filters.type !== 'all' && alert.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'acknowledged' && !alert.acknowledged) {
          return false;
        }
        if (filters.status === 'unacknowledged' && alert.acknowledged) {
          return false;
        }
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesProduct = alert.product.toLowerCase().includes(searchLower);
        const matchesShelf = alert.shelf.toLowerCase().includes(searchLower);
        if (!matchesProduct && !matchesShelf) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange !== 'all') {
        const alertDate = new Date(alert.timestamp);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (alertDate < today) return false;
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
    });
  }, [alerts, filters]);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      search: '',
      dateRange: 'all'
    });
  };

  const handleViewShelf = (shelfId: string) => {
    // Navigate to shelf details or open modal
    console.log('View shelf:', shelfId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Inventory Alerts</h1>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FILTERS */}
        <FilterControls 
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* ALERTS TABLE */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Alerts ({filteredAlerts.length})
            </h2>
          </div>
          
          {filteredAlerts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
                <p className="text-gray-500">
                  {filters.type !== 'all' || filters.status !== 'all' || filters.search || filters.dateRange !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'All inventory levels are within normal ranges.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      onAcknowledge={handleAcknowledge}
                      onViewShelf={handleViewShelf}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <MobileNavigation />
    </div>
  );
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function AlertsPage() {
  return (
    <AppProvider>
      <AlertsPageContent />
    </AppProvider>
  );
} 