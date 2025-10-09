/**
 * API utility functions for data fetching
 */

export interface DataPoint {
  id: number;
  documentId: string;
  Title: string;
  Description: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  CurrentFormat: string;
  Text: string;
  Network: string | null;
  Year: number;
  Image: string;
  Links: string;
  Category: string;
  Engagement: string;
  Enumeration: string | null;
}

export interface ApiResponse {
  data: DataPoint[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Fetches data points from the API with authentication
 * @param token - Bearer token for authentication
 * @returns Promise<ApiResponse> - The API response data
 */
export async function fetchDataPoints(token: string): Promise<ApiResponse> {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:1337';
  const url = `${baseUrl}/api/data-points`;

  // Clean the token (remove any extra spaces)
  const cleanToken = token.trim();

  try {
    console.log('🔍 Attempting to fetch from:', url);
    console.log('🔑 Using token:', cleanToken.substring(0, 10) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Next.js-App/1.0',
      },
      // Cache for 5 minutes, revalidate on demand
      next: { 
        revalidate: 300,
        tags: ['data-points']
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched data points:', data);
    console.log('📊 Data type:', typeof data);
    console.log('📊 Is array:', Array.isArray(data));
    console.log('📊 Keys:', data ? Object.keys(data) : 'No keys');
    
    // Return the data as-is since it matches our expected structure
    return data;
  } catch (error) {
    console.error('❌ Error fetching data points:', error);
    throw new Error(`Failed to fetch data points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Revalidates the data points cache
 * This can be called from API routes or server actions
 */
export async function revalidateDataPoints() {
  const { revalidateTag } = await import('next/cache');
  revalidateTag('data-points');
}
