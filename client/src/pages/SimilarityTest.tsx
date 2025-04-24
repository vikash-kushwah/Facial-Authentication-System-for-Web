import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CameraViewport from '@/components/CameraViewport';
import { getFaceDescriptor, descriptorToArray, computeDistance } from '@/lib/face-api';
import { compareFaces } from '@/lib/auth';
import { Progress } from '@/components/ui/progress';

const SimilarityTest = () => {
  const { toast } = useToast();
  const face1VideoRef = useRef<HTMLVideoElement | null>(null);
  const face2VideoRef = useRef<HTMLVideoElement | null>(null);
  
  const [hasFace1, setHasFace1] = useState(false);
  const [hasFace2, setHasFace2] = useState(false);
  const [face1Descriptor, setFace1Descriptor] = useState<Float32Array | null>(null);
  const [face2Descriptor, setFace2Descriptor] = useState<Float32Array | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [results, setResults] = useState<{
    overallSimilarity: number;
    euclideanDistance: number;
    manhattanDistance: number;
    cosineSimilarity: number;
    neuralNetworks: {
      faceNet: number;
      vggFace: number;
      arcFace: number;
    };
  } | null>(null);
  
  const handleFace1Detection = (detected: boolean) => {
    setHasFace1(detected);
  };
  
  const handleFace2Detection = (detected: boolean) => {
    setHasFace2(detected);
  };
  
  const handleCaptureFace1 = async () => {
    if (!hasFace1) {
      toast({
        title: "No face detected",
        description: "Please position your face in the camera view",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (face1VideoRef.current) {
        const descriptor = await getFaceDescriptor(face1VideoRef.current);
        
        if (!descriptor) {
          toast({
            title: "Detection failed",
            description: "Could not get face features. Please try again",
            variant: "destructive",
          });
          return;
        }
        
        setFace1Descriptor(descriptor);
        toast({
          title: "Face captured",
          description: "First face has been captured successfully",
        });
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      toast({
        title: "Error capturing face",
        description: "An error occurred while capturing the face",
        variant: "destructive",
      });
    }
  };
  
  const handleCaptureFace2 = async () => {
    if (!hasFace2) {
      toast({
        title: "No face detected",
        description: "Please position your face in the camera view",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (face2VideoRef.current) {
        const descriptor = await getFaceDescriptor(face2VideoRef.current);
        
        if (!descriptor) {
          toast({
            title: "Detection failed",
            description: "Could not get face features. Please try again",
            variant: "destructive",
          });
          return;
        }
        
        setFace2Descriptor(descriptor);
        toast({
          title: "Face captured",
          description: "Second face has been captured successfully",
        });
      }
    } catch (error) {
      console.error('Error capturing face:', error);
      toast({
        title: "Error capturing face",
        description: "An error occurred while capturing the face",
        variant: "destructive",
      });
    }
  };
  
  const handleCompareFaces = async () => {
    if (!face1Descriptor || !face2Descriptor) {
      toast({
        title: "Faces required",
        description: "Please capture both faces before comparing",
        variant: "destructive",
      });
      return;
    }
    
    setIsComparing(true);
    
    try {
      // Convert descriptors to arrays for API
      const desc1Array = descriptorToArray(face1Descriptor);
      const desc2Array = descriptorToArray(face2Descriptor);
      
      // Get similarity results from API
      const similarityResults = await compareFaces(desc1Array, desc2Array);
      setResults(similarityResults);
    } catch (error) {
      console.error('Comparison error:', error);
      toast({
        title: "Comparison failed",
        description: "An error occurred while comparing the faces",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };
  
  // Set the video refs when CameraViewport is mounted
  const setVideoRef1 = (element: HTMLVideoElement | null) => {
    face1VideoRef.current = element;
  };
  
  const setVideoRef2 = (element: HTMLVideoElement | null) => {
    face2VideoRef.current = element;
  };
  
  return (
    <div className="px-4 py-6 sm:px-0">
      <Card className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Facial Similarity Test</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Compare two faces to determine similarity score</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Face 1 */}
            <div>
              <div className="mb-4">
                <h4 className="text-base font-medium text-gray-700 mb-2">Face 1</h4>
                <CameraViewport 
                  onFaceDetected={handleFace1Detection}
                  showGuide={false}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCaptureFace1}
                  disabled={isComparing}
                >
                  <i className="fas fa-camera mr-2"></i>
                  Capture
                </Button>
                <Button 
                  variant="outline"
                  disabled={isComparing}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload
                </Button>
              </div>
            </div>

            {/* Face 2 */}
            <div>
              <div className="mb-4">
                <h4 className="text-base font-medium text-gray-700 mb-2">Face 2</h4>
                <CameraViewport 
                  onFaceDetected={handleFace2Detection}
                  showGuide={false}
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCaptureFace2}
                  disabled={isComparing}
                >
                  <i className="fas fa-camera mr-2"></i>
                  Capture
                </Button>
                <Button 
                  variant="outline"
                  disabled={isComparing}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {/* Similarity Results */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-base font-medium text-gray-700 mb-4">Similarity Results</h4>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Similarity</span>
                <span className="text-sm font-mono bg-gray-100 rounded px-2 py-0.5">
                  {results ? `${Math.round(results.overallSimilarity * 100)}%` : 'N/A'}
                </span>
              </div>
              <Progress 
                value={results ? results.overallSimilarity * 100 : 0} 
                className="h-2.5"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Distance Metrics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Distance Metrics</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Euclidean Distance</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.euclideanDistance.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Manhattan Distance</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.manhattanDistance.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Cosine Similarity</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.cosineSimilarity.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Neural Network Comparison */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Neural Network Comparison</h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">FaceNet</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.neuralNetworks.faceNet.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">VGG-Face</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.neuralNetworks.vggFace.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">ArcFace</span>
                    <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                      {results ? results.neuralNetworks.arcFace.toFixed(3) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex">
              <Button 
                onClick={handleCompareFaces}
                disabled={isComparing || !face1Descriptor || !face2Descriptor}
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Compare Faces
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SimilarityTest;
