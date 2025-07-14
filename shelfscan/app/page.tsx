'use client';

/**
 * ShelfScan AI Dashboard - Main Page
 * Displays real-time inventory status across all store shelves
 */

import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Wifi, 
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useShelves, useAlerts, useStaffActions } from '../lib/context/AppContext';
import { useRealTimeUpdates } from '../lib/hooks/useRealTimeUpdates';
import ShelfCard from '../components/ShelfCard';
import AlertBanner from '../components/AlertBanner';
import ShelfDetailModal from '../components/ShelfDetailModal';
import DemoController from '../components/DemoController';
import ErrorBoundary from '../components/ErrorBoundary';
import { MobileNavigation, DesktopNavigation } from '../components/MobileNavigation';
import { Shelf } from '../lib/types';
import { useRouter } from 'next/navigation';

// ============================================================================
// REAL-TIME STATUS INDICATOR COMPONENT
// ============================================================================

const RealTimeStatus: React.FC<{ 
  connectionStatus: 'connected' | 'polling' | 'disconnected';
  isConnected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
}> = ({ connectionStatus, isConnected }) => {
  const [recentUpdate, setRecentUpdate] = useState(false);

  // Update timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentUpdate(true);
      setTimeout(() => setRecentUpdate(false), 1000);
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
    <div className="flex flex-col gap-4 mb-6">
      {/* TITLE SECTION */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Store Inventory
        </h2>
        <span className="text-sm text-gray-500">
          ({filteredCount} of {totalShelves} shelves)
        </span>
      </div>
      
      {/* TOUCH-OPTIMIZED CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* STATUS FILTER - Touch-optimized */}
        <div className="flex items-center gap-2 flex-1">
          <Filter size={16} className="text-gray-400" />
          <select 
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as 'all' | 'ok' | 'low' | 'empty')}
            className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     touch-manipulation bg-white min-h-[48px]"
          >
            <option value="all">All Status</option>
            <option value="ok">✅ Good Stock</option>
            <option value="low">⚠️ Low Stock</option>
            <option value="empty">🚨 Empty</option>
          </select>
        </div>
        
        {/* SORT BY - Touch-optimized */}
        <div className="flex-1">
          <select 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'aisle' | 'status' | 'lastScanned')}
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm font-medium
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     touch-manipulation bg-white min-h-[48px]"
          >
            <option value="aisle">Sort by Aisle</option>
            <option value="status">Sort by Status</option>
            <option value="lastScanned">Sort by Last Scan</option>
          </select>
        </div>
        
        {/* CLEAR FILTERS - Touch-optimized */}
        {filter !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium
                     text-gray-600 hover:text-gray-800 border-2 border-gray-300 rounded-lg 
                     hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] 
                     transition-all duration-200 touch-manipulation
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <RotateCcw size={16} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STATS OVERVIEW COMPONENT
// ============================================================================

