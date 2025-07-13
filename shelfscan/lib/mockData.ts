/**
 * Mock Data Generation System for ShelfScan AI
 * Provides realistic retail inventory data for development and demo
 */

import { Shelf, Alert, Product, ScanUpdate, DemoEvent } from './types';

// ============================================================================
// REALISTIC RETAIL DATA CONSTANTS
// ============================================================================

const PRODUCT_NAMES = [
  // Personal Care
  'Dove Soap 100g', 'Colgate Toothpaste', 'Head & Shoulders Shampoo', 'Gillette Razor',
  'Nivea Lotion', 'Oral-B Toothbrush', 'Pantene Conditioner', 'Deodorant Spray',
  
  // Food & Beverages
  'Coca-Cola 12-pack', 'Lay\'s Chips', 'Oreo Cookies', 'Pringles Original',
  'Red Bull Energy', 'Nestle Water 6-pack', 'Kit Kat Bar', 'Doritos Nacho',
  
  // Household
  'Tide Detergent', 'Bounty Paper Towels', 'Charmin Toilet Paper', 'Dawn Dish Soap',
  'Lysol Spray', 'Febreze Air Fresh', 'Glad Trash Bags', 'Swiffer Pads',
  
  // Health & Wellness
  'Tylenol 100ct', 'Vitamin C 60ct', 'Band-Aid Pack', 'Ibuprofen 200mg',
  'Cough Drops', 'Hand Sanitizer', 'First Aid Kit', 'Thermometer',
  
  // Electronics & Accessories
  'Phone Charger', 'AA Batteries 8-pack', 'USB Cable', 'Earbuds',
  'Phone Case', 'Screen Protector', 'Power Bank', 'Car Charger'
];

const AISLE_LETTERS = ['A', 'B', 'C', 'D', 'E'];
const SHELF_NUMBERS = ['1', '2', '3', '4', '5', '6'];

// Standard thresholds based on product type
const PRODUCT_THRESHOLDS = {
  'small': 5,    // Small items like candy, personal care
  'medium': 10,  // Medium items like beverages, chips
  'large': 15,   // Large items like detergent, toilet paper
  'bulk': 20     // Bulk items like water packs
};

// ============================================================================
// CORE DATA GENERATORS
// ============================================================================

/**
 * Generates a random product with realistic name, count, and threshold
 */
function generateRandomProduct(): Product {
  const productName = PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)];
  
  // Determine threshold based on product type (heuristic)
  let threshold = PRODUCT_THRESHOLDS.medium; // default
  if (productName.includes('pack') || productName.includes('Detergent')) {
    threshold = PRODUCT_THRESHOLDS.large;
  } else if (productName.includes('Bar') || productName.includes('Drops')) {
    threshold = PRODUCT_THRESHOLDS.small;
  } else if (productName.includes('6-pack') || productName.includes('12-pack')) {
    threshold = PRODUCT_THRESHOLDS.bulk;
  }
  
  // Generate realistic count (0-30 range with weighted distribution)
  const count = generateRealisticCount(threshold);
  
  return {
    product: productName,
    count,
    threshold
  };
}

/**
 * Generates realistic inventory count with weighted distribution
 */
function generateRealisticCount(threshold: number): number {
  const rand = Math.random();
  
  if (rand < 0.1) return 0; // 10% chance of empty
  if (rand < 0.2) return Math.floor(Math.random() * threshold); // 10% chance of low stock
  if (rand < 0.8) return threshold + Math.floor(Math.random() * 10); // 60% chance of good stock
  return threshold + Math.floor(Math.random() * 20); // 20% chance of overstocked
}

/**
 * Determines shelf status based on product inventory levels
 */
function determineShelfStatus(products: Product[]): 'ok' | 'low' | 'empty' {
  const emptyProducts = products.filter(p => p.count === 0);
  const lowProducts = products.filter(p => p.count > 0 && p.count < p.threshold);
  
  if (emptyProducts.length > 0) return 'empty';
  if (lowProducts.length > 0) return 'low';
  return 'ok';
}

/**
 * Generates a single shelf with realistic data
 */
