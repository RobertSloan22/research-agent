import React from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { WebSearchItem } from '../types/api';

interface SearchProgressProps {
  searchPlan?: WebSearchItem[];
  currentSearch?: number;
  isSearching: boolean;
}

export const SearchProgress: React.FC<SearchProgressProps> = ({
  searchPlan = [],
  currentSearch = 0,
  isSearching,
}) => {
  if (!isSearching || searchPlan.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-slide-up">
      <div className="flex items-center mb-3">
        <Search className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-blue-800 font-semibold">Research Progress</h3>
      </div>

      <div className="space-y-2">
        {searchPlan.map((search, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {index < currentSearch ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : index === currentSearch ? (
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  index <= currentSearch ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {search.query}
              </p>
              <p
                className={`text-xs ${
                  index <= currentSearch ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {search.reason}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-sm text-blue-700">
        {currentSearch >= searchPlan.length
          ? 'Generating report...'
          : `Searching ${currentSearch + 1} of ${searchPlan.length}`}
      </div>
    </div>
  );
};
