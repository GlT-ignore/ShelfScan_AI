# Object Detection Setup Guide

## Current Status
Your ShelfScan AI currently uses **browser-based detection** (COCO-SSD model) which provides basic object recognition. For much better accuracy, you can enable **Google Vision API integration**.

## Detection Comparison

| Feature | Browser-based (COCO-SSD) | Google Vision API |
|---------|---------------------------|-------------------|
| **Accuracy** | Basic (~60-70%) | High (~90-95%) |
| **Speed** | Fast | Moderate |
| **Cost** | Free | Free tier: 1,000/month |
| **Setup** | None required | API key needed |

## Enable High-Accuracy Detection

### Step 1: Get Google Vision API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the [Vision API](https://console.cloud.google.com/apis/library/vision.googleapis.com)
4. Create an [API key](https://console.cloud.google.com/apis/credentials)
5. Copy your API key

### Step 2: Add API Key to Your Project
Create a `.env.local` file in the `shelfscan` folder with:

```env
NEXT_PUBLIC_GOOGLE_VISION_API_KEY=your_actual_api_key_here
```

### Step 3: Restart Development Server
```bash
npm run dev
```

### Step 4: Test Enhanced Detection
1. Open the app
2. Click "Live Scan" 
3. Look for the green 🚀 indicator showing "High-Accuracy Detection (Google Vision)"
4. Point camera at objects and see much better detection results!

## What You'll Notice
- **Better object recognition**: Detects more objects with higher confidence
- **More accurate names**: "Water bottle" instead of just "bottle"
- **Improved confidence scores**: Higher accuracy percentages
- **Real-time feedback**: Green indicator shows when using Google Vision

## Troubleshooting
- **Yellow indicator**: Falling back to browser detection (check API key)
- **No detection**: Ensure good lighting and clear object visibility
- **API errors**: Check API key is valid and Vision API is enabled

## Alternative APIs
You can also integrate other vision services by modifying the detection code:
- Azure Computer Vision
- AWS Rekognition  
- Clarifai API
- Roboflow API

The system will automatically fall back to browser-based detection if any API fails. 