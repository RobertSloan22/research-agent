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