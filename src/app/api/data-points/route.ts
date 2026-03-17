import { NextResponse } from 'next/server';
import { fetchDataPoints } from '@/lib/api';

/**
 * API route to fetch data points
 * This allows client components to fetch data through the API
 */
export async function GET() {
  try {
    const apiToken = process.env.API_TOKEN;
    
    if (!apiToken) {
      return NextResponse.json(
        { error: 'API_TOKEN environment variable is not set' },
        { status: 500 }
      );
    }

    const response = await fetchDataPoints(apiToken, 1);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data points',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

