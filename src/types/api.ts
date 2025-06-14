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