import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Error',
  message,
  onRetry,
  showRetry = true
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 animate-fade-in">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold text-sm">{title}</h3>
          <p className="text-red-700 text-sm mt-1">{message}</p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center text-sm text-red-600 hover:text-red-800 font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};