function generateShelf(id: string, aisle: string): Shelf {
  // Generate 3-6 products per shelf
  const productCount = 3 + Math.floor(Math.random() * 4);
  const products: Product[] = [];
  
  // Ensure unique product names per shelf
  const usedNames = new Set<string>();
  while (products.length < productCount) {
    const product = generateRandomProduct();
    if (!usedNames.has(product.product)) {
      usedNames.add(product.product);
      products.push(product);
    }
  }
  
  const status = determineShelfStatus(products);
  
  // Generate timestamp within last 24 hours
  const hoursAgo = Math.floor(Math.random() * 24);
  const lastScanned = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  
  return {
    id,
    aisle,
    items: products,
    status,
    lastScanned,
    // Use placeholder images for demo (70% of shelves have images)
    imageUrl: Math.random() > 0.3 ? `https://picsum.photos/400/300?random=${id}` : undefined
  };
}

/**
 * Generates the complete set of mock shelves (15 shelves total)
 */
export function generateMockShelves(): Shelf[] {
  const shelves: Shelf[] = [];
  
  // Generate shelves across different aisles
  for (const aisle of AISLE_LETTERS) {
    for (let i = 0; i < 3; i++) { // 3 shelves per aisle
      const shelfNumber = SHELF_NUMBERS[i];
      const shelfId = `${aisle}${shelfNumber}`;
      shelves.push(generateShelf(shelfId, `Aisle ${aisle}`));
    }
  }
  
  // Ensure we have good demo data distribution
  ensureDemoDistribution(shelves);
  
  return shelves;
}

/**
 * Ensures we have a good distribution of shelf statuses for demo
 */
function ensureDemoDistribution(shelves: Shelf[]): void {
  // Force at least 2 empty shelves
  const emptyCount = shelves.filter(s => s.status === 'empty').length;
  if (emptyCount < 2) {
    for (let i = 0; i < 2 - emptyCount && i < shelves.length; i++) {
      const shelf = shelves[i];
      if (shelf.status !== 'empty' && shelf.items.length > 0) {
        shelf.items[0].count = 0;
        shelf.status = determineShelfStatus(shelf.items);
      }
    }
  }
  
  // Force at least 3 low-stock shelves
  const lowCount = shelves.filter(s => s.status === 'low').length;
  if (lowCount < 3) {
    for (let i = 0; i < 3 - lowCount && i < shelves.length; i++) {
      const shelf = shelves[Math.floor(Math.random() * shelves.length)];
      if (shelf.status === 'ok' && shelf.items.length > 0) {
        shelf.items[0].count = Math.floor(shelf.items[0].threshold * 0.5);
        shelf.status = determineShelfStatus(shelf.items);
      }
    }
  }
}

/**
 * Generates alerts based on shelf conditions
 */
