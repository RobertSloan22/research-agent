import React, { useState, useEffect } from 'react';
import { Search, Bot, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { ApiClient, StreamingCallbacks } from '../utils/api';
import { ResearchResult } from '../types/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { SearchProgress } from './SearchProgress';
import { ResearchResults } from './ResearchResults';

export const ResearchBot: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [traceId, setTraceId] = useState<string | undefined>();
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  
  // Streaming progress state
  const [currentStage, setCurrentStage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchPlan, setSearchPlan] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);
  const [completedSearches, setCompletedSearches] = useState<number>(0);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      await ApiClient.healthCheck();
      setServerStatus('online');
    } catch (error) {
      setServerStatus('offline');
    }
  };

  const handleResearch = async () => {
    if (!query.trim()) return;
    
    // Reset all state
    setLoading(true);
    setError(null);
    setResult(null);
    setTraceId(undefined);
    setCurrentQuery(query.trim());
    setCurrentStage('');
    setStatusMessage('');
    setSearchPlan([]);
    setCurrentSearchIndex(0);
    setCompletedSearches(0);

    const streamingCallbacks: StreamingCallbacks = {
      onStatus: (data) => {
        setCurrentStage(data.stage);
        setStatusMessage(data.message);
      },
      onPlan: (data) => {
        setSearchPlan(data.searchPlan.searches || []);
        setStatusMessage(data.message);
      },
      onSearch: (data) => {
        setCurrentSearchIndex(data.currentSearch);
        setStatusMessage(data.message);
      },
      onSearchComplete: (data) => {
        setCompletedSearches(data.completed);
        setStatusMessage(data.message);
      },
      onSearchError: (data) => {
        console.warn('Search error:', data.error);
        // Continue with other searches
      },
      onComplete: (response) => {
        setResult(response.result.report);
        setTraceId(response.result.traceId);
        setLoading(false);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setServerStatus('offline');
        setLoading(false);
      }
    };

    try {
      await ApiClient.researchStream(query.trim(), streamingCallbacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setServerStatus('offline');
      setLoading(false);
    }
  };

  const handleFollowUp = (question: string) => {
    setQuery(question);
    // Optionally auto-start research
    // handleResearch();
  };

  const handleRetry = () => {
    if (currentQuery) {
      setQuery(currentQuery);
      handleResearch();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && query.trim()) {
      handleResearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full mr-3">
              <Bot className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">AI Research Bot</h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get comprehensive research reports on any topic using AI-powered web search and analysis
          </p>
          
          {/* Server Status Indicator */}
          <div className="flex items-center justify-center mt-4">
            <div className={`flex items-center text-sm px-3 py-1 rounded-full ${
              serverStatus === 'online' 
                ? 'bg-green-100 text-green-700'
                : serverStatus === 'offline'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                serverStatus === 'online' 
                  ? 'bg-green-500'
                  : serverStatus === 'offline'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`} />
              {serverStatus === 'online' && 'Server Online'}
              {serverStatus === 'offline' && 'Server Offline'}
              {serverStatus === 'unknown' && 'Checking Status...'}
            </div>
          </div>
        </header>

        {/* Search Input */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to research? (e.g., 'latest developments in quantum computing')"
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              disabled={loading || serverStatus === 'offline'}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Research typically takes 30-60 seconds
            </div>
            <button
              onClick={handleResearch}
              disabled={loading || !query.trim() || serverStatus === 'offline'}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" message="" />
                  <span className="ml-2">Researching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Start Research
                </>
              )}
            </button>
          </div>
        </div>

        {/* Server Offline Warning */}
        {serverStatus === 'offline' && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <div>
                  <p className="text-amber-800 font-medium">Research server is offline</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Make sure the research bot server is running on port 3001.
                    <button 
                      onClick={checkServerStatus}
                      className="ml-2 text-amber-600 hover:text-amber-800 underline"
                    >
                      Check again
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State with Progress */}
        {loading && (
          <div className="max-w-4xl mx-auto mb-6">
            <SearchProgress 
              searchPlan={searchPlan}
              currentSearch={currentSearchIndex}
              isSearching={loading}
            />
            {statusMessage && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">{statusMessage}</p>
                {currentStage && (
                  <p className="text-xs text-gray-500 capitalize">Stage: {currentStage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <ErrorDisplay
              title="Research Failed"
              message={error}
              onRetry={handleRetry}
              showRetry={!!currentQuery}
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="max-w-6xl mx-auto">
            <ResearchResults
              result={result}
              query={currentQuery}
              traceId={traceId}
              onFollowUpClick={handleFollowUp}
            />
          </div>
        )}

        {/* Sample Queries */}
        {!loading && !result && !error && (
          <div className="max-w-4xl mx-auto mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Try These Sample Queries
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Latest developments in artificial intelligence",
                "Impact of remote work on productivity",
                "Renewable energy trends in 2024",
                "Cryptocurrency market analysis",
                "Space exploration recent achievements",
                "Climate change mitigation technologies"
              ].map((sampleQuery, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(sampleQuery)}
                  className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                  disabled={serverStatus === 'offline'}
                >
                  <p className="text-blue-600 group-hover:text-blue-800 font-medium text-sm">
                    {sampleQuery}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by OpenAI GPT models and web search</p>
        </footer>
      </div>
    </div>
  );
};