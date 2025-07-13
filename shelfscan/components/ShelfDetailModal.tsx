'use client';

/**
 * ShelfDetailModal Component
 * 
 * Displays detailed information about a specific shelf including:
 * - Complete product list with counts and thresholds
 * - Shelf image (when available)
 * - Staff action buttons
 * - Historical scan data
 */

import React, { useEffect, useState } from 'react';
import { Shelf, Product } from '../lib/types';
import { useAlerts, useStaffActions } from '../lib/context/AppContext';
import { formatRelativeTime } from '../lib/alertUtils';
import { 
  X, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  Package,
  MapPin,
  Clock,
  Camera,
  Zap
} from 'lucide-react';

interface ShelfDetailModalProps {
  shelf: Shelf | null;
  isOpen: boolean;
  onClose: () => void;
}

const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({ 
  shelf, 
  isOpen, 
  onClose 
}) => {
  const { alerts } = useAlerts();
  const { markRestocked, requestRescan } = useStaffActions();
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no shelf data
  if (!isOpen || !shelf) {
    return null;
  }

  // Get shelf-specific alerts
  const shelfAlerts = alerts.filter(alert => 
    alert.shelf === shelf.id && !alert.acknowledged
  );

  // Calculate shelf statistics
  const totalProducts = shelf.items.length;
  const emptyProducts = shelf.items.filter(item => item.count === 0);
  const lowStockProducts = shelf.items.filter(
    item => item.count > 0 && item.count < item.threshold
  );
  const okProducts = shelf.items.filter(
    item => item.count >= item.threshold
  );

  // Handle staff actions
  const handleMarkRestocked = async (productName?: string) => {
    setIsLoading(true);
    setLastAction('Marking as restocked...');
    
    try {
      if (productName) {
        // Mark specific product as restocked
        markRestocked(shelf.id, productName);
        setLastAction(`✅ ${productName} marked as restocked`);
      } else {
        // Mark all low/empty products as restocked
        const problematicProducts = [...emptyProducts, ...lowStockProducts];
        for (const product of problematicProducts) {
          markRestocked(shelf.id, product.product);
        }
        setLastAction(`✅ All products restocked`);
      }
    } catch (error) {
      setLastAction('❌ Failed to mark as restocked');
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  const handleRequestRescan = async () => {
    setIsLoading(true);
    setLastAction('Requesting rescan...');
    
    try {
      requestRescan(shelf.id);
      setLastAction('✅ Rescan requested successfully');
    } catch (error) {
      setLastAction('❌ Failed to request rescan');
    } finally {
      setIsLoading(false);
      setTimeout(() => setLastAction(null), 3000);
    }
  };

  // Get status styling for products
  const getProductStatusStyle = (product: Product) => {
    if (product.count === 0) {
      return 'bg-red-50 border-red-200 text-red-900';
    }
    if (product.count < product.threshold) {
      return 'bg-amber-50 border-amber-200 text-amber-900';
    }
    return 'bg-green-50 border-green-200 text-green-900';
  };

  const getProductStatusIcon = (product: Product) => {
    if (product.count === 0) {
      return <AlertTriangle size={16} className="text-red-500" />;
    }
    if (product.count < product.threshold) {
      return <AlertTriangle size={16} className="text-amber-500" />;
    }
    return <CheckCircle size={16} className="text-green-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              Shelf {shelf.id}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>Aisle {shelf.aisle}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Last scan: {formatRelativeTime(shelf.lastScanned)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package size={14} />
                <span>{totalProducts} products</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* STATUS SUMMARY */}
        {shelfAlerts.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle size={18} />
              <span className="font-medium">
                {shelfAlerts.length} active alert{shelfAlerts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            
            {/* PRODUCTS LIST */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">Products</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    {okProducts.length} OK
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    {lowStockProducts.length} Low
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    {emptyProducts.length} Empty
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {shelf.items.map((product, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-lg p-4 ${getProductStatusStyle(product)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getProductStatusIcon(product)}
                          <span className="font-medium">{product.product}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Current Stock:</span>
                            <div className="font-semibold text-lg">{product.count}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Threshold:</span>
                            <div className="font-semibold text-lg">{product.threshold}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* INDIVIDUAL RESTOCK BUTTON */}
                      {(product.count === 0 || product.count < product.threshold) && (
                        <button
                          onClick={() => handleMarkRestocked(product.product)}
                          disabled={isLoading}
                          className="ml-4 flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors text-sm disabled:opacity-50"
                        >
                          <CheckCircle size={14} />
                          <span>Restock</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SHELF INFO & ACTIONS */}
            <div className="space-y-6">
              
              {/* SHELF IMAGE */}
              <div>
                <h3 className="text-lg font-semibold text-card-foreground mb-3">Shelf Image</h3>
                <div className="border border-border rounded-lg overflow-hidden bg-muted">
                  {shelf.imageUrl ? (
                    <img 
                      src={shelf.imageUrl} 
                      alt={`Shelf ${shelf.id}`} 
                      className="w-full h-48 object-cover" 
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Camera size={32} className="mx-auto mb-2 opacity-50" />
                        <div className="text-sm">No image available</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK STATS */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-card-foreground mb-3">Quick Stats</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Products:</span>
                    <span className="font-medium">{totalProducts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      shelf.status === 'ok' ? 'text-green-600' : 
                      shelf.status === 'low' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {shelf.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Alerts:</span>
                    <span className="font-medium">{shelfAlerts.length}</span>
                  </div>
                </div>
              </div>

              {/* ACTION STATUS */}
              {lastAction && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">{lastAction}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="border-t border-border p-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          
          <button 
            onClick={handleRequestRescan}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Request Rescan</span>
          </button>
          
          {(emptyProducts.length > 0 || lowStockProducts.length > 0) && (
            <button 
              onClick={() => handleMarkRestocked()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-300 rounded-lg text-green-700 hover:bg-green-100 hover:border-green-400 transition-colors disabled:opacity-50"
            >
              <Zap size={16} />
              <span>Restock All</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelfDetailModal; 