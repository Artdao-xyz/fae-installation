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
      
        {/* Publications List with Suspense for loading state */}
        <Suspense fallback={<LoadingSkeleton />}>
          {!error && dataPoints && Array.isArray(dataPoints) && dataPoints.length > 0 && (
              <DataPointsList dataPoints={dataPoints} />
          )}
        </Suspense>
    </MainLayout>
  );
}