export function generateAlertsFromShelves(shelves: Shelf[]): Alert[] {
  const alerts: Alert[] = [];
  
  shelves.forEach(shelf => {
    shelf.items.forEach(product => {
      if (product.count === 0) {
        alerts.push({
          id: `alert-${shelf.id}-${product.product.replace(/\s+/g, '-').toLowerCase()}`,
          shelf: shelf.id,
          product: product.product,
          type: 'empty',
          timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString(),
          acknowledged: Math.random() < 0.3 // 30% chance already acknowledged
        });
      } else if (product.count < product.threshold) {
        alerts.push({
          id: `alert-${shelf.id}-${product.product.replace(/\s+/g, '-').toLowerCase()}`,
          shelf: shelf.id,
          product: product.product,
          type: 'low',
          timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
          acknowledged: Math.random() < 0.2 // 20% chance already acknowledged
        });
      }
    });
  });
  
  return alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Creates a complete mock dataset for the application
 */
export function generateMockData() {
  const shelves = generateMockShelves();
  const alerts = generateAlertsFromShelves(shelves);
  
  return {
    shelves,
    alerts,
    stats: {
      totalShelves: shelves.length,
      okShelves: shelves.filter(s => s.status === 'ok').length,
      lowShelves: shelves.filter(s => s.status === 'low').length,
      emptyShelves: shelves.filter(s => s.status === 'empty').length,
      totalAlerts: alerts.length,
      unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a shelf by ID from the mock data
 */
export function getShelfById(shelves: Shelf[], id: string): Shelf | undefined {
  return shelves.find(shelf => shelf.id === id);
}

/**
 * Filters shelves by status
 */
export function filterShelvesByStatus(shelves: Shelf[], status: 'ok' | 'low' | 'empty'): Shelf[] {
  return shelves.filter(shelf => shelf.status === status);
}

/**
 * Filters shelves by aisle
 */
export function filterShelvesByAisle(shelves: Shelf[], aisle: string): Shelf[] {
  return shelves.filter(shelf => shelf.aisle === aisle);
} 

// ============================================================================
// REAL-TIME SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates a new shelf scan with realistic inventory changes
 */
export function simulateShelfScan(shelf: Shelf): ScanUpdate {
  const updatedItems = shelf.items.map(product => {
    // Simulate natural inventory changes
    let newCount = product.count;
    const changeType = Math.random();
    
    if (changeType < 0.1 && newCount > 0) {
      // 10% chance: Customer purchase (decrease by 1-3)
      newCount = Math.max(0, newCount - (1 + Math.floor(Math.random() * 3)));
    } else if (changeType < 0.15 && newCount === 0) {
      // 5% chance: Restocking occurred (set to threshold + buffer)
      newCount = product.threshold + Math.floor(Math.random() * 10);
    } else if (changeType < 0.18 && newCount < product.threshold) {
      // 3% chance: Partial restock
      newCount = Math.min(product.threshold + 5, newCount + Math.floor(Math.random() * 8));
    }
    
    return {
      ...product,
      count: newCount
    };
  });
  
  return {
    shelf: shelf.id,
    items: updatedItems,
    timestamp: new Date().toISOString()
  };
}

/**
 * Applies a scan update to a shelf and returns the updated shelf
 */
export function applyScanUpdate(shelf: Shelf, update: ScanUpdate): Shelf {
  const updatedShelf: Shelf = {
    ...shelf,
    items: update.items,
    lastScanned: update.timestamp,
    status: determineShelfStatus(update.items)
  };
  
  return updatedShelf;
}

/**
 * Simulates staff restocking a specific product
 */
export function simulateRestockProduct(shelf: Shelf, productName: string, newCount?: number): Shelf {
  const updatedItems = shelf.items.map(product => {
    if (product.product === productName) {
      // If no count specified, restock to threshold + buffer
      const restockedCount = newCount !== undefined 
        ? newCount 
        : product.threshold + Math.floor(Math.random() * 10) + 5;
      
      return {
        ...product,
        count: Math.max(0, restockedCount)
      };
    }
    return product;
  });
  
  return {
    ...shelf,
    items: updatedItems,
    status: determineShelfStatus(updatedItems),
    lastScanned: new Date().toISOString()
  };
}

/**
 * Simulates gradual inventory decrease over time
 */
export function simulateTimeBasedDecrease(shelves: Shelf[], hoursElapsed: number = 1): Shelf[] {
  return shelves.map(shelf => {
    const updatedItems = shelf.items.map(product => {
      // Higher traffic products decrease faster
      const trafficFactor = getProductTrafficFactor(product.product);
      const maxDecrease = Math.floor(trafficFactor * hoursElapsed);
      const decrease = Math.floor(Math.random() * (maxDecrease + 1));
      
      return {
        ...product,
        count: Math.max(0, product.count - decrease)
      };
    });
    
    return {
      ...shelf,
      items: updatedItems,
      status: determineShelfStatus(updatedItems),
      lastScanned: new Date().toISOString()
    };
  });
}

/**
 * Gets traffic factor for different product types
 */
function getProductTrafficFactor(productName: string): number {
  // High traffic items (beverages, snacks) decrease faster
  if (productName.includes('Coca-Cola') || productName.includes('Chips') || 
      productName.includes('Energy') || productName.includes('Cookies')) {
    return 3;
  }
  
  // Medium traffic items (personal care, household)
  if (productName.includes('Soap') || productName.includes('Toothpaste') || 
      productName.includes('Detergent') || productName.includes('Shampoo')) {
    return 2;
  }
  
  // Low traffic items (electronics, health)
  return 1;
}

/**
 * Creates a demo scenario with timed events
 */
export function createDemoScenario(): DemoEvent[] {
  const events: DemoEvent[] = [
    {
      id: 'demo-1',
      delay: 5000, // 5 seconds
      description: 'Customer purchases last Dove Soap from Shelf A1',
      update: {
        shelf: 'A1',
        items: [
          { product: 'Dove Soap 100g', count: 0, threshold: 10 },
          { product: 'Colgate Toothpaste', count: 8, threshold: 10 },
          { product: 'Head & Shoulders Shampoo', count: 12, threshold: 15 }
        ],
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'demo-2',
      delay: 10000, // 10 seconds  
      description: 'Multiple customers buy Red Bull from Shelf B2',
      update: {
        shelf: 'B2',
        items: [
          { product: 'Red Bull Energy', count: 2, threshold: 15 },
          { product: 'Nestle Water 6-pack', count: 18, threshold: 20 },
          { product: 'Kit Kat Bar', count: 6, threshold: 10 }
        ],
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'demo-3',
      delay: 15000, // 15 seconds
      description: 'Staff restocks Dove Soap on Shelf A1',
      update: {
        shelf: 'A1',
        items: [
          { product: 'Dove Soap 100g', count: 15, threshold: 10 },
          { product: 'Colgate Toothpaste', count: 8, threshold: 10 },
          { product: 'Head & Shoulders Shampoo', count: 12, threshold: 15 }
        ],
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'demo-4',
      delay: 20000, // 20 seconds
      description: 'Toilet paper runs completely out on Shelf C3',
      update: {
        shelf: 'C3',
        items: [
          { product: 'Charmin Toilet Paper', count: 0, threshold: 15 },
          { product: 'Bounty Paper Towels', count: 3, threshold: 15 },
          { product: 'Tide Detergent', count: 8, threshold: 15 }
        ],
        timestamp: new Date().toISOString()
      }
    }
  ];
  
  return events;
}

/**
 * Simulates a controlled demo sequence
 */
export function startDemoSimulation(
  onUpdate: (update: ScanUpdate) => void,
  scenario: DemoEvent[] = createDemoScenario()
): () => void {
  const timeouts: NodeJS.Timeout[] = [];
  
  scenario.forEach(event => {
    const timeout = setTimeout(() => {
      console.log(`Demo Event: ${event.description}`);
      onUpdate(event.update);
    }, event.delay);
    
    timeouts.push(timeout);
  });
  
  // Return cleanup function
  return () => {
    timeouts.forEach(timeout => clearTimeout(timeout));
  };
}

/**
 * Generates random scan updates for ongoing simulation
 */
export function generateRandomScanUpdate(shelves: Shelf[]): ScanUpdate | null {
  if (shelves.length === 0) return null;
  
  const randomShelf = shelves[Math.floor(Math.random() * shelves.length)];
  return simulateShelfScan(randomShelf);
}

/**
 * Simulates staff actions (mark restocked, acknowledge alert)
 */
export function simulateStaffAction(
  type: 'restock' | 'acknowledge' | 'rescan',
  targetId: string,
  shelves?: Shelf[]
): { success: boolean; message: string; data?: object } {
  switch (type) {
    case 'restock':
      return {
        success: true,
        message: `Successfully marked ${targetId} as restocked`,
        data: { shelfId: targetId, timestamp: new Date().toISOString() }
      };
      
    case 'acknowledge':
      return {
        success: true,
        message: `Alert ${targetId} acknowledged`,
        data: { alertId: targetId, timestamp: new Date().toISOString() }
      };
      
    case 'rescan':
      if (shelves) {
        const shelf = shelves.find(s => s.id === targetId);
        if (shelf) {
          const scanUpdate = simulateShelfScan(shelf);
          return {
            success: true,
            message: `Rescan completed for shelf ${targetId}`,
            data: scanUpdate
          };
        }
      }
      return {
        success: false,
        message: `Shelf ${targetId} not found for rescan`
      };
      
    default:
      return {
        success: false,
        message: 'Unknown staff action type'
      };
  }
}

// ============================================================================
// DEMO CONTROL FUNCTIONS  
// ============================================================================

/**
 * Creates a manual demo controller for presentations
 */
export function createManualDemoController() {
  let currentStep = 0;
  const scenario = createDemoScenario();
  
  return {
    getNextEvent: () => {
      if (currentStep < scenario.length) {
        return scenario[currentStep++];
      }
      return null;
    },
    
    reset: () => {
      currentStep = 0;
    },
    
    getCurrentStep: () => currentStep,
    
    getTotalSteps: () => scenario.length,
    
    getScenario: () => scenario
  };
}

/**
 * Advanced demo with realistic edge cases
 */
export function createAdvancedDemoScenario(): DemoEvent[] {
  return [
    ...createDemoScenario(),
    {
      id: 'demo-advanced-1',
      delay: 25000,
      description: 'Bulk restocking of multiple items in Aisle D',
      update: {
        shelf: 'D1',
        items: [
          { product: 'AA Batteries 8-pack', count: 25, threshold: 20 },
          { product: 'Phone Charger', count: 18, threshold: 15 },
          { product: 'USB Cable', count: 22, threshold: 15 }
        ],
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'demo-advanced-2', 
      delay: 30000,
      description: 'Rush hour - multiple products hit low stock simultaneously',
      update: {
        shelf: 'E2',
        items: [
          { product: 'Tylenol 100ct', count: 2, threshold: 10 },
          { product: 'Hand Sanitizer', count: 1, threshold: 8 },
          { product: 'Band-Aid Pack', count: 3, threshold: 10 }
        ],
        timestamp: new Date().toISOString()
      }
    }
  ];
} 

// ============================================================================
// TEST UTILITIES & DATA VERIFICATION
// ============================================================================

/**
 * Validates that generated shelves meet requirements
 */
export function validateMockShelves(shelves: Shelf[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalShelves: number;
    statusDistribution: Record<string, number>;
    aisleDistribution: Record<string, number>;
    avgProductsPerShelf: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check total shelf count
  if (shelves.length < 10 || shelves.length > 20) {
    errors.push(`Invalid shelf count: ${shelves.length}. Expected 10-20 shelves.`);
  }
  
  // Check status distribution
  const statusDistribution = shelves.reduce((acc, shelf) => {
    acc[shelf.status] = (acc[shelf.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (!statusDistribution.empty || statusDistribution.empty < 1) {
    warnings.push('No empty shelves found. Demo may be less impactful.');
  }
  
  if (!statusDistribution.low || statusDistribution.low < 2) {
    warnings.push('Fewer than 2 low-stock shelves. Consider adding more for demo variety.');
  }
  
  // Check aisle distribution
  const aisleDistribution = shelves.reduce((acc, shelf) => {
    acc[shelf.aisle] = (acc[shelf.aisle] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Validate shelf IDs are unique
  const shelfIds = shelves.map(s => s.id);
  const uniqueIds = new Set(shelfIds);
  if (shelfIds.length !== uniqueIds.size) {
    errors.push('Duplicate shelf IDs found');
  }
  
  // Validate timestamps
  shelves.forEach((shelf, index) => {
    try {
      new Date(shelf.lastScanned);
    } catch {
      errors.push(`Invalid timestamp for shelf ${shelf.id}`);
    }
  });
  
  // Check products per shelf
  const productsPerShelf = shelves.map(s => s.items.length);
  const avgProductsPerShelf = productsPerShelf.reduce((a, b) => a + b, 0) / shelves.length;
  
  if (avgProductsPerShelf < 3 || avgProductsPerShelf > 7) {
    warnings.push(`Average products per shelf: ${avgProductsPerShelf.toFixed(1)}. Recommended: 3-6.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalShelves: shelves.length,
      statusDistribution,
      aisleDistribution,
      avgProductsPerShelf: Number(avgProductsPerShelf.toFixed(1))
    }
  };
}

/**
 * Validates that generated alerts are consistent with shelf data
 */
export function validateMockAlerts(alerts: Alert[], shelves: Shelf[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalAlerts: number;
    typeDistribution: Record<string, number>;
    acknowledgedCount: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check alert-shelf consistency
  alerts.forEach(alert => {
    const shelf = shelves.find(s => s.id === alert.shelf);
    if (!shelf) {
      errors.push(`Alert ${alert.id} references non-existent shelf ${alert.shelf}`);
      return;
    }
    
    const product = shelf.items.find(p => p.product === alert.product);
    if (!product) {
      errors.push(`Alert ${alert.id} references non-existent product ${alert.product} on shelf ${alert.shelf}`);
      return;
    }
    
    // Validate alert type matches product status
    if (alert.type === 'empty' && product.count !== 0) {
      errors.push(`Empty alert for ${alert.product} but count is ${product.count}`);
    }
    
    if (alert.type === 'low' && (product.count >= product.threshold || product.count === 0)) {
      errors.push(`Low alert for ${alert.product} but count is ${product.count} (threshold: ${product.threshold})`);
    }
  });
  
  // Check alert timestamps
  alerts.forEach(alert => {
    try {
      new Date(alert.timestamp);
    } catch {
      errors.push(`Invalid timestamp for alert ${alert.id}`);
    }
  });
  
  // Check alert ID uniqueness
  const alertIds = alerts.map(a => a.id);
  const uniqueIds = new Set(alertIds);
  if (alertIds.length !== uniqueIds.size) {
    errors.push('Duplicate alert IDs found');
  }
  
  // Calculate statistics
  const typeDistribution = alerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const acknowledgedCount = alerts.filter(a => a.acknowledged).length;
  
  if (acknowledgedCount === alerts.length) {
    warnings.push('All alerts are acknowledged. Consider having some unacknowledged for demo impact.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalAlerts: alerts.length,
      typeDistribution,
      acknowledgedCount
    }
  };
}

/**
 * Validates product data consistency
 */
export function validateProducts(shelves: Shelf[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalProducts: number;
    uniqueProducts: number;
    avgThreshold: number;
    countDistribution: { empty: number; low: number; ok: number; overstocked: number };
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allProducts: Product[] = [];
  
  // Collect all products
  shelves.forEach(shelf => {
    shelf.items.forEach(product => {
      allProducts.push(product);
      
      // Validate product fields
      if (!product.product || product.product.trim() === '') {
        errors.push(`Empty product name found on shelf ${shelf.id}`);
      }
      
      if (product.count < 0) {
        errors.push(`Negative count (${product.count}) for ${product.product} on shelf ${shelf.id}`);
      }
      
      if (product.threshold <= 0) {
        errors.push(`Invalid threshold (${product.threshold}) for ${product.product} on shelf ${shelf.id}`);
      }
      
      if (product.threshold > 50) {
        warnings.push(`High threshold (${product.threshold}) for ${product.product}. Consider reviewing.`);
      }
    });
  });
  
  // Calculate statistics
  const uniqueProductNames = new Set(allProducts.map(p => p.product));
  const avgThreshold = allProducts.reduce((sum, p) => sum + p.threshold, 0) / allProducts.length;
  
  const countDistribution = allProducts.reduce((acc, product) => {
    if (product.count === 0) acc.empty++;
    else if (product.count < product.threshold) acc.low++;
    else if (product.count <= product.threshold + 10) acc.ok++;
    else acc.overstocked++;
    return acc;
  }, { empty: 0, low: 0, ok: 0, overstocked: 0 });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalProducts: allProducts.length,
      uniqueProducts: uniqueProductNames.size,
      avgThreshold: Number(avgThreshold.toFixed(1)),
      countDistribution
    }
  };
}

/**
 * Runs comprehensive validation on the entire mock data system
 */
export function runComprehensiveValidation(): {
  isValid: boolean;
  summary: string;
  details: {
    shelves: ReturnType<typeof validateMockShelves>;
    alerts: ReturnType<typeof validateMockAlerts>;
    products: ReturnType<typeof validateProducts>;
  };
} {
  const mockData = generateMockData();
  
  const shelvesValidation = validateMockShelves(mockData.shelves);
  const alertsValidation = validateMockAlerts(mockData.alerts, mockData.shelves);
  const productsValidation = validateProducts(mockData.shelves);
  
  const totalErrors = shelvesValidation.errors.length + alertsValidation.errors.length + productsValidation.errors.length;
  const totalWarnings = shelvesValidation.warnings.length + alertsValidation.warnings.length + productsValidation.warnings.length;
  
  const isValid = totalErrors === 0;
  
  let summary = `Validation Results: `;
  if (isValid) {
    summary += `✅ PASSED (${totalWarnings} warnings)`;
  } else {
    summary += `❌ FAILED (${totalErrors} errors, ${totalWarnings} warnings)`;
  }
  
  return {
    isValid,
    summary,
    details: {
      shelves: shelvesValidation,
      alerts: alertsValidation,
      products: productsValidation
    }
  };
}

/**
 * Creates a test report for demo preparation
 */
export function generateDemoReport(): {
  timestamp: string;
  dataOverview: Record<string, unknown>;
  demoReadiness: {
    score: number;
    recommendations: string[];
  };
  sampleData: {
    criticalAlerts: Alert[];
    problematicShelves: Shelf[];
    demonstrationFlow: string[];
  };
} {
  const mockData = generateMockData();
  const validation = runComprehensiveValidation();
  
  // Calculate demo readiness score
  let score = 100;
  validation.details.shelves.errors.forEach(() => score -= 10);
  validation.details.alerts.errors.forEach(() => score -= 10);
  validation.details.products.errors.forEach(() => score -= 10);
  validation.details.shelves.warnings.forEach(() => score -= 2);
  validation.details.alerts.warnings.forEach(() => score -= 2);
  validation.details.products.warnings.forEach(() => score -= 2);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (mockData.stats.emptyShelves < 2) {
    recommendations.push('Add more empty shelves for dramatic demo impact');
  }
  
  if (mockData.stats.unacknowledgedAlerts < 3) {
    recommendations.push('Ensure sufficient unacknowledged alerts for staff action demo');
  }
  
  if (mockData.stats.totalAlerts === 0) {
    recommendations.push('CRITICAL: No alerts generated - demo will not be effective');
    score -= 50;
  }
  
  // Sample critical data for demo
  const criticalAlerts = mockData.alerts
    .filter(a => !a.acknowledged && a.type === 'empty')
    .slice(0, 3);
  
  const problematicShelves = mockData.shelves
    .filter(s => s.status !== 'ok')
    .slice(0, 5);
  
  const demonstrationFlow = [
    'Show dashboard overview with mixed shelf statuses',
    'Highlight critical alerts banner',
    'Navigate to specific problematic shelf',
    'Demonstrate staff action (mark restocked)',
    'Show real-time update clearing alert',
    'Display updated dashboard state'
  ];
  
  return {
    timestamp: new Date().toISOString(),
    dataOverview: mockData.stats,
    demoReadiness: {
      score: Math.max(0, score),
      recommendations
    },
    sampleData: {
      criticalAlerts,
      problematicShelves,
      demonstrationFlow
    }
  };
}

/**
 * Quick test function to verify system is working
 */
export function quickSystemTest(): boolean {
  try {
    const mockData = generateMockData();
    const validation = runComprehensiveValidation();
    
    console.log('🧪 Mock Data System Test');
    console.log(`📊 Generated: ${mockData.stats.totalShelves} shelves, ${mockData.stats.totalAlerts} alerts`);
    console.log(`✅ Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    
    if (!validation.isValid) {
      console.log('❌ Errors found:', validation.details.shelves.errors.concat(
        validation.details.alerts.errors,
        validation.details.products.errors
      ));
    }
    
    return validation.isValid;
  } catch (error) {
    console.error('❌ System test failed:', error);
    return false;
  }
}

// Export validation utilities for external testing
export const testUtils = {
  validateMockShelves,
  validateMockAlerts,
  validateProducts,
  runComprehensiveValidation,
  generateDemoReport,
  quickSystemTest
}; 