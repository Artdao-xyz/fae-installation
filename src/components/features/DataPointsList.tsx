'use client';

import { useState } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer, PublicationDetails } from '@/components';

interface DataPointsListProps {
  dataPoints: DataPoint[];
}

export function DataPointsList({ dataPoints }: DataPointsListProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handlePublicationClick = (publication: DataPoint) => {
    console.log('Publication clicked:', publication); 
    setSelectedPublication(publication);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPublication(null);
  };

  // Function to get engagement color classes and icon
  const getEngagementStyle = (engagement: string) => {
    switch (engagement.toLowerCase()) {
      case 'short read':
        return {
          color: 'bg-green-100 text-green-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'play':
        return {
          color: 'bg-purple-100 text-purple-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'build':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'long read':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'watch':
        return {
          color: 'bg-red-100 text-red-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: (
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  // Safety checks
  if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-lg">No publications available</div>
        <p className="text-gray-400 text-sm mt-2">
          There are no publications to display at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dataPoints.map((publication) => (
          <div
            key={publication.id}
            className="rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handlePublicationClick(publication)}
          >
            {/* Image */}
            {publication.Image && publication.Image.trim() !== '' ? (
              <div className="aspect-video overflow-hidden">
                <img
                  src={publication.Image}
                  alt={publication.Title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">No Image</p>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                    {publication.Title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {publication.Category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {publication.Category}
                      </span>
                    )}
                    {publication.Engagement && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEngagementStyle(publication.Engagement).color}`}>
                        {getEngagementStyle(publication.Engagement).icon}
                        {publication.Engagement}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {publication.Description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {publication.Description}
                </p>
              )}

              {/* Year and Format */}
              <div className="space-y-2 mb-4">
                {publication.Year && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {publication.Year}
                  </div>
                )}
                {publication.CurrentFormat && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    {publication.CurrentFormat.replace(/\n/g, ', ')}
                  </div>
                )}
              </div>

              {/* Links */}
              {publication.Links && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Links:</h4>
                  <div className="space-y-1">
                    {publication.Links.split('\n').map((link, index) => (
                      <a
                        key={index}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:underline truncate"
                      >
                        {link.trim()}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Created: {new Date(publication.createdAt).toLocaleDateString()}</div>
                <div>Published: {new Date(publication.publishedAt).toLocaleDateString()}</div>
              </div>

              {/* Debug info for each item */}
              <details className="mt-4 pt-4 border-t border-gray-200">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Debug Info
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(publication, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={selectedPublication?.Title || 'Publication Details'}
      >
        {selectedPublication && <PublicationDetails publication={selectedPublication} />}
      </Drawer>
    </div>
  );
}
