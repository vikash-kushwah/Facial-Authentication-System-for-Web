import { useRef, useEffect, useState } from 'react';
import { initCamera, stopCamera, type CameraError, isCameraSupported, isSecureContext } from '@/lib/camera';
import * as faceapi from 'face-api.js';
import { isWebGLSupported } from '@/lib/face-api';

type CameraViewportProps = {
  onFaceDetected?: (hasDetectedFace: boolean) => void;
  showGuide?: boolean;
  autoStart?: boolean;
  onCameraError?: (error: CameraError) => void;
  allowImageUpload?: boolean;
};

const CameraViewport = ({ 
  onFaceDetected, 
  showGuide = true, 
  autoStart = true,
  onCameraError,
  allowImageUpload = false
}: CameraViewportProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Check for WebGL support immediately
  useEffect(() => {
    setWebGLSupported(isWebGLSupported());
  }, []);

  useEffect(() => {
    let detectionInterval: NodeJS.Timeout;
    
    const startCamera = async () => {
      if (videoRef.current) {
        const result = await initCamera(videoRef.current);
        
        if (result.success) {
          setIsActive(true);
          setCameraError(null);
          
          // Start face detection if WebGL is supported
          if (webGLSupported) {
            detectionInterval = setInterval(async () => {
              if (
                videoRef.current &&
                canvasRef.current &&
                videoRef.current.readyState === 4
              ) {
                const videoWidth = videoRef.current.videoWidth;
                const videoHeight = videoRef.current.videoHeight;

                // Only proceed if video and canvas are available and have valid dimensions
                if (
                  videoWidth > 0 &&
                  videoHeight > 0 &&
                  canvasRef.current // <--- ensure canvas is not null
                ) {
                  setIsDetecting(true);
                  try {
                    const detections = await faceapi
                      .detectAllFaces(videoRef.current)
                      .withFaceLandmarks();

                    const displaySize = { width: videoWidth, height: videoHeight };

                    // Guard: only call matchDimensions if canvasRef.current is not null
                    if (canvasRef.current) {
                      faceapi.matchDimensions(canvasRef.current, displaySize);

                      const resizedDetections = faceapi.resizeResults(
                        detections,
                        displaySize
                      );

                      const ctx = canvasRef.current.getContext('2d');
                      if (ctx) {
                        ctx.clearRect(
                          0,
                          0,
                          canvasRef.current.width,
                          canvasRef.current.height
                        );
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
                      }
                    }

                    if (onFaceDetected) {
                      onFaceDetected(detections.length > 0);
                    }
                  } catch (error) {
                    console.error('Face detection error:', error);
                  }
                }
              }
            }, 100);
          }
        } else if (result.error) {
          console.error('Camera error:', result.error);
          setCameraError(result.error);
          if (onCameraError) {
            onCameraError(result.error);
          }
        }
      }
    };
    
    if (autoStart) {
      startCamera();
    }
    
    return () => {
      if (detectionInterval) clearInterval(detectionInterval);
      if (videoRef.current) stopCamera(videoRef.current);
      setIsActive(false);
    };
  }, [autoStart, onFaceDetected, onCameraError, webGLSupported]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Process the uploaded image here
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          // Draw the image on canvas
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              canvasRef.current.width = img.width;
              canvasRef.current.height = img.height;
              ctx.drawImage(img, 0, 0);
              setIsActive(true);
              
              // Detect faces if WebGL is supported
              if (webGLSupported) {
                try {
                  const detections = await faceapi
                    .detectAllFaces(canvasRef.current)
                    .withFaceLandmarks();
                  
                  // Draw detections
                  faceapi.draw.drawDetections(canvasRef.current, detections);
                  faceapi.draw.drawFaceLandmarks(canvasRef.current, detections);
                  
                  // Notify parent component
                  if (onFaceDetected) {
                    onFaceDetected(detections.length > 0);
                  }
                } catch (error) {
                  console.error('Face detection error:', error);
                }
              }
            }
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Error message elements
  const renderErrorMessage = () => {
    if (!webGLSupported) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-90 text-red-800 p-4 text-center">
          <svg className="w-12 h-12 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold mb-1">WebGL Not Supported</h3>
          <p className="mb-4">Your browser doesn't support WebGL, which is required for facial recognition.</p>
          {allowImageUpload && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Upload Image Instead
            </button>
          )}
        </div>
      );
    }

    if (cameraError) {
      let title = 'Camera Error';
      let icon = (
        <svg className="w-12 h-12 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );

      switch (cameraError.type) {
        case 'permission_denied':
          title = 'Camera Permission Denied';
          icon = (
            <svg className="w-12 h-12 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          );
          break;
        case 'device_not_found':
          title = 'Camera Not Found';
          icon = (
            <svg className="w-12 h-12 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeDasharray="5 5" />
            </svg>
          );
          break;
        case 'not_supported':
          title = 'Camera Not Supported';
          break;
        case 'insecure_context':
          title = 'Insecure Context';
          icon = (
            <svg className="w-12 h-12 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          );
          break;
      }

      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-90 text-red-800 p-4 text-center">
          {icon}
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="mb-4">{cameraError.message}</p>
          {allowImageUpload && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Upload Image Instead
            </button>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="camera-container bg-gray-100 aspect-[4/3] mx-auto mb-4 max-w-md">
      <div className="w-full h-full bg-gray-900 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
        />
        
        {!isActive && !cameraError && !webGLSupported && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-center px-4">
            <i className="fas fa-camera text-3xl mb-2"></i>
            <p>Camera feed will appear here</p>
            {allowImageUpload && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Upload Image
              </button>
            )}
          </div>
        )}
        
        {/* Camera error or WebGL not supported message */}
        {renderErrorMessage()}
        
        {/* Face detection overlay */}
        {showGuide && isActive && (
          <div className="face-overlay flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="120" y="60" width="160" height="180" rx="80" stroke="#3B82F6" strokeWidth="2" strokeDasharray="8 4" className="face-guide"/>
            </svg>
          </div>
        )}
        
        {/* Hidden file input for image upload */}
        {allowImageUpload && (
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleFileUpload} 
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default CameraViewport;
