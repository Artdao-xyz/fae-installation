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
        <h1 className="text-3xl font-bold text-gray-900">
          Publications
        </h1>
        <p className="mt-2 text-gray-600">
          Discover publications and resources from the Future Art Ecosystems project
        </p>
      </div>

        {/* Simple Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading data
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Publications List with Suspense for loading state */}
        <Suspense fallback={<LoadingSkeleton />}>
          {!error && dataPoints && Array.isArray(dataPoints) && dataPoints.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Publications ({dataPoints.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
              <DataPointsList dataPoints={dataPoints} />
            </div>
          )}
        </Suspense>
    </MainLayout>
  );
}
