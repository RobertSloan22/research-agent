# Research System Frontend Integration

This document contains all the necessary frontend code to integrate the AI Research Bot system into your existing application.

## Overview

The research system provides a comprehensive AI-powered research interface that includes:
- Real-time search progress tracking
- Streaming research results
- Interactive follow-up questions
- Markdown report rendering
- Error handling and retry functionality

## Dependencies

Add these dependencies to your `package.json`:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.1",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "tailwindcss": "^3.4.4",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
```

## Configuration Files

### Tailwind Config (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### CSS Styles (`styles.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer components {
  .prose {
    @apply text-gray-700 leading-relaxed;
  }
  
  .prose h1 {
    @apply text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0;
  }
  
  .prose h2 {
    @apply text-xl font-semibold text-gray-800 mb-3 mt-6;
  }
  
  .prose h3 {
    @apply text-lg font-medium text-gray-800 mb-2 mt-4;
  }
  
  .prose p {
    @apply mb-4 leading-relaxed;
  }
  
  .prose ul {
    @apply list-disc pl-6 mb-4 space-y-1;
  }
  
  .prose ol {
    @apply list-decimal pl-6 mb-4 space-y-1;
  }
  
  .prose li {
    @apply text-gray-700;
  }
  
  .prose strong {
    @apply font-semibold text-gray-900;
  }
  
  .prose em {
    @apply italic text-gray-800;
  }
  
  .prose blockquote {
    @apply border-l-4 border-blue-200 pl-4 py-2 my-4 bg-blue-50 italic;
  }
  
  .prose code {
    @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800;
  }
  
  .prose pre {
    @apply bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm;
  }
  
  .prose pre code {
    @apply bg-transparent p-0;
  }
}
```

## Type Definitions

### API Types (`types/api.ts`)

```typescript
export interface WebSearchItem {
  query: string;
  reason: string;
}

export interface WebSearchPlan {
  searches: WebSearchItem[];
}

export interface ResearchResult {
  shortSummary: string;
  markdownReport: string;
  followUpQuestions: string[];
}

export interface ResearchResponse {
  searchPlan: WebSearchPlan;
  searchResults: string[];
  report: ResearchResult;
  traceId?: string;
}

export interface ApiResponse {
  success: boolean;
  query: string;
  result: ResearchResponse;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}
```

## API Client

### API Utilities (`utils/api.ts`)

```typescript
import { ApiResponse, ApiError } from '../types/api';

const API_BASE_URL = '/api';

export interface StreamingCallbacks {
  onStatus?: (data: { stage: string; message: string }) => void;
  onPlan?: (data: { searchPlan: any; message: string }) => void;
  onSearch?: (data: { currentSearch: number; totalSearches: number; searchItem: any; message: string }) => void;
  onSearchComplete?: (data: { currentSearch: number; totalSearches: number; completed: number; message: string }) => void;
  onSearchError?: (data: { currentSearch: number; searchItem: any; error: string }) => void;
  onComplete?: (data: ApiResponse) => void;
  onError?: (error: string) => void;
}

export class ApiClient {
  static async research(query: string): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      const error = data as ApiError;
      throw new Error(error.message || 'Research failed');
    }

    return data as ApiResponse;
  }

  static async researchStream(query: string, callbacks: StreamingCallbacks): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/research/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream not available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const event = line.substring(7).trim();
            continue;
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Handle different event types
              if (data.stage) {
                callbacks.onStatus?.(data);
              } else if (data.searchPlan) {
                callbacks.onPlan?.(data);
              } else if (data.currentSearch !== undefined && data.searchItem) {
                callbacks.onSearch?.(data);
              } else if (data.currentSearch !== undefined && data.completed !== undefined) {
                callbacks.onSearchComplete?.(data);
              } else if (data.currentSearch !== undefined && data.error) {
                callbacks.onSearchError?.(data);
              } else if (data.success !== undefined) {
                if (data.success) {
                  callbacks.onComplete?.(data as ApiResponse);
                } else {
                  callbacks.onError?.(data.message || 'Research failed');
                }
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  static async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}
```

## React Components

### Loading Spinner (`components/LoadingSpinner.tsx`)

```typescript
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      <p className="mt-2 text-gray-600 text-sm">{message}</p>
    </div>
  );
};
```

### Error Display (`components/ErrorDisplay.tsx`)

```typescript
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
```

### Search Progress (`components/SearchProgress.tsx`)

```typescript
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
  isSearching
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
              <p className={`text-sm font-medium ${
                index <= currentSearch ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {search.query}
              </p>
              <p className={`text-xs ${
                index <= currentSearch ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {search.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-sm text-blue-700">
        {currentSearch >= searchPlan.length ? (
          'Generating report...'
        ) : (
          `Searching ${currentSearch + 1} of ${searchPlan.length}`
        )}
      </div>
    </div>
  );
};
```

### Research Results (`components/ResearchResults.tsx`)

```typescript
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, MessageCircle, ExternalLink } from 'lucide-react';
import { ResearchResult } from '../types/api';

interface ResearchResultsProps {
  result: ResearchResult;
  query: string;
  traceId?: string;
  onFollowUpClick: (question: string) => void;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({
  result,
  query,
  traceId,
  onFollowUpClick
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Research Summary</h2>
            <p className="text-blue-800 leading-relaxed">{result.shortSummary}</p>
            {traceId && (
              <a
                href={`https://platform.openai.com/traces/trace?trace_id=${traceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View OpenAI Trace
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full Report */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detailed Research Report</h2>
          <p className="text-sm text-gray-600 mt-1">Research query: "{query}"</p>
        </div>
        <div className="p-6">
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">{children}</h3>,
                p: ({ children }) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-200 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {children}
                  </pre>
                ),
              }}
            >
              {result.markdownReport}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Follow-up Questions */}
      {result.followUpQuestions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <MessageCircle className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Continue Your Research</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Click any question below to explore these topics further:
          </p>
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {result.followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick(question)}
                className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
              >
                <p className="text-blue-600 group-hover:text-blue-800 font-medium text-sm">
                  {question}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Main Research Bot Component (`components/ResearchBot.tsx`)

```typescript
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
```

## Backend API Requirements

Your backend server must implement these endpoints:

1. **POST `/api/research/stream`** - Streaming research endpoint with Server-Sent Events
2. **POST `/api/research`** - Non-streaming research endpoint (optional)
3. **GET `/api/health`** - Health check endpoint

### Vite Configuration (if using Vite)

Add this to your `vite.config.ts` to proxy API calls:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## Usage Instructions

1. Install the required dependencies
2. Copy all the component files to your project
3. Import and use the `ResearchBot` component in your application
4. Ensure your backend server is running and implements the required API endpoints
5. Configure your build tool to proxy `/api` requests to your backend server

### Basic Integration Example

```typescript
import React from 'react';
import { ResearchBot } from './components/ResearchBot';
import './styles.css'; // Include the CSS styles

function App() {
  return (
    <div className="App">
      {/* Your existing app content */}
      <ResearchBot />
    </div>
  );
}

export default App;
```

## Features

- **Real-time streaming**: Shows research progress as it happens
- **Interactive UI**: Beautiful, responsive design with Tailwind CSS
- **Error handling**: Comprehensive error states with retry functionality
- **Server status**: Automatic server connectivity monitoring
- **Follow-up questions**: Interactive buttons to continue research
- **Markdown rendering**: Rich text formatting for research reports
- **Progress tracking**: Visual indicators for search progress
- **Sample queries**: Helpful suggestions to get started

The system is fully self-contained and can be integrated into any React application with minimal configuration.