const StatsOverview: React.FC<{ shelves: Shelf[] }> = ({ shelves }) => {
  const okShelves = shelves.filter(s => s.status === 'ok').length;
  const lowShelves = shelves.filter(s => s.status === 'low').length;
  const emptyShelves = shelves.filter(s => s.status === 'empty').length;
  
  const stats = [
    {
      value: okShelves,
      label: 'Good Stock',
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      labelColor: 'text-green-600',
      delay: 0
    },
    {
      value: lowShelves,
      label: 'Low Stock',
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
      labelColor: 'text-yellow-600',
      delay: 100
    },
    {
      value: emptyShelves,
      label: 'Empty/Critical',
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      labelColor: 'text-red-600',
      delay: 200
    }
  ];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label}
            className={`
              ${stat.bgColor} ${stat.borderColor} rounded-lg p-4 border-2
              animate-fadeInUp hover-lift transition-all duration-300 cursor-pointer
              hover:scale-105 active:scale-95 group
            `}
            style={{
              animationDelay: `${stat.delay}ms`
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${stat.bgColor} ${stat.borderColor} border group-hover:animate-float`}>
                <Icon size={24} className={`${stat.iconColor} transition-transform duration-300 group-hover:scale-110`} />
              </div>
              <div>
                <div className={`text-3xl font-bold ${stat.textColor} transition-all duration-300 group-hover:scale-110`}>
                  {stat.value}
                </div>
                <div className={`text-sm font-medium ${stat.labelColor}`}>
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// UPDATED DASHBOARD COMPONENT WITH REAL-TIME UPDATES
// ============================================================================

const Dashboard: React.FC = () => {
  const { shelves, loading } = useShelves();
  const { alerts, acknowledgeAlert } = useAlerts();
  const { markRestocked } = useStaffActions();
  const router = useRouter();
  
  // Initialize real-time updates hook
  const { requestRescan, isConnected, connectionStatus } = useRealTimeUpdates({
    debug: process.env.NODE_ENV === 'development',
    pollingInterval: 6000,
    wsUpdateInterval: 10000,
    wsUpdateProbability: 0.25,
    pollingUpdateProbability: 0.15
  });
  
  // Local state for UI
  const [filter, setFilter] = useState<'all' | 'ok' | 'low' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'aisle' | 'status' | 'lastScanned'>('aisle');
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatedShelves, setUpdatedShelves] = useState<Set<string>>(new Set());
  
  // Track recently updated shelves for visual feedback
  useEffect(() => {
    const shelfIds = new Set(shelves.map(s => s.id));
    const newlyUpdated = new Set<string>();
    
    // Check for changes (this is a simplified approach)
    shelfIds.forEach(id => {
      const shelf = shelves.find(s => s.id === id);
      if (shelf) {
        const lastScannedTime = new Date(shelf.lastScanned).getTime();
        const fiveSecondsAgo = Date.now() - 5000;
        
        if (lastScannedTime > fiveSecondsAgo) {
          newlyUpdated.add(id);
        }
      }
    });
    
    setUpdatedShelves(newlyUpdated);
    
    // Clear the updated status after 3 seconds
    if (newlyUpdated.size > 0) {
      const timer = setTimeout(() => {
        setUpdatedShelves(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shelves]);
  
  // Filter and sort shelves
  const filteredShelves = shelves
    .filter(shelf => filter === 'all' || shelf.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'aisle':
          return a.aisle.localeCompare(b.aisle) || a.id.localeCompare(b.id);
        case 'status':
          const statusOrder = { empty: 0, low: 1, ok: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'lastScanned':
          return new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime();
        default:
          return 0;
      }
    });
  
  // Event handlers
  const handleViewDetails = (shelfId: string) => {
    const shelf = shelves.find(s => s.id === shelfId);
    if (shelf) {
      setSelectedShelf(shelf);
      setIsModalOpen(true);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShelf(null);
  };
  
  const handleMarkRestocked = (shelfId: string, productName: string) => {
    markRestocked(shelfId, productName);
  };
  
  // Use the real-time updates hook for rescanning
  const handleRequestRescan = async (shelfId: string) => {
    try {
      await requestRescan(shelfId);
      // Visual feedback will be handled by the shelf update detection
    } catch (error) {
      console.error('Failed to rescan shelf:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 transition-all duration-300">
      <DashboardHeader 
        connectionStatus={connectionStatus}
        isConnected={isConnected}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="transition-all duration-300">
          <AlertBanner 
            alerts={alerts}
            onAcknowledge={acknowledgeAlert}
            onViewAll={() => router.push('/alerts')}
          />
        </div>
        
        <div className="transition-all duration-300">
          <StatsOverview shelves={shelves} />
        </div>
        
        <FilterControls
          filter={filter}
          onFilterChange={setFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalShelves={shelves.length}
          filteredCount={filteredShelves.length}
        />
        
        {/* ENHANCED LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 animate-fadeIn">
            <div className="flex items-center gap-3 text-gray-600 mb-4">
              <RotateCcw size={24} className="animate-spin text-blue-600" />
              <span className="text-lg font-medium">Loading shelf data...</span>
            </div>
            
            {/* LOADING SKELETON CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="animate-fadeInUp animate-shimmer rounded-lg border-2 border-gray-200 p-6 h-48"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-300 rounded w-24 loading-skeleton"></div>
                      <div className="h-4 bg-gray-300 rounded w-16 loading-skeleton"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-32 loading-skeleton"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-full loading-skeleton"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4 loading-skeleton"></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="h-10 bg-gray-300 rounded flex-1 loading-skeleton"></div>
                      <div className="h-10 bg-gray-300 rounded flex-1 loading-skeleton"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* SHELF GRID WITH TRANSITIONS */}
        {!loading && (
          <>
            {filteredShelves.length === 0 ? (
              <div className="text-center py-12 transition-all duration-300">
                <div className="text-gray-500">
                  No shelves found matching the current filter.
                </div>
                <button 
                  onClick={() => setFilter('all')}
                  className="mt-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  Show all shelves
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredShelves.map((shelf, index) => (
                  <div
                    key={shelf.id}
                    className={`
                      animate-fadeInUp transition-all duration-500 hover-lift
                      ${updatedShelves.has(shelf.id) 
                        ? 'transform scale-[1.02] ring-2 ring-blue-400 ring-opacity-50 shadow-lg animate-bounce' 
                        : 'transform scale-100'
                      }
                    `}
                    style={{
                      animationDelay: `${Math.min(index * 100, 800)}ms`
                    }}
                  >
                    <ShelfCard
                      shelf={shelf}
                      onViewDetails={handleViewDetails}
                      onMarkRestocked={handleMarkRestocked}
                      onRequestRescan={handleRequestRescan}
                      className="transition-all duration-300 hover:shadow-xl"
                    />
                    {updatedShelves.has(shelf.id) && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* SHELF DETAIL MODAL */}
        {selectedShelf && isModalOpen && (
          <ShelfDetailModal
            shelf={selectedShelf}
            onClose={handleCloseModal}
            onMarkRestocked={handleMarkRestocked}
            onRequestRescan={handleRequestRescan}
          />
        )}
        
        {/* DEMO CONTROLLER WITH ERROR BOUNDARY */}
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Demo Controller Error:', error, errorInfo);
          }}
          resetKeys={[isModalOpen ? 'modal-open' : 'modal-closed', filter, sortBy]} // Reset on major state changes
        >
          <DemoController />
        </ErrorBoundary>
      </main>
    </div>
  );
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function DashboardPage() {
  return <Dashboard />;
}
