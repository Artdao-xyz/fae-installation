"use client";

import { useState, useMemo, useEffect } from 'react';
import { DataPoint, getImageUrl } from '@/lib/api';
import { SearchTest } from '@/components/features/SearchTest';
import Image from 'next/image';

/**
 * Search test page - allows real-time search through data points
 */
export default function SearchTestPage() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEngagement, setSelectedEngagement] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data points on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/data-points');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Failed to load data');
        }

        const data = await response.json();
        setDataPoints(data.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Get unique engagement types from data
  const engagementTypes = useMemo(() => {
    const engagements = dataPoints
      .map(item => item.Engagement)
      .filter(Boolean) as string[];
    return Array.from(new Set(engagements)).sort();
  }, [dataPoints]);

  // Get unique categories from data (briefing, paper, asset, community)
  const categories = useMemo(() => {
    const cats = dataPoints
      .map(item => item.Category)
      .filter(Boolean) as string[];
    // Filter only the categories we want: briefing, paper, asset, community
    const validCategories = ['briefing', 'paper', 'asset', 'community'];
    return Array.from(new Set(cats))
      .filter(cat => validCategories.includes(cat.toLowerCase()))
      .sort();
  }, [dataPoints]);

  // Filter data points based on search query, selected engagement, and selected categories
  const filteredDataPoints = useMemo(() => {
    let filtered = dataPoints;

    // Filter by engagement if selected
    if (selectedEngagement) {
      filtered = filtered.filter((item) => 
        item.Engagement?.toLowerCase() === selectedEngagement.toLowerCase()
      );
    }

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) => 
        item.Category && selectedCategories.includes(item.Category)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      filtered = filtered.filter((item) => {
        // Search in multiple fields
        const searchableText = [
          item.Title,
          item.Description,
          item.Text,
          item.Category,
          item.Engagement,
          item.Network,
          item.CurrentFormat,
          item.Year?.toString(),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    return filtered;
  }, [dataPoints, searchQuery, selectedEngagement, selectedCategories]);

  const handleEngagementClick = (engagement: string) => {
    // Toggle: if already selected, deselect; otherwise select
    if (selectedEngagement?.toLowerCase() === engagement.toLowerCase()) {
      setSelectedEngagement(null);
    } else {
      setSelectedEngagement(engagement);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-2">Error loading data:</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden relative">
      {/* Search Component - Fixed at bottom */}
      <SearchTest
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={() => {
          setSearchQuery('');
          setSelectedEngagement(null);
          setSelectedCategories([]);
        }}
        resultsCount={filteredDataPoints.length}
        totalCount={dataPoints.length}
        engagementTypes={engagementTypes}
        selectedEngagement={selectedEngagement}
        onEngagementClick={handleEngagementClick}
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      {/* Results Grid - Scrollable area above search */}
      <div className="flex-1 overflow-y-auto pb-80">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {filteredDataPoints.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No results found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try different search terms
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredDataPoints.map((item) => {
                const imageUrl = getImageUrl(item);
                const hasImage = imageUrl !== null;
                
                return (
                  <div
                    key={item.id}
                    className={`bg-white border border-gray-200 rounded-lg overflow-hidden aspect-square flex flex-col hover:shadow-md transition-shadow cursor-pointer group ${
                      hasImage ? 'p-0' : 'p-4'
                    }`}
                  >
                    {hasImage ? (
                      <div className="relative w-full h-full flex flex-col">
                        <div className="relative flex-1 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={item.Title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 20vw, 16vw"
                            unoptimized
                          />
                        </div>
                        {/* Text always visible at bottom in black */}
                        <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm p-3 flex flex-col">
                          <h3 className="text-gray-900 text-sm font-semibold line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                            {item.Title}
                          </h3>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.Category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {item.Category}
                              </span>
                            )}
                            {item.Engagement && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {item.Engagement}
                              </span>
                            )}
                          </div>
                          {item.Year && (
                            <span className="text-gray-500 text-xs">{item.Year}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                          {item.Title}
                        </h3>
                        
                        {item.Description && (
                          <p className="text-xs text-gray-600 line-clamp-3 mb-3 flex-1">
                            {item.Description}
                          </p>
                        )}

                        <div className="mt-auto space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {item.Category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {item.Category}
                              </span>
                            )}
                            {item.Engagement && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {item.Engagement}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            {item.Year && <span>{item.Year}</span>}
                            {item.Network && <span className="truncate ml-2">{item.Network}</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

