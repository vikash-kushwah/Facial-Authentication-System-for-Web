import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import CameraViewport from '@/components/CameraViewport';
import { getFaceDescriptor, descriptorToArray } from '@/lib/face-api';
import { matchFace } from '@/lib/auth';
import { Progress } from '@/components/ui/progress';

const MatchingTest = () => {
  const { toast } = useToast();
  const probeVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const [hasProbe, setHasProbe] = useState(false);
  const [probeDescriptor, setProbeDescriptor] = useState<Float32Array | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [results, setResults] = useState<{
    matches: Array<{
      userId: number;
      username: string;
      name: string;
      similarity: number;
    }>;
    threshold: number;
    metrics: {
      totalFaces: number;
      matchedAboveThreshold: number;
      processingTime: string;
      tpr: number;
      fpr: number;
      accuracy: number;
    };
  } | null>(null);
  
  const handleProbeDetection = (detected: boolean) => {
    setHasProbe(detected);
  };
  
  const handleCaptureProbe = async () => {
    if (!hasProbe) {
      toast({
        title: "No face detected",
        description: "Please position your face in the camera view",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (probeVideoRef.current) {
        const descriptor = await getFaceDescriptor(probeVideoRef.current);
        
        if (!descriptor) {
          toast({
            title: "Detection failed",
            description: "Could not get face features. Please try again",
            variant: "destructive",
          });
          return;
        }
        
        setProbeDescriptor(descriptor);
        toast({
          title: "Face captured",
          description: "Probe face has been captured successfully",
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
  
  const handleMatchFace = async () => {
    if (!probeDescriptor) {
      toast({
        title: "Probe face required",
        description: "Please capture a probe face before matching",
        variant: "destructive",
      });
      return;
    }
    
    setIsMatching(true);
    
    try {
      // Convert descriptor to array for API
      const probeArray = descriptorToArray(probeDescriptor);
      
      // Get matching results from API
      const matchResults = await matchFace(probeArray);
      setResults(matchResults);
    } catch (error) {
      console.error('Matching error:', error);
      toast({
        title: "Matching failed",
        description: "An error occurred while matching the face",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };
  
  // Set the video ref when CameraViewport is mounted
  const setVideoRef = (element: HTMLVideoElement | null) => {
    probeVideoRef.current = element;
  };
  
  return (
    <div className="px-4 py-6 sm:px-0">
      <Card className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Face Matching Test</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Match a face against a dataset of known faces</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Probe Face */}
            <div className="md:col-span-1">
              <h4 className="text-base font-medium text-gray-700 mb-2">Probe Face</h4>
              <CameraViewport 
                onFaceDetected={handleProbeDetection}
                showGuide={false}
              />
              <div className="flex space-x-2 mt-4">
                <Button 
                  onClick={handleCaptureProbe}
                  disabled={isMatching}
                >
                  <i className="fas fa-camera mr-2"></i>
                  Capture
                </Button>
                <Button 
                  variant="outline"
                  disabled={isMatching}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Upload
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="md:col-span-2">
              <h4 className="text-base font-medium text-gray-700 mb-4">Match Results</h4>
              
              {/* Top Matches */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="text-sm font-medium text-gray-700">Top Matches</h5>
                  <span className="text-xs font-medium text-gray-500">
                    Threshold: {results ? results.threshold : '0.75'}
                  </span>
                </div>
                
                {results && results.matches.length > 0 ? (
                  results.matches.slice(0, 3).map((match, index) => (
                    <div 
                      key={`match-${match.userId}-${index}`}
                      className="flex items-center mb-3 pb-3 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0"
                    >
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                        <div className="h-full w-full flex items-center justify-center">
                          <i className="fas fa-user text-gray-400"></i>
                        </div>
                      </div>
                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {match.name || match.username}
                          </span>
                          <span className={`text-xs font-mono ${match.similarity >= results.threshold ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'} rounded px-2 py-0.5`}>
                            {match.similarity.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.round(match.similarity * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    {isMatching ? 'Matching...' : 'No matches found'}
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Evaluation Metrics</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">True Positive Rate</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.tpr.toFixed(3) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">False Positive Rate</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.fpr.toFixed(3) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Accuracy</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.accuracy.toFixed(3) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Dataset Information</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Total Faces</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.totalFaces : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Matched Above Threshold</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.matchedAboveThreshold : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Processing Time</span>
                      <span className="text-xs font-mono bg-gray-100 rounded px-2 py-0.5">
                        {results ? results.metrics.processingTime : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex">
                <Button 
                  onClick={handleMatchFace}
                  disabled={isMatching || !probeDescriptor}
                >
                  <i className="fas fa-search mr-2"></i>
                  Match Face
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MatchingTest;
