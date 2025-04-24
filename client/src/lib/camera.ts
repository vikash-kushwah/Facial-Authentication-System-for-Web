export type CameraError = {
  type: 'permission_denied' | 'device_not_found' | 'not_supported' | 'insecure_context' | 'other';
  message: string;
};

/**
 * Checks if the camera API is supported in the current browser
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Checks if the current page is loaded over HTTPS
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}

/**
 * Initializes and manages camera access
 */
export async function initCamera(
  videoElement: HTMLVideoElement, 
  facingMode: 'user' | 'environment' = 'user'
): Promise<{ success: boolean; error?: CameraError }> {
  if (!isCameraSupported()) {
    return {
      success: false,
      error: {
        type: 'not_supported',
        message: 'Camera API is not supported in this browser'
      }
    };
  }
  
  if (!isSecureContext()) {
    return {
      success: false,
      error: {
        type: 'insecure_context',
        message: 'Camera access requires HTTPS'
      }
    };
  }
  
  try {
    // Try with ideal constraints first
    const constraints = {
      video: {
        facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      
      return new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          resolve({ success: true });
        };
      });
    } catch (initialError: any) {
      // If we fail with ideal constraints, try again with minimal constraints
      console.warn('Failed with initial constraints, trying minimal constraints', initialError);
      
      const minimalConstraints = {
        video: true
      };
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia(minimalConstraints);
        videoElement.srcObject = stream;
        
        return new Promise((resolve) => {
          videoElement.onloadedmetadata = () => {
            resolve({ success: true });
          };
        });
      } catch (fallbackError: any) {
        // Both attempts failed, categorize the error
        throw fallbackError;
      }
    }
  } catch (error: any) {
    console.error('Error accessing camera:', error);
    
    // Categorize the error
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: {
          type: 'permission_denied',
          message: 'Camera access permission was denied'
        }
      };
    } else if (error.name === 'NotFoundError') {
      return {
        success: false,
        error: {
          type: 'device_not_found',
          message: 'No camera device was found'
        }
      };
    } else {
      return {
        success: false,
        error: {
          type: 'other',
          message: `Camera error: ${error.message || 'Unknown error'}`
        }
      };
    }
  }
}

/**
 * Stops the camera stream
 */
export function stopCamera(videoElement: HTMLVideoElement): void {
  if (videoElement && videoElement.srcObject) {
    const stream = videoElement.srcObject as MediaStream;
    const tracks = stream.getTracks();
    
    tracks.forEach(track => track.stop());
    videoElement.srcObject = null;
  }
}

/**
 * Takes a snapshot from the video element and returns a data URL
 */
export function takeSnapshot(videoElement: HTMLVideoElement): string {
  if (!videoElement) return '';
  
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }
  
  return '';
}

/**
 * Creates an image element from a data URL
 */
export function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Uploads an image file and returns an image element
 */
export function uploadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!file.type.match('image.*')) {
      reject(new Error('Selected file is not an image'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
