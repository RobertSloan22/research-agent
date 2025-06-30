# Research Bot Frontend

A modern React frontend for the AI Research Bot that provides an intuitive interface for conducting AI-powered research.

## Features

- **Interactive Research Interface**: Clean, modern UI for submitting research queries
- **Real-time Progress Tracking**: Visual feedback during the research process
- **Rich Report Display**: Formatted markdown reports with proper typography
- **Follow-up Questions**: One-click access to suggested follow-up research topics
- **Server Status Monitoring**: Visual indicators for backend connectivity
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Error Handling**: Graceful error states with retry functionality
- **OpenAI Tracing**: Direct links to OpenAI trace logs for debugging

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Make sure the backend is running**:

   ```bash
   # In the parent directory
   npm run server
   ```

4. **Open your browser** to http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # React components
│   ├── ResearchBot.tsx     # Main application component
│   ├── ResearchResults.tsx # Results display component
│   ├── SearchProgress.tsx  # Progress indicator
│   ├── LoadingSpinner.tsx  # Loading states
│   └── ErrorDisplay.tsx    # Error handling
├── types/              # TypeScript type definitions
│   └── api.ts             # API response types
├── utils/              # Utility functions
│   └── api.ts             # API client
├── App.tsx             # Root component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## API Integration

The frontend communicates with the research bot server via a proxy configuration in Vite. All API calls are made to `/api/*` which proxies to `http://localhost:3001`.

### Key Components

- **ApiClient**: Handles HTTP requests to the research server
- **ResearchBot**: Main component orchestrating the research flow
- **ResearchResults**: Renders formatted research reports
- **SearchProgress**: Shows real-time research progress

## Styling

The frontend uses:

- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **Custom animations** for smooth user interactions
- **Responsive design** patterns for all screen sizes

## Production Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Serve the `dist` folder** with any static file server

3. **Configure API proxy** in your web server to forward `/api/*` requests to your research bot server

## Environment Configuration

The frontend automatically detects the research server status and provides appropriate feedback to users when the server is offline.

For production deployments, update the API proxy configuration in `vite.config.ts` to point to your production research server.# research-agent
