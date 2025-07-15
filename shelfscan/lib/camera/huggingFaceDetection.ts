/**
 * Hugging Face Object Detection - High accuracy browser-based detection
 * Uses pre-trained models that run directly in the browser
 */

export interface HFDetectedObject {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface HFDetectionResult {
  objects: HFDetectedObject[];
  success: boolean;
  error?: string;
}

interface HFPipeline {
  (input: string | HTMLCanvasElement): Promise<HFModelResult[]>;
}

interface HFModelResult {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

// Transformers module interface for proper typing
interface TransformersModule {
  pipeline: (task: string, model?: string, options?: { 
    quantized?: boolean; 
    device?: string; 
  }) => Promise<HFPipeline>;
}

// Global pipeline cache
let globalPipeline: HFPipeline | null = null;

// ============================================================================
// HUGGING FACE MODEL INITIALIZATION
// ============================================================================

/**
 * Initialize Hugging Face object detection model
 * Uses DETR (DEtection TRansformer) for high accuracy
 */
export const initializeHFModel = async (): Promise<boolean> => {
  if (globalPipeline) {
    console.log('🎯 Hugging Face model already initialized');
    return true;
  }

  try {
    console.log('🤖 Loading Hugging Face Transformers...');
    
    // Dynamic import with proper typing
    const { pipeline } = await import('@xenova/transformers') as TransformersModule;
    
    console.log('📦 Initializing DETR object detection model...');
    globalPipeline = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
      quantized: true,
      device: 'webgpu',
    });
    
    console.log('✅ Hugging Face model initialized successfully!');
    return true;
    
  } catch (error: unknown) {
    console.error('❌ Failed to initialize Hugging Face model:', error);
    globalPipeline = null;
    return false;
  }
};

// ============================================================================
// DETECTION FUNCTION
// ============================================================================

/**
 * Enhanced object detection using Hugging Face DETR model
 * More accurate than COCO-SSD for retail scenarios
 */
export const detectObjectsHF = async (videoElement: HTMLVideoElement): Promise<HFDetectionResult> => {
  try {
    if (!globalPipeline) {
      throw new Error('Hugging Face model not initialized');
    }

    // Capture frame from video
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }
    
    ctx.drawImage(videoElement, 0, 0);
    
    // Run detection
    console.log('🔍 Running Hugging Face detection...');
    const startTime = performance.now();
    
    const results = await globalPipeline(canvas.toDataURL('image/jpeg', 0.8));
    
    const endTime = performance.now();
    console.log(`⚡ HF Detection completed in ${Math.round(endTime - startTime)}ms`);
    
    // Filter results with good confidence (0.3+ is quite good for DETR)
    const filteredResults = results.filter((result: HFModelResult) => result.score > 0.3);
    
    console.log(`🎯 HF detected ${filteredResults.length} objects:`, 
      filteredResults.map((r: HFModelResult) => `${r.label} (${Math.round(r.score * 100)}%)`).join(', ')
    );
    
    return {
      success: true,
      objects: filteredResults.map((result: HFModelResult) => ({
        label: result.label.toLowerCase(),
        score: result.score,
        box: result.box
      }))
    };
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Hugging Face detection failed:', errorMessage);
    
    return {
      success: false,
      objects: [],
      error: errorMessage
    };
  }
};

// ============================================================================
// ENHANCED DETECTION WITH FALLBACK
// ============================================================================

/**
 * Enhanced detection that combines HF and COCO-SSD for maximum reliability
 */
export const detectObjectsEnhancedHF = async (videoElement: HTMLVideoElement): Promise<{
  objects: Array<{ class: string; confidence: number; box: [number, number, number, number] }>;
  source: 'hugging-face' | 'coco-ssd';
  success: boolean;
}> => {
  try {
    // Try Hugging Face first for better accuracy
    const hfResult = await detectObjectsHF(videoElement);
    
    // Convert HF format to standard format for compatibility
    const convertHFToStandardFormat = (hfObjects: HFDetectedObject[]) => {
      return hfObjects.map(obj => ({
        class: obj.label,
        confidence: obj.score,
        box: [obj.box.xmin, obj.box.ymin, obj.box.xmax, obj.box.ymax] as [number, number, number, number]
      }));
    };
    
    if (hfResult.success && hfResult.objects.length > 0) {
      const standardObjects = convertHFToStandardFormat(hfResult.objects);
      
      return {
        objects: standardObjects,
        source: 'hugging-face',
        success: true
      };
    }
    
    // Fallback to COCO-SSD if HF fails or finds nothing
    console.log('🔄 Falling back to COCO-SSD...');
    const { detectObjects } = await import('./objectDetection');
    const cocoObjects = await detectObjects(videoElement);
    
    // Convert COCO-SSD format to our expected format
    const convertedCocoObjects = cocoObjects.map(obj => ({
      class: obj.class,
      confidence: obj.score,
      box: [obj.bbox[0], obj.bbox[1], obj.bbox[0] + obj.bbox[2], obj.bbox[1] + obj.bbox[3]] as [number, number, number, number]
    }));
    
    return {
      objects: convertedCocoObjects,
      source: 'coco-ssd',
      success: true
    };
    
  } catch (error: unknown) {
    console.error('❌ All detection methods failed:', error);
    
    // Last resort fallback to COCO-SSD
    try {
      const { detectObjects } = await import('./objectDetection');
      const cocoObjects = await detectObjects(videoElement);
      
      // Convert COCO-SSD format to our expected format
      const convertedCocoObjects = cocoObjects.map(obj => ({
        class: obj.class,
        confidence: obj.score,
        box: [obj.bbox[0], obj.bbox[1], obj.bbox[0] + obj.bbox[2], obj.bbox[1] + obj.bbox[3]] as [number, number, number, number]
      }));
      
      return {
        objects: convertedCocoObjects,
        source: 'coco-ssd',
        success: true
      };
    } catch (fallbackError: unknown) {
      const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
      console.error('❌ Complete detection failure:', errorMessage);
      
      return {
        objects: [],
        source: 'coco-ssd',
        success: false
      };
    }
  }
}; 