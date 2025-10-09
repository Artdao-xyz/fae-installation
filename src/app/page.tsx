import { Suspense } from 'react';
import { fetchDataPoints } from '@/lib/api';
import { DataPointsList, LoadingSkeleton, MainLayout, StatsGrid } from '@/components';

/**
 * Main page component that fetches and displays data points
 * This is a Server Component that runs on the server
 */
export default async function Home() {
  // Get the API token from environment variables
  const apiToken = process.env.API_TOKEN;
  
  if (!apiToken) {
    throw new Error('API_TOKEN environment variable is not set');
  }

  let dataPoints;
  let error: Error | null = null;

  try {
    const response = await fetchDataPoints(apiToken);
    dataPoints = response.data;
  } catch (err) {
    error = err instanceof Error ? err : new Error('Unknown error occurred');
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Publications
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover publications and resources from the Future Art Ecosystems project
        </p>
      </div>

        {/* Simple Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Raw Data Display for Debugging */}
        {!error && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Raw API Response (Debug)
            </h2>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto">
              <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {JSON.stringify(dataPoints, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Publications List with Suspense for loading state */}
        <Suspense fallback={<LoadingSkeleton />}>
          {!error && dataPoints && Array.isArray(dataPoints) && dataPoints.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Publications ({dataPoints.length})
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
              <DataPointsList dataPoints={dataPoints} />
            </div>
          )}
        </Suspense>

        {/* Stats Summary */}
        {!error && dataPoints && dataPoints.length > 0 && (
          <div className="mt-8">
            <StatsGrid
              stats={[
                {
                  title: 'Total Publications',
                  value: dataPoints.length,
                  icon: (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  color: 'blue'
                },
                {
                  title: 'Categories',
                  value: new Set(dataPoints.map(point => point.Category).filter(Boolean)).size,
                  icon: (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ),
                  color: 'green'
                },
                {
                  title: 'Years Covered',
                  value: new Set(dataPoints.map(point => point.Year).filter(Boolean)).size,
                  icon: (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  ),
                  color: 'purple'
                }
              ]}
            />
          </div>
        )}
    </MainLayout>
  );
}
