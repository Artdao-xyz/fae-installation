import { Suspense } from 'react';
import { fetchDataPoints } from '@/lib/api';
import { Canvas, LoadingSkeleton, MainLayout, StatsGrid } from '@/components';

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
    // Use multiplier of 5 to prototype with 5 times the amount of data
    const response = await fetchDataPoints(apiToken, 5);
    dataPoints = response.data;
  } catch (err) {
    error = err instanceof Error ? err : new Error('Unknown error occurred');
  }

  return (
    <>
        {/* Canvas with random positioned data points */}
        <Suspense fallback={<LoadingSkeleton />}>
          {!error && dataPoints && Array.isArray(dataPoints) && dataPoints.length > 0 && (
              <Canvas dataPoints={dataPoints} />
          )}
        </Suspense>
        </>
  );
}
