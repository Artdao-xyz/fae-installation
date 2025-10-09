import { DataPoint } from '@/lib/api';

interface DataPointsListProps {
  dataPoints: DataPoint[];
}

export function DataPointsList({ dataPoints }: DataPointsListProps) {
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200"
          >
            {/* Image */}
            {publication.Image && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={publication.Image}
                  alt={publication.Title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {publication.Title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {publication.Category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {publication.Category}
                      </span>
                    )}
                    {publication.Engagement && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {publication.Engagement}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {publication.Description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {publication.Description}
                </p>
              )}

              {/* Year and Format */}
              <div className="space-y-2 mb-4">
                {publication.Year && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    {publication.Year}
                  </div>
                )}
                {publication.CurrentFormat && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Links:</h4>
                  <div className="space-y-1">
                    {publication.Links.split('\n').map((link, index) => (
                      <a
                        key={index}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {link.trim()}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>Created: {new Date(publication.createdAt).toLocaleDateString()}</div>
                <div>Published: {new Date(publication.publishedAt).toLocaleDateString()}</div>
              </div>

              {/* Debug info for each item */}
              <details className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                  Debug Info
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(publication, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
