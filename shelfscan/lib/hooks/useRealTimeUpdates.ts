/**
 * Real-Time Updates Hook for ShelfScan AI
 * Simulates WebSocket connection with polling fallback for real-time shelf updates
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { ScanUpdate } from '../types';
import { 
  generateRandomScanUpdate, 
  applyScanUpdate, 
  simulateShelfScan,
  simulateRestockProduct 
} from '../mockData';

interface UseRealTimeUpdatesConfig {
  /** Polling interval in milliseconds (default: 5000) */
  pollingInterval?: number;
  /** WebSocket simulation interval in milliseconds (default: 8000) */
  wsUpdateInterval?: number;
  /** Probability of receiving an update via WebSocket (0-1, default: 0.3) */
  wsUpdateProbability?: number;
  /** Probability of receiving an update via polling (0-1, default: 0.2) */
  pollingUpdateProbability?: number;
  /** Enable debug logging */
  debug?: boolean;
}

interface UseRealTimeUpdatesReturn {
  /** Manually request a rescan for a specific shelf */
  requestRescan: (shelfId: string) => Promise<void>;
  /** Check if real-time updates are active */
  isConnected: boolean;
  /** Get the current connection status */
  connectionStatus: 'connected' | 'polling' | 'disconnected';
}

/**
 * Hook for managing real-time updates via simulated WebSocket with polling fallback
 */
export const useRealTimeUpdates = (
  config: UseRealTimeUpdatesConfig = {}
): UseRealTimeUpdatesReturn => {
  const {
    pollingInterval = 5000,
    wsUpdateInterval = 8000,
    wsUpdateProbability = 0.3,
    pollingUpdateProbability = 0.2,
    debug = false
  } = config;

  const { state, dispatch } = useAppContext();
  const wsSimulationRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const connectionStatusRef = useRef<'connected' | 'polling' | 'disconnected'>('disconnected');

  const log = useCallback((message: string, data?: unknown) => {
    if (debug) {
      console.log(`[RealTimeUpdates] ${message}`, data || '');
    }
  }, [debug]);

  // Process incoming updates and integrate with application state
  const handleUpdate = useCallback((update: ScanUpdate, source: 'websocket' | 'polling') => {
    log(`${source} update received`, update);
    
    // Find the shelf to update
    const shelfToUpdate = state.shelves.find(s => s.id === update.shelf);
    if (!shelfToUpdate) {
      log(`Shelf ${update.shelf} not found`);
      return;
    }

    // Apply the scan update to create updated shelf
    const updatedShelf = applyScanUpdate(shelfToUpdate, update);
    
    // Dispatch the update to state
    dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });

    // Show UI notification for significant changes
    if (updatedShelf.status !== shelfToUpdate.status) {
      log(`Shelf ${update.shelf} status changed: ${shelfToUpdate.status} → ${updatedShelf.status}`);
    }
  }, [state.shelves, dispatch, log]);

  // Simulate WebSocket connection and periodic updates
  const setupWebSocketSimulation = useCallback(() => {
    log('Setting up WebSocket simulation...');
    
    wsSimulationRef.current = setInterval(() => {
      if (Math.random() < wsUpdateProbability) {
        const randomUpdate = generateRandomScanUpdate(state.shelves);
        if (randomUpdate) {
          handleUpdate(randomUpdate, 'websocket');
        }
      }
    }, wsUpdateInterval);

    connectionStatusRef.current = 'connected';
    isConnectedRef.current = true;
    log('WebSocket simulation started');
  }, [wsUpdateInterval, wsUpdateProbability, state.shelves, handleUpdate, log]);

  // Setup polling fallback mechanism
  const setupPolling = useCallback(() => {
    if (pollingTimerRef.current) return;
    
    log('Setting up polling fallback...');
    
    pollingTimerRef.current = setInterval(() => {
      log('Polling for updates...');
      
      if (Math.random() < pollingUpdateProbability) {
        const randomUpdate = generateRandomScanUpdate(state.shelves);
        if (randomUpdate) {
          handleUpdate(randomUpdate, 'polling');
        }
      }
    }, pollingInterval);

    if (!isConnectedRef.current) {
      connectionStatusRef.current = 'polling';
    }
    log('Polling started');
  }, [pollingInterval, pollingUpdateProbability, state.shelves, handleUpdate, log]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
      log('Polling stopped');
    }
  }, [log]);

  // Stop WebSocket simulation
  const stopWebSocketSimulation = useCallback(() => {
    if (wsSimulationRef.current) {
      clearInterval(wsSimulationRef.current);
      wsSimulationRef.current = null;
      isConnectedRef.current = false;
      log('WebSocket simulation stopped');
    }
  }, [log]);

  // Manual rescan functionality
  const requestRescan = useCallback(async (shelfId: string): Promise<void> => {
    log(`Manual rescan requested for shelf ${shelfId}`);
    
    // Set loading state
    dispatch({ type: 'FETCH_SHELVES_START' });
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find the shelf to rescan
      const shelfToRescan = state.shelves.find(s => s.id === shelfId);
      if (!shelfToRescan) {
        throw new Error(`Shelf ${shelfId} not found`);
      }

      // Simulate a fresh scan
      const scanUpdate = simulateShelfScan(shelfToRescan);
      const updatedShelf = applyScanUpdate(shelfToRescan, scanUpdate);
      
      // Update the shelf in state
      dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });
      
      log(`Manual rescan completed for shelf ${shelfId}`, updatedShelf);
    } catch (error) {
      log(`Manual rescan failed for shelf ${shelfId}`, error);
      dispatch({ type: 'FETCH_SHELVES_ERROR', payload: `Failed to rescan shelf ${shelfId}` });
    }
  }, [state.shelves, dispatch, log]);

  // Initialize real-time updates on mount
  useEffect(() => {
    log('Initializing real-time updates...');
    
    // Start WebSocket simulation
    setupWebSocketSimulation();
    
    // Start polling as fallback
    setupPolling();
    
    // Cleanup on unmount
    return () => {
      log('Cleaning up real-time updates...');
      stopWebSocketSimulation();
      stopPolling();
      connectionStatusRef.current = 'disconnected';
    };
  }, [setupWebSocketSimulation, setupPolling, stopWebSocketSimulation, stopPolling, log]);

  return {
    requestRescan,
    isConnected: isConnectedRef.current,
    connectionStatus: connectionStatusRef.current
  };
};

/**
 * Hook for simulation controls (useful for demos)
 */
export const useRealTimeSimulation = () => {
  const { state, dispatch } = useAppContext();

  const triggerRandomUpdate = useCallback(() => {
    const randomUpdate = generateRandomScanUpdate(state.shelves);
    if (randomUpdate) {
      const shelfToUpdate = state.shelves.find(s => s.id === randomUpdate.shelf);
      if (shelfToUpdate) {
        const updatedShelf = applyScanUpdate(shelfToUpdate, randomUpdate);
        dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });
      }
    }
  }, [state.shelves, dispatch]);

  const simulateRestock = useCallback((shelfId: string, productName: string) => {
    const shelf = state.shelves.find(s => s.id === shelfId);
    if (shelf) {
      const restockedShelf = simulateRestockProduct(shelf, productName);
      dispatch({ type: 'UPDATE_SHELF', payload: restockedShelf });
    }
  }, [state.shelves, dispatch]);

  return {
    triggerRandomUpdate,
    simulateRestock
  };
}; 