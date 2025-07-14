'use client';

/**
 * Global State Management for ShelfScan AI
 * Uses React Context API with useReducer for managing shelf and alert data
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, ActionType, Shelf, Alert } from '../types';
import { generateMockData } from '../mockData';

// ============================================================================
// INITIAL STATE SETUP
// ============================================================================

function createInitialState(): AppState {
  // Use generateMockData to provide demo data for shelves and alerts
  const mockData = generateMockData();
  return {
    shelves: mockData.shelves,
    alerts: mockData.alerts,
    loading: { shelves: false, alerts: false },
    error: null,
    selectedShelf: null,
    filterOptions: { aisle: null, status: null },
  };
}

// ============================================================================
// CONTEXT DEFINITION
// ============================================================================

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================================
// REDUCER IMPLEMENTATION
// ============================================================================

// Add INIT action type to AppAction
export type AppAction =
  | { type: 'INIT'; payload: AppState }
  // Shelf data actions
  | { type: 'FETCH_SHELVES_START'; payload?: unknown }
  | { type: 'FETCH_SHELVES_SUCCESS'; payload: Shelf[] }
  | { type: 'FETCH_SHELVES_ERROR'; payload: string }
  | { type: 'UPDATE_SHELF'; payload: Shelf }
  | { type: 'SET_SHELVES'; payload: Shelf[] }
  // Alert data actions
  | { type: 'FETCH_ALERTS_START'; payload?: unknown }
  | { type: 'FETCH_ALERTS_SUCCESS'; payload: Alert[] }
  | { type: 'FETCH_ALERTS_ERROR'; payload: string }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: string }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  // UI state actions
  | { type: 'SELECT_SHELF'; payload: string }
  | { type: 'CLEAR_SELECTED_SHELF' }
  | { type: 'SET_FILTER'; payload: { key: 'aisle' | 'status'; value: string | null } }
  | { type: 'CLEAR_FILTERS' }
  // Staff action events
  | { type: 'MARK_RESTOCKED'; payload: { shelfId: string; productName: string } }
  | { type: 'REQUEST_RESCAN'; payload: string }
  ;

// Update all reducer return values to always include shelves and alerts arrays
function appReducer(state: AppState | null, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return {
        ...action.payload,
        shelves: action.payload.shelves ?? [],
        alerts: action.payload.alerts ?? [],
      };
    case 'FETCH_SHELVES_START':
      return {
        ...state!,
        loading: { ...state!.loading, shelves: true },
        error: null,
        shelves: state!.shelves ?? [],
        alerts: state!.alerts ?? [],
      };
    case 'FETCH_SHELVES_SUCCESS':
      return {
        ...state!,
        shelves: action.payload ?? [],
        loading: { ...state!.loading, shelves: false },
        error: null,
        alerts: state!.alerts ?? [],
      };
    case 'FETCH_SHELVES_ERROR':
      return {
        ...state!,
        loading: { ...state!.loading, shelves: false },
        error: action.payload,
        shelves: state!.shelves ?? [],
        alerts: state!.alerts ?? [],
      };
    case 'UPDATE_SHELF':
      return {
        ...state!,
        shelves: state!.shelves.map(shelf =>
          shelf.id === action.payload.id ? action.payload : shelf
        ),
        alerts: state!.alerts ?? [],
      };
    case 'SET_SHELVES':
      return {
        ...state!,
        shelves: action.payload ?? [],
        alerts: state!.alerts ?? [],
      };
    case 'FETCH_ALERTS_START':
      return {
        ...state!,
        loading: { ...state!.loading, alerts: true },
        error: null,
        shelves: state!.shelves ?? [],
        alerts: state!.alerts ?? [],
      };
    case 'FETCH_ALERTS_SUCCESS':
      return {
        ...state!,
        alerts: action.payload ?? [],
        loading: { ...state!.loading, alerts: false },
        error: null,
        shelves: state!.shelves ?? [],
      };
    case 'FETCH_ALERTS_ERROR':
      return {
        ...state!,
        loading: { ...state!.loading, alerts: false },
        error: action.payload,
        shelves: state!.shelves ?? [],
        alerts: state!.alerts ?? [],
      };
    case 'ADD_ALERT':
      return {
        ...state!,
        alerts: [action.payload, ...state!.alerts],
        shelves: state!.shelves ?? [],
      };
    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state!,
        alerts: state!.alerts.map(alert =>
          alert.id === action.payload
            ? { ...alert, acknowledged: true }
            : alert
        ),
        shelves: state!.shelves ?? [],
      };
    case 'REMOVE_ALERT':
      return {
        ...state!,
        alerts: state!.alerts.filter(alert => alert.id !== action.payload),
        shelves: state!.shelves ?? [],
      };
    case 'SET_ALERTS':
      return {
        ...state!,
        alerts: action.payload ?? [],
        shelves: state!.shelves ?? [],
      };
    case 'SELECT_SHELF':
      return {
        ...state!,
        selectedShelf: action.payload,
      };
    case 'CLEAR_SELECTED_SHELF':
      return {
        ...state!,
        selectedShelf: null,
      };
    case 'SET_FILTER':
      return {
        ...state!,
        filterOptions: {
          ...state!.filterOptions,
          [action.payload.key]: action.payload.value
        },
      };
    case 'CLEAR_FILTERS':
      return {
        ...state!,
        filterOptions: {
          aisle: null,
          status: null
        },
      };
    case 'MARK_RESTOCKED':
      return {
        ...state!,
        shelves: state!.shelves.map(shelf => {
          if (shelf.id === action.payload.shelfId) {
            return {
              ...shelf,
              items: shelf.items.map((product: import('../types').Product) =>
                product.product === action.payload.productName
                  ? { ...product, count: product.count + 1 }
                  : product
              )
            };
          }
          return shelf;
        }),
        alerts: state!.alerts.filter(alert => 
          !(alert.shelf === action.payload.shelfId && alert.product === action.payload.productName)
        ),
      };
    case 'REQUEST_RESCAN':
      return {
        ...state!,
        shelves: state!.shelves.map(shelf =>
          shelf.id === action.payload
            ? { ...shelf, lastScanned: new Date().toISOString() }
            : shelf
        ),
        alerts: state!.alerts ?? [],
      };
    default:
      return {
        ...(state as AppState),
        shelves: state?.shelves ?? [],
        alerts: state?.alerts ?? [],
      };
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
  initialData?: Partial<AppState>;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialData }) => {
  const [state, dispatch] = useReducer(appReducer, null);

  useEffect(() => {
    if (state === null) {
      const initial = {
        ...createInitialState(),
        ...initialData
      };
      dispatch({ type: 'INIT', payload: initial });
    }
  }, [state, initialData]);

  if (state === null) {
    return null;
  }

  return (
    <AppContext.Provider value={{ state: state!, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================================================
// CONTEXT HOOK
// ============================================================================

/**
 * Custom hook to access the App Context
 * Throws error if used outside of AppProvider
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error(
      'useAppContext must be used within an AppProvider. ' +
      'Make sure to wrap your component tree with <AppProvider>.'
    );
  }
  
  return context;
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook for accessing shelf-related state and actions
 */
