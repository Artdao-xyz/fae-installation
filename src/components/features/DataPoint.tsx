import { DataPoint as DataPointType } from '@/lib/api';

interface DataPointProps {
  dataPoint: DataPointType;
  onClick: (dataPoint: DataPointType) => void;
}

export function DataPoint({ dataPoint, onClick }: DataPointProps) {
  return (
    <div
      className="rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={() => onClick(dataPoint)}
    >
      {/* Image */}
      {dataPoint.Image && dataPoint.Image.trim() !== '' ? (
        <div className="aspect-video overflow-hidden">
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
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium">No Image</p>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {dataPoint.Title}
        </h3>
      </div>
    </div>
  );
}
