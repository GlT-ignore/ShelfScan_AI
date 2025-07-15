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

let model: any = null;
let pipeline: any = null;

/**
 * Initialize Hugging Face object detection pipeline
 */
export const initializeHFModel = async (): Promise<boolean> => {
  try {
    if (model && pipeline) return true;

    console.log('🤗 Loading Hugging Face object detection model...');
    
    // Dynamic import to avoid SSR issues
    const { pipeline: createPipeline } = await import('@xenova/transformers');
    
    // Use DETR (Detection Transformer) - highly accurate object detection
    pipeline = await createPipeline('object-detection', 'Xenova/detr-resnet-50', {
      quantized: false, // Higher accuracy
    });
    
    model = pipeline;
    console.log('✅ Hugging Face model loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load Hugging Face model:', error);
    return false;
  }
};

/**
 * Detect objects using Hugging Face model
 */
export const detectObjectsWithHF = async (
  videoElement: HTMLVideoElement
): Promise<HFDetectionResult> => {
  try {
    if (!pipeline) {
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
    
    // Convert canvas to image data for the model
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Run detection
    console.log('🔍 Running Hugging Face detection...');
    const startTime = performance.now();
    
    const results = await pipeline(canvas.toDataURL('image/jpeg', 0.8));
    
    const endTime = performance.now();
    console.log(`⚡ HF Detection completed in ${Math.round(endTime - startTime)}ms`);
    
    // Filter results with good confidence (0.3+ is quite good for DETR)
    const filteredResults = results.filter((result: any) => result.score > 0.3);
    
    console.log(`🎯 HF detected ${filteredResults.length} objects:`, 
      filteredResults.map((r: any) => `${r.label} (${Math.round(r.score * 100)}%)`).join(', ')
    );
    
    return {
      success: true,
      objects: filteredResults.map((result: any) => ({
        label: result.label.toLowerCase(),
        score: result.score,
        box: result.box
      }))
    };
    
  } catch (error) {
    console.error('❌ Hugging Face detection error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Detection failed',
      objects: []
    };
  }
};

/**
 * Convert HF detection format to our standard format
 */
export const convertHFToStandardFormat = (hfObjects: HFDetectedObject[], videoWidth: number, videoHeight: number) => {
  return hfObjects.map(obj => ({
    class: obj.label,
    score: obj.score,
    bbox: [
      obj.box.xmin,
      obj.box.ymin, 
      obj.box.xmax - obj.box.xmin, // width
      obj.box.ymax - obj.box.ymin  // height
    ] as [number, number, number, number]
  }));
};

/**
 * Enhanced detection that tries Hugging Face first, falls back to COCO-SSD
 */
export const detectObjectsEnhancedHF = async (
  videoElement: HTMLVideoElement
): Promise<{
  objects: Array<{ class: string; score: number; bbox?: number[] }>;
  source: 'hugging-face' | 'coco-ssd';
  success: boolean;
  error?: string;
}> => {
  try {
    // Try Hugging Face first
    const hfResult = await detectObjectsWithHF(videoElement);
    
    if (hfResult.success && hfResult.objects.length > 0) {
      const standardObjects = convertHFToStandardFormat(
        hfResult.objects, 
        videoElement.videoWidth, 
        videoElement.videoHeight
      );
      
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
    
    return {
      objects: cocoObjects,
      source: 'coco-ssd',
      success: true
    };
    
  } catch (error) {
    console.error('❌ All detection methods failed:', error);
    
    // Last resort fallback to COCO-SSD
    try {
      const { detectObjects } = await import('./objectDetection');
      const cocoObjects = await detectObjects(videoElement);
      
      return {
        objects: cocoObjects,
        source: 'coco-ssd',
        success: true
      };
    } catch (fallbackError) {
      return {
        objects: [],
        source: 'coco-ssd',
        success: false,
        error: 'All detection methods failed'
      };
    }
  }
}; 