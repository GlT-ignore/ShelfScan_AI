'use client';

/**
 * Webcam-based shelf detection component
 * Uses TensorFlow.js COCO-SSD for real-time object detection
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Square, X, Zap, AlertCircle } from 'lucide-react';
import { useAppContext } from '../lib/context/AppContext';
import {
  initializeModel,
  mapObjectsToShelf,
  getWebcamStream,
  stopWebcamStream,
  type DetectedObject,
  type ShelfDetectionResult
} from '../lib/camera/objectDetection';
import { detectObjectsEnhancedHF, initializeHFModel } from '../lib/camera/huggingFaceDetection';

interface WebcamShelfDetectorProps {
  isOpen: boolean;
  onClose: () => void;
  targetShelfId?: string; // For specific shelf rescanning
  isModelPreloaded?: boolean; // Whether model is already loaded
}

interface DetectedProduct {
  product: string;
  count: number;
  threshold: number;
}

const WebcamShelfDetector: React.FC<WebcamShelfDetectorProps> = ({ isOpen, onClose, targetShelfId, isModelPreloaded = false }) => {
  const { state, dispatch } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Component state
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<ShelfDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [detectionSource, setDetectionSource] = useState<'hugging-face' | 'coco-ssd' | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await getWebcamStream();
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start webcam');
    }
  };

  const initializeModelAsync = useCallback(async () => {
    setIsInitializing(true);
    setError(null);
    
    try {
      // Initialize both Hugging Face and COCO-SSD models
      console.log('🚀 Initializing AI models...');
      const [hfSuccess, cocoSuccess] = await Promise.all([
        initializeHFModel(),
        initializeModel()
      ]);
      
      if (hfSuccess || cocoSuccess) {
        setIsModelLoaded(true);
        console.log('✅ AI models initialized:', { 
          huggingFace: hfSuccess, 
          cocoSSD: cocoSuccess 
        });
        await startWebcam();
      } else {
        setError('Failed to load AI models');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize camera');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Initialize model on component mount
  useEffect(() => {
    if (isOpen) {
      if (isModelPreloaded && !isModelLoaded) {
        // Model is preloaded, just start webcam
        setIsModelLoaded(true);
      } else if (!isModelLoaded && !isInitializing) {
        // Model not preloaded, initialize it
        initializeModelAsync();
      }
    }
  }, [isOpen, isModelLoaded, isInitializing, isModelPreloaded, initializeModelAsync]);

  // Auto-start webcam when model is loaded and modal is open
  useEffect(() => {
    if (isOpen && isModelLoaded && !streamRef.current) {
      startWebcam();
    }
  }, [isOpen, isModelLoaded]);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      stopWebcamStream(streamRef.current);
      streamRef.current = null;
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    setIsDetecting(false);
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [isOpen, stopWebcam]);

  const runDetection = async () => {
    if (!videoRef.current || !isModelLoaded) return;

    try {
      // Use enhanced detection with Hugging Face primary, COCO-SSD fallback
      console.log('🔍 Starting enhanced AI detection...');
      const enhancedResult = await detectObjectsEnhancedHF(videoRef.current);
      
      setDetectionSource(enhancedResult.source);
      
      // Convert to DetectedObject format
      const detectedObjects: DetectedObject[] = enhancedResult.objects.map(obj => ({
        class: obj.class,
        score: obj.confidence,
        bbox: (obj.box && obj.box.length >= 4 ? 
          [obj.box[0], obj.box[1], obj.box[2] - obj.box[0], obj.box[3] - obj.box[1]] : 
          [0, 0, 100, 100]) as [number, number, number, number]
      }));
      
      const result = mapObjectsToShelf(detectedObjects);
      
      setLastDetection(result);
      
      // Draw detection results on canvas
      drawDetections(detectedObjects);
      
      // Update shelf if detection found OR if we're targeting a specific shelf
      // Lowered confidence threshold for better detection
      if ((result.mappedShelf && result.confidence > 0.3) || targetShelfId) {
        updateShelfFromDetection(result);
      }
      
      // Debug: Log all detected objects regardless of confidence
      if (enhancedResult.objects.length > 0) {
        console.log('🔍 Detected objects:', enhancedResult.objects.map(obj => 
          `${obj.class} (${Math.round(obj.confidence * 100)}%)`
        ).join(', '));
      }
      
    } catch (err) {
      console.error('Detection error:', err);
      setError(err instanceof Error ? err.message : 'Detection failed');
    }
  };

  const drawDetections = (objects: DetectedObject[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bounding boxes
    objects.forEach(obj => {
      if (obj.score > 0.6) {
        const [x, y, width, height] = obj.bbox;
        
        // Draw bounding box
        ctx.strokeStyle = obj.score > 0.8 ? '#10B981' : '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        ctx.fillStyle = obj.score > 0.8 ? '#10B981' : '#F59E0B';
        ctx.font = '14px Arial';
        const label = `${obj.class} (${Math.round(obj.score * 100)}%)`;
        ctx.fillText(label, x, y - 5);
      }
    });
  };

  const updateShelfFromDetection = (result: ShelfDetectionResult) => {
    // If we have a target shelf, always update that shelf regardless of detection
    const shelfToUpdate = targetShelfId 
      ? state.shelves.find(s => s.id === targetShelfId)
      : state.shelves.find(s => s.id === result.mappedShelf);
    
    if (!shelfToUpdate) return;

    // For targeted rescans, simulate inventory changes based on detection
    let updatedItems = shelfToUpdate.items;
    if (targetShelfId && result.detectedObjects.length > 0) {
      // Simulate finding products based on detected objects
      updatedItems = shelfToUpdate.items.map(item => ({
        ...item,
        count: Math.max(0, item.count + Math.floor(Math.random() * 3) - 1) // Simulate inventory change
      }));
    }

    const updatedShelf = {
      ...shelfToUpdate,
      items: updatedItems,
      lastScanned: result.timestamp,
      imageUrl: `data:image/png;base64,webcam-${Date.now()}`,
      status: targetShelfId ? 
        (updatedItems.some(item => item.count === 0) ? 'empty' as const :
         updatedItems.some(item => item.count < item.threshold) ? 'low' as const : 'ok' as const) :
        shelfToUpdate.status
    };
    
    dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });
    
    const detectedObject = result.detectedObjects[0]?.class || 'objects';
    const targetInfo = targetShelfId ? ` (targeting shelf ${targetShelfId})` : '';
    console.log(`Detected ${detectedObject} → Updated shelf ${updatedShelf.id}${targetInfo}`);
  };

  const toggleDetection = () => {
    if (isDetecting) {
      // Stop detection
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setIsDetecting(false);
    } else {
      // Start detection
      setIsDetecting(true);
      detectionIntervalRef.current = setInterval(runDetection, 2000); // Every 2 seconds
    }
  };

  const manualDetect = () => {
    runDetection();
  };

  const updateTargetShelfWithDetection = () => {
    if (!targetShelfId || !lastDetection || lastDetection.detectedObjects.length === 0) return;
    
    const shelfToUpdate = state.shelves.find(s => s.id === targetShelfId);
    if (!shelfToUpdate) return;

    // Convert detected objects to products
    const detectedProducts = lastDetection.detectedObjects.reduce((acc, obj) => {
      const existingProduct = acc.find(p => p.product.toLowerCase().includes(obj.class.toLowerCase()));
      if (existingProduct) {
        existingProduct.count += 1;
      } else {
        acc.push({
          product: obj.class.charAt(0).toUpperCase() + obj.class.slice(1),
          count: 1,
          threshold: 5
        });
      }
      return acc;
    }, [] as DetectedProduct[]);

    // Merge with existing products or replace if detected products exist
    const updatedItems = [...shelfToUpdate.items];
    detectedProducts.forEach(detectedProduct => {
      const existingIndex = updatedItems.findIndex(item => 
        item.product.toLowerCase().includes(detectedProduct.product.toLowerCase())
      );
      if (existingIndex >= 0) {
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          count: detectedProduct.count
        };
      } else {
        updatedItems.push(detectedProduct);
      }
    });

    const updatedShelf = {
      ...shelfToUpdate,
      items: updatedItems,
      lastScanned: new Date().toISOString(),
      imageUrl: `data:image/png;base64,webcam-${Date.now()}`,
      status: updatedItems.some(item => item.count === 0) ? 'empty' as const :
               updatedItems.some(item => item.count < item.threshold) ? 'low' as const : 'ok' as const
    };
    
    dispatch({ type: 'UPDATE_SHELF', payload: updatedShelf });
    console.log(`Updated shelf ${targetShelfId} with detected objects:`, detectedProducts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">
              {targetShelfId ? `Rescanning Shelf ${targetShelfId}` : 'Live Shelf Detection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {isInitializing && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading AI models...</p>
              <p className="text-sm text-gray-500 mt-2">🤗 Hugging Face + COCO-SSD</p>
            </div>
          )}

          {isModelLoaded && !error && (
            <div className="space-y-4">
              {/* Target Shelf Info */}
              {targetShelfId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800 text-sm font-medium">
                    Focused on Shelf {targetShelfId} - Point camera at products to update inventory
                  </span>
                </div>
              )}
              {/* Video Feed */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-auto max-h-96 object-cover"
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  width={640}
                  height={480}
                />
                
                {/* Detection Status Overlay */}
                {isDetecting && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Detecting...
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                <button
                  onClick={toggleDetection}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isDetecting
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  {isDetecting ? 'Stop Detection' : 'Start Auto Detection'}
                </button>
                
                <button
                  onClick={manualDetect}
                  disabled={isDetecting}
                  className="py-3 px-4 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Detect Now
                </button>

                {targetShelfId && lastDetection && lastDetection.detectedObjects.length > 0 && (
                  <button
                    onClick={updateTargetShelfWithDetection}
                    className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Update Shelf
                  </button>
                )}
              </div>

              {/* Detection Source Indicator */}
              {detectionSource && (
                <div className={`p-3 rounded-lg text-sm ${
                  detectionSource === 'hugging-face' 
                    ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      detectionSource === 'hugging-face' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <span className="font-medium">
                      {detectionSource === 'hugging-face' 
                        ? '🤗 AI-Powered Detection (Hugging Face)' 
                        : '⚡ Basic Detection (COCO-SSD)'}
                    </span>
                  </div>
                  {detectionSource === 'coco-ssd' && (
                    <p className="mt-1 text-xs">
                      Using fallback detection. Hugging Face model may still be loading.
                    </p>
                  )}
                </div>
              )}

              {/* Detection Results */}
              {lastDetection && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {targetShelfId ? `Scanning Shelf ${targetShelfId}:` : 'Last Detection:'}
                  </h3>
                  
                  {lastDetection.detectedObjects.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {lastDetection.detectedObjects.map((obj, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                          >
                            {obj.class} ({Math.round(obj.score * 100)}%)
                          </span>
                        ))}
                      </div>
                      
                      {lastDetection.mappedShelf && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-green-800 font-medium">
                            📍 Mapped to Shelf: {lastDetection.mappedShelf}
                          </p>
                          <p className="text-green-600 text-sm">
                            Confidence: {Math.round(lastDetection.confidence * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">No objects detected</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamShelfDetector; 