export const useShelves = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    shelves: state.shelves,
    loading: state.loading.shelves,
    selectedShelf: state.selectedShelf,
    filterOptions: state.filterOptions,
    
    // Actions
    updateShelf: (shelf: Shelf) => dispatch({ type: 'UPDATE_SHELF', payload: shelf }),
    selectShelf: (shelfId: string) => dispatch({ type: 'SELECT_SHELF', payload: shelfId }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTED_SHELF' }),
    setFilter: (key: 'aisle' | 'status', value: string | null) => 
      dispatch({ type: 'SET_FILTER', payload: { key, value } }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' })
  };
};

/**
 * Hook for accessing alert-related state and actions
 */
export const useAlerts = () => {
  const { state, dispatch } = useAppContext();
  
  return {
    alerts: state.alerts,
    loading: state.loading.alerts,
    unacknowledgedAlerts: state.alerts.filter(alert => !alert.acknowledged),
    
    // Actions
    addAlert: (alert: Alert) => dispatch({ type: 'ADD_ALERT', payload: alert }),
    acknowledgeAlert: (alertId: string) => dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId }),
    removeAlert: (alertId: string) => dispatch({ type: 'REMOVE_ALERT', payload: alertId })
  };
};

/**
 * Hook for staff actions
 */
export const useStaffActions = () => {
  const { dispatch } = useAppContext();
  
  return {
    markRestocked: (shelfId: string, productName: string) => 
      dispatch({ type: 'MARK_RESTOCKED', payload: { shelfId, productName } }),
    requestRescan: (shelfId: string) => 
      dispatch({ type: 'REQUEST_RESCAN', payload: shelfId })
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export { AppContext };
export type { AppContextType }; 