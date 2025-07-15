/**
 * Google Vision API integration for high-accuracy object detection
 * Much more accurate than browser-based COCO-SSD
 */

export interface GoogleVisionObject {
  name: string;
  score: number;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

export interface GoogleVisionResult {
  objects: GoogleVisionObject[];
  success: boolean;
  error?: string;
}

interface GoogleVisionApiObject {
  name: string;
  score: number;
  boundingPoly?: {
    vertices: Array<{ x: number; y: number }>;
  };
}

interface GoogleVisionApiResponse {
  responses?: Array<{
    localizedObjectAnnotations?: GoogleVisionApiObject[];
    error?: {
      message: string;
    };
  }>;
}

interface TokenResponse {
  access_token: string;
}

/**
 * Convert video frame to base64 image for API
 */
export const captureVideoFrame = (videoElement: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  if (ctx) {
    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Remove data:image/jpeg;base64, prefix
  }
  
  throw new Error('Could not capture video frame');
};

/**
 * Get access token using service account credentials
 */
const getAccessToken = async (): Promise<string | null> => {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      console.log('Service account credentials not found, checking for API key...');
      return null;
    }

    // Create JWT for service account authentication
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-vision',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Note: In a real production app, you'd use a proper JWT library
    // For this demo, we'll use a simplified approach
    const { sign } = await import('jsonwebtoken');
    const jwt = sign(payload, privateKey, { algorithm: 'RS256', header });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData: TokenResponse = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.warn('Service account auth failed:', error);
    return null;
  }
};

/**
 * Detect objects using Google Vision API
 */
export const detectObjectsWithGoogleVision = async (
  base64Image: string,
  apiKey?: string
): Promise<GoogleVisionResult> => {
  try {
    let authHeader = '';
    let url = '';

    // Try service account authentication first
    const accessToken = await getAccessToken();
    if (accessToken) {
      authHeader = `Bearer ${accessToken}`;
      url = 'https://vision.googleapis.com/v1/images:annotate';
    } else if (apiKey) {
      // Fallback to API key
      url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    } else {
      throw new Error('No authentication method available');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 20,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vision API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 403) {
        throw new Error(`Google Vision API access denied (403). Please enable the Cloud Vision API in your Google Cloud project.`);
      }
      
      throw new Error(`Google Vision API error: ${response.status} - ${response.statusText}`);
    }

    const data: GoogleVisionApiResponse = await response.json();
    
    if (data.responses?.[0]?.error) {
      throw new Error(data.responses[0].error.message);
    }

    const objects = data.responses?.[0]?.localizedObjectAnnotations || [];
    
    return {
      success: true,
      objects: objects.map((obj: GoogleVisionApiObject) => ({
        name: obj.name.toLowerCase(),
        score: obj.score,
        boundingPoly: obj.boundingPoly,
      })),
    };
  } catch (error) {
    console.error('❌ Google Vision API error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not provided'
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      objects: [],
    };
  }
};

/**
 * Enhanced object detection that tries Google Vision first, falls back to COCO-SSD
 */
export const detectObjectsEnhanced = async (
  videoElement: HTMLVideoElement,
  apiKey?: string
): Promise<{
  objects: Array<{ class: string; score: number; bbox?: number[] }>;
  source: 'google-vision' | 'coco-ssd';
  success: boolean;
  error?: string;
}> => {
  // Try Google Vision API first if API key is provided
  if (apiKey) {
    try {
      const base64Image = captureVideoFrame(videoElement);
      const visionResult = await detectObjectsWithGoogleVision(base64Image, apiKey);
      
      if (visionResult.success && visionResult.objects.length > 0) {
        return {
          objects: visionResult.objects.map(obj => ({
            class: obj.name,
            score: obj.score,
          })),
          source: 'google-vision',
          success: true,
        };
      }
    } catch (error) {
      console.warn('Google Vision failed, falling back to COCO-SSD:', error);
    }
  }

  // Fallback to COCO-SSD (existing implementation)
  try {
    const { detectObjects } = await import('./objectDetection');
    const cocoResult = await detectObjects(videoElement);
    
    return {
      objects: cocoResult,
      source: 'coco-ssd',
      success: true,
    };
  } catch (error) {
    return {
      objects: [],
      source: 'coco-ssd',
      success: false,
      error: error instanceof Error ? error.message : 'Detection failed',
    };
  }
}; 