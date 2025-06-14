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