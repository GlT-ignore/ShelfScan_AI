/**
 * Core data model interfaces for ShelfScan AI
 * These interfaces define the structure of data throughout the application
 */

// ============================================================================
// CORE DATA MODELS
// ============================================================================

/**
 * Represents a product on a shelf with inventory count and threshold
 */
export interface Product {
  /** Name or identifier of the product */
  product: string;
  /** Current quantity count detected by drone scan */
  count: number;
  /** Minimum quantity threshold before triggering low stock alert */
  threshold: number;
}

/**
 * Represents a store shelf with its current inventory status
 */
export interface Shelf {
  /** Unique identifier for the shelf (e.g., "A3", "B1") */
  id: string;
  /** Aisle designation where the shelf is located */
  aisle: string;
  /** Array of products currently on this shelf */
  items: Product[];
  /** Current status based on product counts vs thresholds */
  status: 'ok' | 'low' | 'empty';
  /** ISO timestamp of the last drone scan */
  lastScanned: string;
  /** Optional URL to shelf image from drone camera */
  imageUrl?: string;
}

/**
 * Represents an alert for low stock or empty shelf conditions
 */
export interface Alert {
  /** Unique identifier for the alert */
  id: string;
  /** Shelf ID where the alert originated */
  shelf: string;
  /** Product name that triggered the alert */
  product: string;
  /** Type of alert condition */
  type: 'low' | 'empty';
  /** ISO timestamp when alert was generated */
  timestamp: string;
  /** Whether staff has acknowledged this alert */
  acknowledged: boolean;
}

// ============================================================================
// APPLICATION STATE MODELS
// ============================================================================

/**
 * Global application state structure
 */
export interface AppState {
  /** Array of all shelves in the store */
  shelves: Shelf[];
  /** Array of current active alerts */
  alerts: Alert[];
  /** Loading states for different operations */
  loading: {
    shelves: boolean;
    alerts: boolean;
  };
  /** Error message if any operation fails */
  error: string | null;
  /** Currently selected shelf for detail view */
  selectedShelf: string | null;
  /** Filter options for dashboard views */
  filterOptions: {
    aisle: string | null;
    status: ('ok' | 'low' | 'empty') | null;
  };
}

// ============================================================================
// ACTION TYPES FOR STATE MANAGEMENT
// ============================================================================

/**
 * Action types for reducer pattern state management
 */
export type ActionType =
  // Shelf data actions
  | { type: 'FETCH_SHELVES_START' }
  | { type: 'FETCH_SHELVES_SUCCESS'; payload: Shelf[] }
  | { type: 'FETCH_SHELVES_ERROR'; payload: string }
  | { type: 'UPDATE_SHELF'; payload: Shelf }
  | { type: 'SET_SHELVES'; payload: Shelf[] }
  
  // Alert data actions
  | { type: 'FETCH_ALERTS_START' }
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
  | { type: 'REQUEST_RESCAN'; payload: string };

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Scan update data format received from drone/backend
 */
export interface ScanUpdate {
  shelf: string;
  items: Product[];
  timestamp: string;
}

/**
 * Demo simulation event for controlled scenarios
 */
export interface DemoEvent {
  id: string;
  delay: number; // milliseconds from start
  update: ScanUpdate;
  description: string;
}

/**
 * Staff action result for marking restocked or requesting rescans
 */
export interface StaffActionResult {
  success: boolean;
  message: string;
  shelfId: string;
  timestamp: string;
} 