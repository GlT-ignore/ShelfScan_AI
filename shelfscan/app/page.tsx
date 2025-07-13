'use client';

/**
 * ShelfScan AI Dashboard - Main Page
 * Displays real-time inventory status across all store shelves
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useShelves, useAlerts, useStaffActions } from '../lib/context/AppContext';
import { useRealTimeUpdates } from '../lib/hooks/useRealTimeUpdates';
import ShelfCard from '../components/ShelfCard';
import AlertBanner from '../components/AlertBanner';
import ShelfDetailModal from '../components/ShelfDetailModal';
import DemoController from '../components/DemoController';
import ErrorBoundary from '../components/ErrorBoundary';
import { MobileNavigation, DesktopNavigation } from '../components/MobileNavigation';
import { 
  Filter, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import { Shelf } from '../lib/types';
import { useRouter } from 'next/navigation';

// ============================================================================
// REAL-TIME STATUS INDICATOR COMPONENT
// ============================================================================

const RealTimeStatus: React.FC<{ 
  connectionStatus: 'connected' | 'polling' | 'disconnected';
  isConnected: boolean;
}> = ({ connectionStatus, isConnected }) => {
  const [recentUpdate, setRecentUpdate] = useState(false);

  // Show pulse effect for recent updates
  useEffect(() => {
    if (recentUpdate) {
      const timer = setTimeout(() => setRecentUpdate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [recentUpdate]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <Wifi size={16} className="text-green-600" />,
          text: 'Live',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Real-time updates active'
        };
      case 'polling':
        return {
          icon: <Activity size={16} className="text-amber-600" />,
          text: 'Polling',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          description: 'Polling for updates'
        };
      case 'disconnected':
        return {
          icon: <WifiOff size={16} className="text-red-600" />,
          text: 'Offline',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Connection lost'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 rounded-full ${config.bgColor} ${recentUpdate ? 'animate-pulse' : ''}`}
      title={config.description}
    >
      <div className={`${recentUpdate ? 'animate-ping' : ''}`}>
        {config.icon}
      </div>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

// ============================================================================
// DASHBOARD HEADER COMPONENT
// ============================================================================

const DashboardHeader: React.FC<{ 
  connectionStatus: 'connected' | 'polling' | 'disconnected';
  isConnected: boolean;
}> = ({ connectionStatus, isConnected }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { alerts } = useAlerts();
  
  // Track mount state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only calculate alerts after mount to prevent hydration mismatch
  const urgentAlerts = isMounted ? alerts.filter(alert => !alert.acknowledged) : [];
  const emptyAlerts = isMounted ? urgentAlerts.filter(alert => alert.type === 'empty') : [];
  const lowStockAlerts = isMounted ? urgentAlerts.filter(alert => alert.type === 'low') : [];
  
  return (
    <header className="bg-card border-b border-border shadow-sm transition-all duration-300 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* LEFT SIDE - LOGO & STATUS */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* MOBILE NAVIGATION */}
            <MobileNavigation />
            
            {/* APP TITLE */}
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                ShelfScan AI
              </h1>
              <div className="hidden sm:block">
                <RealTimeStatus 
                  connectionStatus={connectionStatus}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>
          
          {/* RIGHT SIDE - NAVIGATION & STATUS */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* MOBILE REAL-TIME STATUS */}
            <div className="block sm:hidden">
              <RealTimeStatus 
                connectionStatus={connectionStatus}
                isConnected={isConnected}
              />
            </div>
            
            {/* DESKTOP NAVIGATION */}
            <DesktopNavigation />
            
            {/* QUICK STATS FOR LARGE SCREENS - Only show after mount */}
            {isMounted && (
              <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
                {emptyAlerts.length > 0 && (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right duration-300">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span>{emptyAlerts.length} Empty</span>
                  </div>
                )}
                {lowStockAlerts.length > 0 && (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right duration-300">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    <span>{lowStockAlerts.length} Low</span>
                  </div>
                )}
                <div className="transition-all duration-300">
                  Last update: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// FILTER CONTROLS COMPONENT
// ============================================================================

interface FilterControlsProps {
  filter: 'all' | 'ok' | 'low' | 'empty';
  onFilterChange: (filter: 'all' | 'ok' | 'low' | 'empty') => void;
  sortBy: 'aisle' | 'status' | 'lastScanned';
  onSortChange: (sort: 'aisle' | 'status' | 'lastScanned') => void;
  totalShelves: number;
  filteredCount: number;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  totalShelves,
  filteredCount
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter size={20} />
            Inventory Overview
          </h2>
          
          <div className="text-sm text-gray-500">
            Showing {filteredCount} of {totalShelves} shelves
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* FILTER DROPDOWN */}
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'ok' | 'low' | 'empty')}
            className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Shelves</option>
            <option value="ok">✅ In Stock</option>
            <option value="low">⚠️ Low Stock</option>
            <option value="empty">🚨 Empty</option>
          </select>
          
          {/* SORT DROPDOWN */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'aisle' | 'status' | 'lastScanned')}
            className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-medium
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="aisle">Sort by Aisle</option>
            <option value="status">Sort by Status</option>
            <option value="lastScanned">Sort by Last Scanned</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STATS OVERVIEW COMPONENT
