export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Future Art Ecosystems
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Publications and resources
            </p>
          </div>
          
          {/* Future: Navigation menu, search, theme toggle, etc. */}
          <div className="flex items-center space-x-4">
            {/* Placeholder for future navigation items */}
          </div>
        </div>
      </div>
    </header>
  );
}
