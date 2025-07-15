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

          {/* SHELF INFO */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Shelf Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
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

          {/* ALL PRODUCTS */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">All Products ({shelf.items.length})</h3>
            {shelf.items.length > 0 ? (
              <div className="space-y-2">
                {shelf.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900">{item.product}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.count === 0 ? 'bg-red-100 text-red-800' :
                        item.count < item.threshold ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.count === 0 ? 'Empty' :
                         item.count < item.threshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Current Stock:</span>
                        <span className="ml-2 font-semibold text-gray-900">{item.count} units</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Threshold:</span>
                        <span className="ml-2 font-semibold text-gray-900">{item.threshold} units</span>
                      </div>
                    </div>
                    {/* Individual product actions */}
                    {item.count === 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            onMarkRestocked(shelf.id, item.product);
                            onClose();
                          }}
                          className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Mark {item.product} Restocked
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                No products assigned to this shelf
              </div>
            )}
          </div>

          {/* STOCK LEVEL */}
          {shelf.status !== 'empty' && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Stock Level</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Stock</span>
                  <span className="font-medium text-gray-900">
                    {shelf.items.reduce((total, item) => total + item.count, 0)} units
                  </span>
                </div>
                {shelf.status === 'low' && (
                  <div className="mt-2 text-sm text-amber-600">
                    ⚠️ Stock level is below recommended threshold
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SHELF ACTIONS */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Shelf Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  onRequestRescan(shelf.id);
                  // Don't close modal - user will use camera and close manually
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white 
                         rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 font-medium shadow-lg shadow-blue-500/25"
              >
                <RotateCcw size={16} />
                Rescan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShelfDetailModal; 