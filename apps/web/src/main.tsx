import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { PageLoader } from './components/common';
// Import feature barrels directly (not './features') so lazy routes stay out
// of the static module graph and Vite can code-split them.
import { DashboardPage } from './features/dashboard';
import './index.css';
import { ErrorBoundaryProvider } from './providers';

// The Scalar API reference is heavy (~3.5 MB minified) — load it only when
// the route is visited.
const ApiDocsPage = lazy(() =>
  import('./features/api-docs').then((m) => ({ default: m.ApiDocsPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundaryProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route
              path="/api-docs"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ApiDocsPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundaryProvider>
  </React.StrictMode>,
);
