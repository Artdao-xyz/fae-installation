/**
 * API utility functions for data fetching
 */

export interface Thumbnail {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  };
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface DataPoint {
  id: number;
  documentId: string;
  Title: string;
  Description: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  CurrentFormat?: string;
  Text?: string;
  Network: string | null;
  Year: number | string;
  Image?: string | null;
  Thumbnail?: Thumbnail | null;
  Links?: string;
  Category: string;
  Engagement: string;
  Enumeration: string | null;
}

/**
 * Helper function to get image URL from a DataPoint
 * Checks both Image (string) and Thumbnail (object) fields
 */
export function getImageUrl(dataPoint: DataPoint, baseUrl?: string): string | null {
  const apiBaseUrl = baseUrl || process.env.API_BASE_URL || 'http://localhost:1337';
  
  // Check Thumbnail first (object with url)
  if (dataPoint.Thumbnail?.url) {
    // If url starts with /, prepend base URL
    if (dataPoint.Thumbnail.url.startsWith('/')) {
      return `${apiBaseUrl}${dataPoint.Thumbnail.url}`;
    }
    return dataPoint.Thumbnail.url;
  }
  
  // Check Image (string)
  if (dataPoint.Image && dataPoint.Image.trim() !== '' && dataPoint.Image !== 'null') {
    // If url starts with /, prepend base URL
    if (dataPoint.Image.startsWith('/')) {
      return `${apiBaseUrl}${dataPoint.Image}`;
    }
    return dataPoint.Image;
  }
  
  return null;
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
export async function fetchDataPoints(token: string, multiplier: number = 1): Promise<ApiResponse> {
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

    const data: ApiResponse = await response.json();
    console.log('✅ Successfully fetched data points:', data);
    console.log('📊 Data type:', typeof data);
    console.log('📊 Is array:', Array.isArray(data));
    console.log('📊 Keys:', data ? Object.keys(data) : 'No keys');
    
    // Apply multiplier by duplicating items with unique ids/documentIds when requested
    if (Number.isFinite(multiplier) && multiplier > 1 && Array.isArray(data.data)) {
      const original = data.data;
      const copies: DataPoint[] = [];
      let nextIdBase = Math.max(0, ...original.map(d => d.id)) + 1;
      for (let m = 0; m < multiplier; m++) {
        const batch = original.map((dp, idx) => ({
          ...dp,
          id: m === 0 ? dp.id : nextIdBase + idx + m * original.length,
          documentId: m === 0 ? dp.documentId : `${dp.documentId}_copy_${m}`
        }));
        copies.push(...batch);
      }
      const multiplied: ApiResponse = {
        data: copies,
        meta: {
          pagination: {
            page: 1,
            pageSize: copies.length,
            pageCount: 1,
            total: copies.length,
          }
        }
      };
      return multiplied;
    }

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
