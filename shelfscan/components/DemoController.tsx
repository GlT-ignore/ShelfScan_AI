'use client';

/**
 * Demo Controller Component
 * 
 * Provides controlled demo scenarios to showcase ShelfScan AI features:
 * - Empty shelf detection and alerts
 * - Low stock monitoring
 * - Real-time updates simulation
 * - Alert acknowledgment workflow
 * - Restocking operations
 */

import React, { useState } from 'react';
import { useAppContext } from '../lib/context/AppContext';
import { Shelf, Alert } from '../lib/types';
import { 
  Square, 
  RotateCcw, 
  AlertTriangle,
  Package,
  Clock,
  Zap,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

// ============================================================================
// DEMO SCENARIO TYPES
// ============================================================================

interface DemoStep {
  id: string;
  title: string;
  description: string;
  duration: number;
  action: () => void;
  delay?: number;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  duration: number;
  steps: DemoStep[];
  category: 'inventory' | 'alerts' | 'workflow';
}

// ============================================================================
// DEMO CONTROLLER HOOK
// ============================================================================

const useDemoController = () => {
  const { state, dispatch } = useAppContext();
  const { shelves, alerts } = state;
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [originalState, setOriginalState] = useState<{
    shelves: Shelf[];
    alerts: Alert[];
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulStep, setLastSuccessfulStep] = useState<number>(-1);

  // Helper function to generate demo alert
  const generateDemoAlert = (shelfId: string, product: string, type: 'empty' | 'low'): Alert => ({
    id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    shelf: shelfId,
    product,
    type,
    timestamp: new Date().toISOString(),
    acknowledged: false
  });

  // Helper function to update shelf status with error handling
  const updateShelfStatus = (shelfId: string, updates: Partial<Shelf>) => {
    try {
      const shelf = shelves.find(s => s.id === shelfId);
      if (!shelf) {
        throw new Error(`Shelf with ID ${shelfId} not found`);
      }
      
      const updatedShelf = { 
        ...shelf, 
        ...updates,
        lastScanned: new Date().toISOString()
      };
      dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });
      return true;
    } catch (error) {
      console.error('Error updating shelf status:', error);
      setError(`Failed to update shelf ${shelfId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Error recovery utilities
  const clearError = () => {
    setError(null);
    setIsRecovering(false);
  };

  const safeExecute = async (action: () => void | Promise<void>, actionName: string): Promise<boolean> => {
    try {
      await action();
      return true;
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      setError(`${actionName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Safe state restoration
  const safeRestore = () => {
    try {
      if (originalState) {
        dispatch({ type: 'SET_SHELVES', payload: originalState.shelves });
        dispatch({ type: 'SET_ALERTS', payload: originalState.alerts });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during state restoration:', error);
      setError('Failed to restore original state. Please refresh the page.');
      return false;
    }
  };

  // Enhanced error handling for demo steps
  const executeStepSafely = async (step: DemoStep, stepIndex: number): Promise<boolean> => {
    try {
      setError(null);
      
      // Apply delay if specified
      if (step.delay) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }
      
      // Execute step action with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Step execution timeout')), 10000)
      );
      
      const actionPromise = Promise.resolve(step.action());
      await Promise.race([actionPromise, timeoutPromise]);
      
      setLastSuccessfulStep(stepIndex);
      return true;
    } catch (error) {
      console.error(`Error in step ${stepIndex + 1} (${step.title}):`, error);
      setError(`Step "${step.title}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Demo scenarios configuration
  const scenarios: DemoScenario[] = [
    {
      id: 'empty-shelf-detection',
      title: 'Empty Shelf Detection',
      description: 'Demonstrates how the system detects and alerts for empty shelves',
      duration: 15000,
      category: 'inventory',
      steps: [
        {
          id: 'setup',
          title: 'Initial State',
          description: 'System shows normal inventory levels',
          duration: 2000,
          action: () => {
            // Store original state
            setOriginalState({ shelves: [...shelves], alerts: [...alerts] });
          }
        },
        {
          id: 'empty-products',
          title: 'Products Run Out',
          description: 'Simulating products going out of stock',
          duration: 3000,
          action: () => {
            const targetShelf = shelves[0];
            if (targetShelf) {
              const updatedItems = targetShelf.items.map((item, index) => 
                index < 2 ? { ...item, count: 0 } : item
              );
              updateShelfStatus(targetShelf.id, {
                items: updatedItems,
                status: 'empty'
              });
            }
          }
        },
        {
          id: 'generate-alerts',
          title: 'Alert Generation',
          description: 'System automatically generates empty shelf alerts',
          duration: 2000,
          action: () => {
            const targetShelf = shelves[0];
            if (targetShelf) {
              const emptyProducts = targetShelf.items.filter(item => item.count === 0);
              emptyProducts.forEach(product => {
                const alert = generateDemoAlert(targetShelf.id, product.product, 'empty');
                dispatch({ type: 'ADD_ALERT', payload: alert });
              });
            }
          }
        },
        {
          id: 'acknowledge-alert',
          title: 'Alert Acknowledgment',
          description: 'Staff acknowledges the empty shelf alert',
          duration: 3000,
          delay: 2000,
          action: () => {
            const unacknowledgedAlert = alerts.find(a => !a.acknowledged && a.id.startsWith('demo-'));
            if (unacknowledgedAlert) {
              dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: unacknowledgedAlert.id });
            }
          }
        },
        {
          id: 'restock',
          title: 'Restocking',
          description: 'Products are restocked and system updates',
          duration: 3000,
          action: () => {
            const targetShelf = shelves[0];
            if (targetShelf) {
              const restoredItems = targetShelf.items.map(item => ({
                ...item,
                count: item.count === 0 ? Math.floor(Math.random() * 20) + 10 : item.count
              }));
              updateShelfStatus(targetShelf.id, {
                items: restoredItems,
                status: 'ok'
              });
            }
          }
        },
        {
          id: 'complete',
          title: 'Scenario Complete',
          description: 'Empty shelf detection demo completed successfully',
          duration: 2000,
          action: () => {
            console.log('Demo scenario completed: Empty Shelf Detection');
          }
        }
      ]
    },
    {
      id: 'low-stock-monitoring',
      title: 'Low Stock Monitoring',
      description: 'Shows how the system monitors and alerts for low stock levels',
      duration: 12000,
      category: 'inventory',
      steps: [
        {
          id: 'setup',
          title: 'Normal Operations',
          description: 'System monitoring stock levels',
          duration: 2000,
          action: () => {
            setOriginalState({ shelves: [...shelves], alerts: [...alerts] });
          }
        },
        {
          id: 'gradual-depletion',
          title: 'Stock Depletion',
          description: 'Products gradually reaching low stock thresholds',
          duration: 3000,
          action: () => {
            const targetShelf = shelves[1] || shelves[0];
            if (targetShelf) {
              const updatedItems = targetShelf.items.map(item => ({
                ...item,
                count: Math.floor(item.threshold * 0.8)
              }));
              updateShelfStatus(targetShelf.id, {
                items: updatedItems,
                status: 'low'
              });
            }
          }
        },
        {
          id: 'low-stock-alerts',
          title: 'Low Stock Alerts',
          description: 'System generates low stock warnings',
          duration: 2000,
          action: () => {
            const targetShelf = shelves[1] || shelves[0];
            if (targetShelf) {
              const lowStockItems = targetShelf.items.filter(item => item.count < item.threshold);
              lowStockItems.forEach(product => {
                const alert = generateDemoAlert(targetShelf.id, product.product, 'low');
                dispatch({ type: 'ADD_ALERT', payload: alert });
              });
            }
          }
        },
        {
          id: 'proactive-restock',
          title: 'Proactive Restocking',
          description: 'Staff proactively restocks before items run out',
          duration: 3000,
          action: () => {
            const targetShelf = shelves[1] || shelves[0];
            if (targetShelf) {
              const restoredItems = targetShelf.items.map(item => ({
                ...item,
                count: item.threshold + Math.floor(Math.random() * 10) + 5
              }));
              updateShelfStatus(targetShelf.id, {
                items: restoredItems,
                status: 'ok'
              });
            }
          }
        },
        {
          id: 'complete',
          title: 'Prevention Success',
          description: 'Low stock monitoring prevented empty shelves',
          duration: 2000,
          action: () => {
            console.log('Demo scenario completed: Low Stock Monitoring');
          }
        }
      ]
    },
    {
      id: 'real-time-updates',
      title: 'Real-time Updates',
      description: 'Showcases real-time inventory monitoring capabilities',
      duration: 10000,
      category: 'workflow',
      steps: [
        {
          id: 'setup',
          title: 'Monitoring Active',
          description: 'Real-time monitoring system active',
          duration: 1000,
          action: () => {
            setOriginalState({ shelves: [...shelves], alerts: [...alerts] });
          }
        },
        {
          id: 'multiple-updates',
          title: 'Multiple Shelf Updates',
          description: 'Simulating multiple shelves being scanned simultaneously',
          duration: 4000,
          action: () => {
            // Update multiple shelves with random changes
            shelves.slice(0, 3).forEach((shelf, index) => {
              setTimeout(() => {
                const updatedItems = shelf.items.map(item => ({
                  ...item,
                  count: Math.max(0, item.count + Math.floor(Math.random() * 6) - 3)
                }));
                const newStatus = updatedItems.some(item => item.count === 0) ? 'empty' :
                                 updatedItems.some(item => item.count < item.threshold) ? 'low' : 'ok';
                updateShelfStatus(shelf.id, {
                  items: updatedItems,
                  status: newStatus
                });
              }, index * 800);
            });
          }
        },
        {
          id: 'instant-alerts',
          title: 'Instant Alerting',
          description: 'System immediately alerts on critical changes',
          duration: 2000,
          action: () => {
            // Generate alerts for any critical changes
            const criticalShelves = shelves.filter(shelf => 
              shelf.status === 'empty' || shelf.status === 'low'
            );
            criticalShelves.forEach(shelf => {
              const criticalItems = shelf.items.filter(item => 
                item.count === 0 || item.count < item.threshold
              );
              criticalItems.forEach(item => {
                const alert = generateDemoAlert(
                  shelf.id, 
                  item.product, 
                  item.count === 0 ? 'empty' : 'low'
                );
                dispatch({ type: 'ADD_ALERT', payload: alert });
              });
            });
          }
        },
        {
          id: 'dashboard-sync',
          title: 'Dashboard Sync',
          description: 'All changes instantly reflected in dashboard',
          duration: 2000,
          action: () => {
            console.log('Real-time sync demonstration active');
          }
        },
        {
          id: 'complete',
          title: 'Real-time Demo Complete',
          description: 'Real-time capabilities successfully demonstrated',
          duration: 1000,
          action: () => {
            console.log('Demo scenario completed: Real-time Updates');
          }
        }
      ]
    }
  ];

  // Enhanced reset demo state with error handling
  const resetDemo = () => {
    try {
      setIsRunning(false);
      setCurrentScenario(null);
      setCurrentStep(0);
      setProgress(0);
      setRetryCount(0);
      setLastSuccessfulStep(-1);
      clearError();
      
      if (originalState) {
        const restored = safeRestore();
        if (restored) {
          setOriginalState(null);
        }
      }
    } catch (error) {
      console.error('Error during demo reset:', error);
      setError('Failed to reset demo completely. Some state may not be restored.');
    }
  };

  // Retry failed demo from last successful step
  const retryFromLastStep = async () => {
    if (!currentScenario || retryCount >= 3) {
      setError('Maximum retry attempts reached. Please reset the demo.');
      return;
    }

    const scenario = scenarios.find(s => s.id === currentScenario);
    if (!scenario) return;

    setIsRecovering(true);
    setRetryCount(prev => prev + 1);
    clearError();

    try {
      // Continue from last successful step + 1
      const startFrom = Math.max(0, lastSuccessfulStep + 1);
      await continueScenario(scenario, startFrom);
    } catch (error) {
      console.error('Error during retry:', error);
      setError('Retry failed. Please reset the demo.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Continue scenario from specific step
  const continueScenario = async (scenario: DemoScenario, startFrom: number = 0) => {
    let totalElapsed = 0;
    
    // Calculate elapsed time for steps before startFrom
    for (let i = 0; i < startFrom; i++) {
      const step = scenario.steps[i];
      totalElapsed += (step.delay || 0) + step.duration;
    }

    for (let i = startFrom; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      setCurrentStep(i);
      
      const success = await executeStepSafely(step, i);
      if (!success) {
        // Handle step failure
        if (retryCount < 3) {
          setError(`${step.title} failed. You can retry from this step.`);
        } else {
          setError('Multiple failures detected. Please reset the demo.');
        }
        return false;
      }
      
      // Wait for step duration
      await new Promise(resolve => setTimeout(resolve, step.duration));
      totalElapsed += step.duration;
      
      // Update progress
      setProgress((totalElapsed / scenario.duration) * 100);
    }

    return true;
  };

  // Enhanced run scenario with comprehensive error handling
  const runScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || isRunning) return;

    try {
      // Initialize demo state
      setIsRunning(true);
      setCurrentScenario(scenarioId);
      setCurrentStep(0);
      setProgress(0);
      setRetryCount(0);
      setLastSuccessfulStep(-1);
      clearError();

      // Store original state safely
      const stateBackup = await safeExecute(() => {
        setOriginalState({ shelves: [...shelves], alerts: [...alerts] });
      }, 'State backup');

      if (!stateBackup) {
        setError('Failed to backup current state. Demo cancelled for safety.');
        resetDemo();
        return;
      }

      // Execute scenario
      const success = await continueScenario(scenario, 0);

      if (success) {
        // Auto-reset after successful completion
        setTimeout(() => {
          setIsRunning(false);
          setCurrentScenario(null);
          setCurrentStep(0);
          setProgress(0);
          setLastSuccessfulStep(-1);
        }, 2000);
      }
      // If not successful, leave demo in current state for potential retry

    } catch (error) {
      console.error('Critical error in demo scenario:', error);
      setError(`Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Attempt emergency reset
      try {
        resetDemo();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_resetError) {
        setError('Critical failure: Unable to reset demo state. Please refresh the page.');
      }
    }
  };

  return {
    scenarios,
    isRunning,
    currentScenario,
    currentStep,
    progress,
    isVisible,
    setIsVisible,
    runScenario,
    resetDemo,
    error,
    isRecovering,
    retryCount,
    lastSuccessfulStep,
    clearError,
    retryFromLastStep
  };
};

// ============================================================================
// DEMO CONTROLLER COMPONENT
// ============================================================================

const DemoController: React.FC = () => {
  const {
    scenarios,
    isRunning,
    currentScenario,
    currentStep,
    progress,
    isVisible,
    setIsVisible,
    runScenario,
    resetDemo,
    error,
    isRecovering,
    retryCount,
    lastSuccessfulStep,
    clearError,
    retryFromLastStep
  } = useDemoController();

  const currentScenarioData = scenarios.find(s => s.id === currentScenario);
  const currentStepData = currentScenarioData?.steps[currentStep];

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg 
                 hover:bg-blue-700 transition-colors touch-manipulation"
        aria-label="Show demo controls"
      >
        <Eye size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border-2 border-gray-200 p-4 max-w-sm 
                   animate-fadeIn hover-lift transition-all duration-300 animate-float">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          <h3 className="font-bold text-gray-900">Demo Control</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Hide demo controls"
        >
          <EyeOff size={16} />
        </button>
      </div>

      {/* ERROR STATE DISPLAY */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border-2 border-red-200 animate-slideInDown">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-red-900 text-sm mb-1">
                Demo Error
              </div>
              <div className="text-xs text-red-700 mb-2">
                {error}
              </div>
              {retryCount > 0 && (
                <div className="text-xs text-red-600 mb-2">
                  Retry attempt: {retryCount}/3
                </div>
              )}
              <div className="flex gap-2">
                {retryCount < 3 && lastSuccessfulStep >= 0 && (
                  <button
                    onClick={retryFromLastStep}
                    disabled={isRecovering}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 
                             rounded text-xs hover:bg-yellow-200 disabled:opacity-50 
                             transition-colors touch-manipulation"
                  >
                    <RotateCcw size={12} className={isRecovering ? 'animate-spin' : ''} />
                    <span>{isRecovering ? 'Retrying...' : 'Retry'}</span>
                  </button>
                )}
                <button
                  onClick={clearError}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 
                           rounded text-xs hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  <X size={12} />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CURRENT SCENARIO STATUS */}
      {isRunning && currentScenarioData && currentStepData && !error && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="font-medium text-blue-900 text-sm mb-1">
            {currentScenarioData.title}
          </div>
          <div className="text-xs text-blue-700 mb-2">
            Step {currentStep + 1}: {currentStepData.title}
          </div>
          <div className="text-xs text-blue-600 mb-2">
            {currentStepData.description}
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* RECOVERY STATUS */}
      {isRecovering && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-yellow-600 animate-spin" />
            <div>
              <div className="font-medium text-yellow-900 text-sm">
                Attempting Recovery
              </div>
              <div className="text-xs text-yellow-700">
                Retrying from step {lastSuccessfulStep + 2}...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCENARIO BUTTONS */}
      {!isRunning && (
        <div className="space-y-2 mb-4">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => runScenario(scenario.id)}
              className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 
                       hover:bg-blue-50 transition-all duration-200 touch-manipulation group"
            >
              <div className="flex items-start gap-2">
                {scenario.category === 'inventory' && <Package size={16} className="text-orange-600 mt-0.5" />}
                {scenario.category === 'alerts' && <AlertTriangle size={16} className="text-red-600 mt-0.5" />}
                {scenario.category === 'workflow' && <Clock size={16} className="text-green-600 mt-0.5" />}
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 group-hover:text-blue-900">
                    {scenario.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {scenario.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Duration: {scenario.duration / 1000}s
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ENHANCED CONTROL BUTTONS */}
      <div className="flex gap-2">
        {isRunning && !error ? (
          <button
            onClick={resetDemo}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white 
                     rounded-lg hover:bg-red-700 transition-colors text-sm font-medium touch-manipulation"
          >
            <Square size={14} />
            <span>Stop Demo</span>
          </button>
        ) : error ? (
          <div className="flex gap-2 w-full">
            {retryCount < 3 && lastSuccessfulStep >= 0 && (
              <button
                onClick={retryFromLastStep}
                disabled={isRecovering}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white 
                         rounded-lg hover:bg-orange-700 disabled:bg-orange-400 transition-colors text-sm font-medium 
                         touch-manipulation"
              >
                <RotateCcw size={14} className={isRecovering ? 'animate-spin' : ''} />
                <span>{isRecovering ? 'Retrying...' : 'Retry Demo'}</span>
              </button>
            )}
            <button
              onClick={resetDemo}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white 
                       rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium touch-manipulation"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        ) : (
          <button
            onClick={resetDemo}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white 
                     rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium touch-manipulation"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DemoController; 