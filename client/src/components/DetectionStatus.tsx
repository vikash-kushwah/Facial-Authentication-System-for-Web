import { useState, useEffect } from 'react';

type DetectionStatusProps = {
  isDetecting?: boolean;
  hasFace?: boolean;
  status?: 'initial' | 'detecting' | 'detected' | 'verified' | 'error';
  customMessage?: string;
};

const DetectionStatus = ({ 
  isDetecting = false, 
  hasFace = false, 
  status = 'initial',
  customMessage 
}: DetectionStatusProps) => {
  const [statusInfo, setStatusInfo] = useState({
    color: 'bg-warning-500',
    message: 'Looking for face...'
  });

  useEffect(() => {
    if (customMessage) {
      setStatusInfo({
        ...statusInfo,
        message: customMessage
      });
      return;
    }

    if (status === 'initial') {
      setStatusInfo({
        color: 'bg-gray-500',
        message: 'Camera not started'
      });
    } else if (status === 'detecting') {
      setStatusInfo({
        color: 'bg-warning-500',
        message: 'Looking for face...'
      });
    } else if (status === 'detected') {
      setStatusInfo({
        color: 'bg-secondary-500',
        message: 'Face detected'
      });
    } else if (status === 'verified') {
      setStatusInfo({
        color: 'bg-primary-600',
        message: 'Face verified'
      });
    } else if (status === 'error') {
      setStatusInfo({
        color: 'bg-error-500',
        message: 'Detection error'
      });
    } else {
      // Default based on props for backward compatibility
      if (isDetecting) {
        setStatusInfo({
          color: hasFace ? 'bg-secondary-500' : 'bg-warning-500',
          message: hasFace ? 'Face detected' : 'Looking for face...'
        });
      } else {
        setStatusInfo({
          color: 'bg-gray-500',
          message: 'Camera not started'
        });
      }
    }
  }, [isDetecting, hasFace, status, customMessage]);

  return (
    <div className="flex items-center justify-center mb-4">
      <div className="bg-gray-100 px-4 py-2 rounded-full inline-flex items-center">
        <span className={`h-2 w-2 rounded-full ${statusInfo.color} mr-2`}></span>
        <span className="text-sm font-medium text-gray-700">{statusInfo.message}</span>
      </div>
    </div>
  );
};

export default DetectionStatus;
