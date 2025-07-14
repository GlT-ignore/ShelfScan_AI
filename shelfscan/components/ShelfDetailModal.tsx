'use client';

import React from 'react';
import { Shelf } from '../lib/types';
import { X, Package, MapPin, Clock, RotateCcw, CheckCircle } from 'lucide-react';

interface ShelfDetailModalProps {
  shelf: Shelf;
  onClose: () => void;
  onMarkRestocked: (shelfId: string, productName: string) => void;
  onRequestRescan: (shelfId: string) => void;
}

const ShelfDetailModal: React.FC<ShelfDetailModalProps> = ({
  shelf,
  onClose,
  onMarkRestocked,
  onRequestRescan
}) => {
  // Derive product information from shelf items
  const primaryProduct = shelf.items.length > 0 ? shelf.items[0] : null;
  const totalStock = shelf.items.reduce((sum, item) => sum + item.count, 0);
  const productName = primaryProduct?.product || 'No Product';

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ok':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <CheckCircle size={16} className="text-green-600" />,
          text: 'In Stock'
        };
      case 'low':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: <Package size={16} className="text-amber-600" />,
          text: 'Low Stock'
        };
      case 'empty':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <Package size={16} className="text-red-600" />,
          text: 'Empty'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: <Package size={16} className="text-gray-600" />,
          text: 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(shelf.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Shelf Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* STATUS */}
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <div className={`font-medium ${statusConfig.color}`}>
                {statusConfig.text}
              </div>
              <div className="text-sm text-gray-500">
                Shelf {shelf.id}
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Product Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-400" />
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-600">Aisle {shelf.aisle}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-600">
                  Last scanned: {formatDateTime(shelf.lastScanned)}
                </span>
              </div>
            </div>
          </div>

          {/* STOCK LEVEL */}
          {shelf.status !== 'empty' && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Stock Level</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-medium text-gray-900">{totalStock} units</span>
                </div>
                {shelf.status === 'low' && (
                  <div className="mt-2 text-sm text-amber-600">
                    ⚠️ Stock level is below recommended threshold
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Actions</h3>
            <div className="space-y-2">
              {shelf.status === 'empty' && (
                <button
                  onClick={() => {
                    onMarkRestocked(shelf.id, productName);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white 
                           rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle size={16} />
                  Mark as Restocked
                </button>
              )}
              
              <button
                onClick={() => {
                  onRequestRescan(shelf.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white 
                         rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RotateCcw size={16} />
                Request Rescan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShelfDetailModal; 