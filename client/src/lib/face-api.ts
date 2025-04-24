import * as faceapi from 'face-api.js';

export type FaceDescriptor = number[];
export type FaceDetectionResult = {
  descriptor: FaceDescriptor;
  detection: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  landmarks?: any;
  age?: number;
  gender?: string;
  expressions?: Record<string, number>;
};

let modelsLoaded = false;

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

/**
 * Load required face-api.js models
 */
export async function loadModels() {
  if (modelsLoaded) return;
  
  // Check WebGL support first
  if (!isWebGLSupported()) {
    console.warn('WebGL is not supported in this environment. Face recognition features will be limited.');
    // Instead of throwing, we'll continue but mark as loaded so the UI doesn't hang
    modelsLoaded = true;
    return;
  }
  
  try {
    // Load models sequentially to avoid overwhelming the system
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.ageGenderNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');
    
    modelsLoaded = true;
    console.log('Face API models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    // Instead of throwing, mark as loaded but with a fallback
    modelsLoaded = true;
  }
}

/**
 * Detects faces in an image and returns face descriptors
 * @param imageElement HTML image or video element
 * @param withAgeGender Include age and gender detection
 * @param withExpressions Include facial expression detection
 * @returns Face detection results
 */
export async function detectFaces(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  withAgeGender: boolean = false,
  withExpressions: boolean = false
) {
  try {
    // Check if WebGL is supported
    if (!isWebGLSupported()) {
      console.warn('WebGL is not supported in this environment. Face recognition features are disabled.');
      return [];
    }
    
    // Make sure models are loaded
    if (!modelsLoaded) {
      await loadModels();
    }
    
    // Make sure the image element is valid and ready for processing
    if (!imageElement || 
        (imageElement instanceof HTMLImageElement && !imageElement.complete) ||
        (imageElement instanceof HTMLVideoElement && imageElement.readyState < 2)) {
      console.warn('Image element is not ready for processing');
      return [];
    }
    
    // Check if image dimensions are valid
    const width = imageElement instanceof HTMLVideoElement ? imageElement.videoWidth : imageElement.width;
    const height = imageElement instanceof HTMLVideoElement ? imageElement.videoHeight : imageElement.height;
    
    if (!width || !height || width < 10 || height < 10) {
      console.warn('Image dimensions are invalid or too small for face detection');
      return [];
    }
    
    // Try to detect faces with descriptors
    let detections = [];
    try {
      detections = await faceapi
        .detectAllFaces(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptors();
    } catch (e) {
      console.error('Error during face detection with descriptors:', e);
      return [];
    }
    
    // Add age and gender if requested
    if (withAgeGender && detections.length > 0) {
      try {
        const ageGenderResults = await faceapi
          .detectAllFaces(imageElement)
          .withFaceLandmarks()
          .withAgeAndGender();
        
        // Merge age and gender information
        detections = detections.map((detection, index) => {
          if (index < ageGenderResults.length) {
            return {
              ...detection,
              age: ageGenderResults[index].age,
              gender: ageGenderResults[index].gender
            };
          }
          return detection;
        });
      } catch (e) {
        console.warn('Could not detect age and gender, continuing without them:', e);
      }
    }
    
    // Add expressions if requested
    if (withExpressions && detections.length > 0) {
      try {
        const expressionResults = await faceapi
          .detectAllFaces(imageElement)
          .withFaceLandmarks()
          .withFaceExpressions();
        
        // Merge expression information
        detections = detections.map((detection, index) => {
          if (index < expressionResults.length) {
            return {
              ...detection,
              expressions: expressionResults[index].expressions
            };
          }
          return detection;
        });
      } catch (e) {
        console.warn('Could not detect expressions, continuing without them:', e);
      }
    }
    
    return detections;
  } catch (error) {
    console.error('Error detecting faces:', error);
    // Instead of throwing, return empty array to make the API more resilient
    return [];
  }
}

/**
 * Gets a face descriptor from an image or video element
 * @param imageElement HTML image or video element
 * @returns Face descriptor as a Float32Array or null if no face detected
 */
export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
  try {
    // Check if WebGL is supported
    if (!isWebGLSupported()) {
      console.warn('WebGL is not supported in this environment. Face recognition features are disabled.');
      return null;
    }
    
    // Check if we have a valid element
    if (!imageElement) {
      console.warn('Invalid image element provided to getFaceDescriptor');
      return null;
    }
    
    // For images, check if they're fully loaded
    if (imageElement instanceof HTMLImageElement && !imageElement.complete) {
      console.warn('Image is not completely loaded yet');
      return null;
    }
    
    // For videos, check if they're ready
    if (imageElement instanceof HTMLVideoElement && imageElement.readyState < 2) {
      console.warn('Video is not ready for capture');
      return null;
    }
    
    // Attempt to detect faces
    const detections = await detectFaces(imageElement);
    
    if (!detections || detections.length === 0) {
      console.warn('No faces detected in the provided image/video');
      return null;
    }
    
    // Return the descriptor of the first detected face
    return detections[0].descriptor;
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    // Return null instead of throwing to make the API more resilient
    return null;
  }
}

/**
 * Gets multiple face descriptors from an image or video element
 * @param imageElement HTML image or video element
 * @returns Array of face detection results with descriptors
 */
export async function getAllFaceDescriptors(
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  withAgeGender: boolean = false,
  withExpressions: boolean = false
): Promise<FaceDetectionResult[]> {
  try {
    // Check if WebGL is supported
    if (!isWebGLSupported()) {
      console.warn('WebGL is not supported in this environment. Face recognition features are disabled.');
      return [];
    }
    
    // Check if we have a valid element
    if (!imageElement) {
      console.warn('Invalid image element provided to getAllFaceDescriptors');
      return [];
    }
    
    // Make sure models are loaded - this will handle the case where WebGL is not supported
    if (!modelsLoaded) {
      try {
        await loadModels();
      } catch (e) {
        console.warn('Could not load face-api models:', e);
        return [];
      }
    }
    
    // Attempt to detect faces safely
    let detections = [];
    try {
      detections = await detectFaces(imageElement, withAgeGender, withExpressions);
    } catch (e) {
      console.error('Error in face detection:', e);
      return [];
    }
    
    if (!detections || detections.length === 0) {
      return [];
    }
    
    // Convert to simpler format for storage/transmission
    try {
      return detections.map(detection => ({
        descriptor: Array.from(detection.descriptor),
        detection: {
          x: detection.detection.box.x,
          y: detection.detection.box.y,
          width: detection.detection.box.width,
          height: detection.detection.box.height
        },
        landmarks: detection.landmarks,
        age: (detection as any).age,
        gender: (detection as any).gender,
        expressions: (detection as any).expressions
      }));
    } catch (e) {
      console.error('Error converting detections to result format:', e);
      return [];
    }
  } catch (error) {
    console.error('Error getting all face descriptors:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Converts a Float32Array descriptor to a regular array for storage/transmission
 * @param descriptor Face descriptor as Float32Array
 * @returns Face descriptor as regular array
 */
export function descriptorToArray(descriptor: Float32Array): FaceDescriptor {
  return Array.from(descriptor);
}

/**
 * Converts an array back to Float32Array for face-api operations
 * @param array Face descriptor as regular array
 * @returns Face descriptor as Float32Array
 */
export function arrayToDescriptor(array: FaceDescriptor): Float32Array {
  return new Float32Array(array);
}

/**
 * Draws face detection results on a canvas
 * @param canvas Canvas element to draw on
 * @param imageElement Source image/video element
 * @param detections Face detection results
 */
export function drawFaceDetections(
  canvas: HTMLCanvasElement,
  imageElement: HTMLImageElement | HTMLVideoElement,
  detections: faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<faceapi.WithFaceDetection<{}>>>[]
) {
  // Resize canvas to match image/video dimensions
  const displaySize = {
    width: imageElement.width,
    height: imageElement.height
  };
  faceapi.matchDimensions(canvas, displaySize);
  
  // Resize detections to match display size
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  // Clear canvas
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Draw detections
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  }
}

/**
 * Computes Euclidean distance between two face descriptors
 * @param descriptor1 First face descriptor
 * @param descriptor2 Second face descriptor
 * @returns Euclidean distance (lower means more similar)
 */
export function computeDistance(descriptor1: Float32Array | FaceDescriptor, descriptor2: Float32Array | FaceDescriptor): number {
  // Ensure we're working with Float32Array
  const desc1 = descriptor1 instanceof Float32Array ? descriptor1 : new Float32Array(descriptor1);
  const desc2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  
  return faceapi.euclideanDistance(desc1, desc2);
}

/**
 * Checks if two face descriptors match based on a threshold
 * @param descriptor1 First face descriptor
 * @param descriptor2 Second face descriptor
 * @param threshold Maximum distance to consider a match (default: 0.6)
 * @returns Whether the faces match
 */
export function isFaceMatch(
  descriptor1: Float32Array | FaceDescriptor,
  descriptor2: Float32Array | FaceDescriptor,
  threshold: number = 0.6
): boolean {
  const distance = computeDistance(descriptor1, descriptor2);
  return distance < threshold;
}
