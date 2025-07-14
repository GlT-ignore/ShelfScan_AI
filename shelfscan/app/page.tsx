'use client';

/**
 * ShelfScan AI Dashboard - Main Page
 * Uses exact design from magicpath-project with integrated real-time functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  RotateCcw 
} from 'lucide-react';
import { useShelves, useAlerts, useStaffActions } from '../lib/context/AppContext';
import { useRealTimeUpdates } from '../lib/hooks/useRealTimeUpdates';
import ShelfDetailModal from '../components/ShelfDetailModal';
import DemoController from '../components/DemoController';
import { Shelf, Alert } from '../lib/types';
import { useRouter } from 'next/navigation';

// ============================================================================
// HELPER FUNCTIONS FROM MAGICPATH
// ============================================================================

const getStatusColor = (status: string) => {
  switch (status) {
    case 'empty':
      return 'bg-red-950/50 border-red-800/50 dark:bg-red-950/30 dark:border-red-700/40';
    case 'low':
      return 'bg-amber-950/50 border-amber-800/50 dark:bg-amber-950/30 dark:border-amber-700/40';
    case 'ok':
      return 'bg-emerald-950/50 border-emerald-800/50 dark:bg-emerald-950/30 dark:border-emerald-700/40';
    default:
      return 'bg-slate-950/50 border-slate-800/50 dark:bg-slate-950/30 dark:border-slate-700/40';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'empty':
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    case 'low':
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'ok':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'empty':
      return 'Empty/Critical';
    case 'low':
      return 'Low Stock';
    case 'ok':
      return 'Good Stock';
    default:
      return 'Unknown';
  }
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date().getTime();
  const time = new Date(timestamp).getTime();
  const diffMinutes = Math.floor((now - time) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// ============================================================================
// MAIN DASHBOARD COMPONENT WITH MAGICPATH DESIGN
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
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  
  // Get active alerts (unacknowledged)
  const activeAlerts = alerts.filter(alert => !alert.acknowledged).slice(0, 3);
  const remainingAlerts = alerts.filter(alert => !alert.acknowledged).length - 3;
  
  // Calculate stats
  const okCount = shelves.filter(s => s.status === 'ok').length;
  const lowCount = shelves.filter(s => s.status === 'low').length;
  const emptyCount = shelves.filter(s => s.status === 'empty').length;
  
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
  
  const handleRequestRescan = async (shelfId: string) => {
    try {
      await requestRescan(shelfId);
    } catch (error) {
      console.error('Failed to rescan shelf:', error);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-lg font-medium text-slate-100">Loading shelf data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">ShelfScan AI</h1>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/30">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors backdrop-blur-sm"
            >
              Dashboard
            </button>
            <button 
              onClick={() => router.push('/alerts')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25"
            >
              <span>Alert</span>
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm">
                {activeAlerts.length}
              </span>
            </button>
            <span className="text-sm text-slate-400">
              {connectionStatus === 'connected' ? 'Live' : 'Polling'} • Last update: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </header>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <section className="mb-8">
            <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-semibold text-slate-100">Active Alerts</h2>
                  <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-medium border border-amber-500/30">
                    {alerts.filter(alert => !alert.acknowledged).length}
                  </span>
                </div>
                <button 
                  onClick={() => router.push('/alerts')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  View All <Eye className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.type === 'empty' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {alert.type === 'empty' ? 'EMPTY' : 'LOW STOCK'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-100">{alert.product}</p>
                        <p className="text-sm text-slate-400">Shelf {alert.shelf} • {formatTimeAgo(alert.timestamp)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm rounded hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
              
              {remainingAlerts > 0 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => router.push('/alerts')}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    +{remainingAlerts} more alerts • View All Alerts
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-slate-100">{okCount}</p>
                <p className="text-sm text-slate-400">Good Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-slate-100">{lowCount}</p>
                <p className="text-sm text-slate-400">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-slate-100">{emptyCount}</p>
                <p className="text-sm text-slate-400">Empty/Critical</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store Inventory */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-100">
              Store Inventory <span className="text-slate-400 font-normal">({shelves.length} of {shelves.length} shelves)</span>
            </h2>
            <div className="flex gap-4">
              <select className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-100 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none">
                <option>All Status</option>
                <option>Good Stock</option>
                <option>Low Stock</option>
                <option>Empty/Critical</option>
              </select>
              <select className="px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-slate-100 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none">
                <option>Sort by Aisle</option>
                <option>Sort by Status</option>
                <option>Sort by Last Scanned</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {shelves.map(shelf => {
              const criticalProduct = shelf.items.find(item => item.count === 0 || item.count < item.threshold);
              
              return (
                <div key={shelf.id} className={`rounded-xl border p-4 backdrop-blur-sm ${getStatusColor(shelf.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">Shelf {shelf.id}</h3>
                      {getStatusIcon(shelf.status)}
                    </div>
                    <span className="text-xs text-slate-400">{shelf.aisle}</span>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-slate-300">{getStatusLabel(shelf.status)}</p>
                    <p className="text-xs text-slate-400">{formatTimeAgo(shelf.lastScanned)}</p>
                    <p className="text-xs text-slate-400">{shelf.items.length} products</p>
                    {shelf.status === 'empty' && shelf.items.filter(item => item.count === 0).length > 0 && (
                      <p className="text-xs text-slate-400">{shelf.items.filter(item => item.count === 0).length} empty</p>
                    )}
                    {criticalProduct && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-300">Most Critical:</p>
                        <p className="text-xs text-slate-400">
                          {criticalProduct.product} <span className="text-red-400">(Empty)</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {shelf.status === 'ok' ? (
                      <button 
                        onClick={() => handleRequestRescan(shelf.id)}
                        className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm rounded hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Rescan
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => criticalProduct && handleMarkRestocked(shelf.id, criticalProduct.product)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm rounded hover:from-emerald-700 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/25"
                        >
                          Mark Restocked
                        </button>
                        <button 
                          onClick={() => handleRequestRescan(shelf.id)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm rounded hover:from-blue-700 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Rescan
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleViewDetails(shelf.id)}
                      className="w-full px-3 py-2 border border-slate-600/50 text-slate-300 text-sm rounded hover:bg-slate-800/50 transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Demo Controller */}
        {showDemo && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-slate-900/95 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm max-w-md w-full mx-4">
              <DemoController />
              <button
                onClick={() => setShowDemo(false)}
                className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200"
              >
                Close Demo
              </button>
            </div>
          </div>
        )}
        
        {/* Floating Demo Toggle */}
        <button
          onClick={() => setShowDemo(true)}
          className="fixed bottom-6 right-6 p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-600 transition-all duration-200 z-30"
        >
          <Eye size={20} />
        </button>
        
        {/* Shelf Detail Modal */}
        {selectedShelf && isModalOpen && (
          <ShelfDetailModal
            shelf={selectedShelf}
            onClose={handleCloseModal}
            onMarkRestocked={handleMarkRestocked}
            onRequestRescan={handleRequestRescan}
          />
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return <Dashboard />;
}
