/**
 * Real-time object detection using TensorFlow.js COCO-SSD
 * Maps detected objects to shelf locations
 */

import * as tf from '@tensorflow/tfjs';
import { load as loadCocoSsd, ObjectDetection } from '@tensorflow-models/coco-ssd';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface ShelfDetectionResult {
  detectedObjects: DetectedObject[];
  mappedShelf: string | null;
  confidence: number;
  timestamp: string;
}

// Object to shelf mapping
const OBJECT_TO_SHELF_MAP: Record<string, string[]> = {
  // Electronics
  'laptop': ['A1', 'A2'],
  'cell phone': ['A1', 'A2', 'A3'],
  'keyboard': ['A2', 'A3'],
  'mouse': ['A2', 'A3'],
  'remote': ['A4', 'A5'],
  
  // Food items
  'apple': ['B1', 'B2', 'B3'],
  'orange': ['B1', 'B2', 'B3'],
  'banana': ['B1', 'B2'],
  'sandwich': ['B4', 'B5', 'B6'],
  'pizza': ['B4', 'B5'],
  'donut': ['B6'],
  'cake': ['B6'],
  
  // Beverages
  'bottle': ['C1', 'C2', 'C3'],
  'wine glass': ['C1', 'C2'],
  'cup': ['C4', 'C5', 'C6'],
  
  // Personal items
  'handbag': ['D1', 'D2'],
  'suitcase': ['D1', 'D2'],
  'backpack': ['D3', 'D4'],
  'umbrella': ['D5', 'D6'],
  
  // Household
  'book': ['E1', 'E2'],
  'scissors': ['E3', 'E4'],
  'hair dryer': ['E5', 'E6'],
  'toothbrush': ['E5', 'E6']
};

let model: ObjectDetection | null = null;

/**
 * Initialize the COCO-SSD model
 */
export const initializeModel = async (): Promise<boolean> => {
  try {
    if (!model) {
      // Set TensorFlow.js backend
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // Load the COCO-SSD model
      console.log('Loading COCO-SSD model...');
      model = await loadCocoSsd();
      console.log('COCO-SSD model loaded successfully');
    }
    return true;
  } catch (error) {
    console.error('Failed to initialize object detection model:', error);
    return false;
  }
};

/**
 * Detect objects in video element
 */
export const detectObjects = async (
  videoElement: HTMLVideoElement
): Promise<DetectedObject[]> => {
  if (!model) {
    throw new Error('Model not initialized. Call initializeModel() first.');
  }

  try {
    const predictions = await model.detect(videoElement);
    
    // Filter out very low confidence detections but keep reasonable ones
    const filteredPredictions = predictions.filter(prediction => prediction.score > 0.25);
    
    console.log('🤖 COCO-SSD raw detections:', predictions.length, 'filtered:', filteredPredictions.length);
    if (filteredPredictions.length > 0) {
      console.log('✅ Browser detected:', filteredPredictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`).join(', '));
    } else if (predictions.length > 0) {
      console.log('⚠️ Low confidence detections:', predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`).join(', '));
    }
    
    return filteredPredictions.map(prediction => ({
      class: prediction.class,
      score: prediction.score,
      bbox: prediction.bbox
    }));
  } catch (error) {
    console.error('Object detection failed:', error);
    return [];
  }
};

/**
 * Map detected objects to shelf locations
 */
export const mapObjectsToShelf = (objects: DetectedObject[]): ShelfDetectionResult => {
  const timestamp = new Date().toISOString();
  
  // Filter objects with confidence > 60%
  const highConfidenceObjects = objects.filter(obj => obj.score > 0.6);
  
  if (highConfidenceObjects.length === 0) {
    return {
      detectedObjects: objects,
      mappedShelf: null,
      confidence: 0,
      timestamp
    };
  }

  // Find the highest confidence object that we can map to a shelf
  let bestMatch: { shelf: string; confidence: number } | null = null;
  
  for (const obj of highConfidenceObjects) {
    const possibleShelves = OBJECT_TO_SHELF_MAP[obj.class];
    if (possibleShelves && possibleShelves.length > 0) {
      if (!bestMatch || obj.score > bestMatch.confidence) {
        // Pick a random shelf from the possible ones
        const randomShelf = possibleShelves[Math.floor(Math.random() * possibleShelves.length)];
        bestMatch = {
          shelf: randomShelf,
          confidence: obj.score
        };
      }
    }
  }

  return {
    detectedObjects: highConfidenceObjects,
    mappedShelf: bestMatch?.shelf || null,
    confidence: bestMatch?.confidence || 0,
    timestamp
  };
};

/**
 * Get webcam stream
 */
export const getWebcamStream = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment' // Use back camera on mobile if available
      },
      audio: false
    });
    return stream;
  } catch (error) {
    console.error('Failed to get webcam stream:', error);
    throw new Error('Could not access webcam. Please ensure camera permissions are granted.');
  }
};

/**
 * Stop webcam stream
 */
export const stopWebcamStream = (stream: MediaStream): void => {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}; 