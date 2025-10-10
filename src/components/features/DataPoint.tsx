import { DataPoint as DataPointType } from '@/lib/api';

interface DataPointProps {
  dataPoint: DataPointType;
  onClick: (dataPoint: DataPointType) => void;
}

export function DataPoint({ dataPoint, onClick }: DataPointProps) {
  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer border border-red-500 h-full flex flex-col"
      onClick={() => onClick(dataPoint)}
    >
      {/* Image */}
      {dataPoint.Image && dataPoint.Image.trim() !== '' ? (
        <div className="flex-1 overflow-hidden">
          <img
            src={dataPoint.Image}
            alt={dataPoint.Title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              // Hide image if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm font-medium">No Image</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="p-2 sm:p-3 lg:p-4 flex-shrink-0">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
          {dataPoint.Title}
        </h3>
      </div>
    </div>
  );
}
