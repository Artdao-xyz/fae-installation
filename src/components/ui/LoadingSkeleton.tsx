export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
          >
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>

            {/* Metadata skeleton */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-2"></div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-14"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