// ============================================================================

const StatsOverview: React.FC<{ shelves: Shelf[] }> = ({ shelves }) => {
  const stats = {
    total: shelves.length,
    ok: shelves.filter(s => s.status === 'ok').length,
    low: shelves.filter(s => s.status === 'low').length,
    empty: shelves.filter(s => s.status === 'empty').length
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.ok}</div>
            <div className="text-sm text-gray-500">In Stock</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.low}</div>
            <div className="text-sm text-gray-500">Low Stock</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.empty}</div>
            <div className="text-sm text-gray-500">Empty</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-blue-600" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Shelves</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

const Dashboard: React.FC = () => {
  const { shelves } = useShelves();
  const { alerts } = useAlerts();
  const { markRestocked, requestRescan } = useStaffActions();
  const { connectionStatus } = useRealTimeUpdates();
  const router = useRouter();
  
  const [filter, setFilter] = useState<'all' | 'ok' | 'low' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'aisle' | 'status' | 'lastScanned'>('aisle');
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter and sort shelves
  const filteredAndSortedShelves = shelves
    .filter(shelf => {
      if (filter === 'all') return true;
      return shelf.status === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'aisle':
          return a.aisle.localeCompare(b.aisle);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'lastScanned':
          return new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime();
        default:
          return 0;
      }
    });

  const handleViewDetails = (shelfId: string) => {
    const shelf = shelves.find(s => s.id === shelfId);
    if (shelf) {
      setSelectedShelf(shelf);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedShelf(null);
  };

  const handleMarkRestocked = (shelfId: string, productName: string) => {
    markRestocked(shelfId, productName);
  };

  const handleRequestRescan = async (shelfId: string) => {
    try {
      await requestRescan(shelfId);
    } catch (error) {
      console.error('Failed to request rescan:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <DashboardHeader 
        connectionStatus={connectionStatus}
        isConnected={true} // This prop is no longer used, but kept for consistency
      />

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ALERT BANNER */}
        {alerts.length > 0 && (
          <AlertBanner 
            alerts={alerts.filter(alert => !alert.acknowledged)}
            onViewAlerts={() => router.push('/alerts')}
          />
        )}

        {/* STATS OVERVIEW */}
        <StatsOverview shelves={shelves} />

        {/* FILTER CONTROLS */}
        <FilterControls 
          filter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalShelves={shelves.length}
          filteredCount={filteredAndSortedShelves.length}
        />

        {/* SHELVES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedShelves.map((shelf) => (
            <ShelfCard
              key={shelf.id}
              shelf={shelf}
              onViewDetails={handleViewDetails}
              onMarkRestocked={handleMarkRestocked}
              onRequestRescan={handleRequestRescan}
            />
          ))}
        </div>

        {/* EMPTY STATE */}
        {filteredAndSortedShelves.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No shelves found</h3>
              <p className="text-gray-500">
                {filter !== 'all' 
                  ? 'Try adjusting your filter to see more results.'
                  : 'No shelves are currently configured.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SHELF DETAIL MODAL */}
      {showModal && selectedShelf && (
        <ShelfDetailModal
          shelf={selectedShelf}
          onClose={handleCloseModal}
          onMarkRestocked={handleMarkRestocked}
          onRequestRescan={handleRequestRescan}
        />
      )}

      {/* DEMO CONTROLLER */}
      <DemoController />

      {/* ERROR BOUNDARY */}
      <ErrorBoundary />
    </div>
  );
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function DashboardPage() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
