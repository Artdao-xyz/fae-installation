import { DataPoint as DataPointType } from '@/lib/api';
import { DATAPOINT_DIMENSIONS } from '@/constants/datapoint';

interface Position {
  x: number;
  y: number;
}

interface DataPointProps {
  dataPoint: DataPointType;
  onClick: (dataPoint: DataPointType) => void;
  position: Position;
}

export function DataPointComponent({ dataPoint, onClick, position }: DataPointProps) {
  const hasImage = dataPoint.Image && dataPoint.Image.trim() !== '';
  const dims = hasImage
    ? { width: DATAPOINT_DIMENSIONS.SQUARE.WIDTH, height: DATAPOINT_DIMENSIONS.SQUARE.HEIGHT }
    : { width: DATAPOINT_DIMENSIONS.RECT.WIDTH, height: DATAPOINT_DIMENSIONS.RECT.HEIGHT };
  
  return (
    <div 
      className={`absolute transition-all duration-300 hover:z-10 hover:scale-105 overflow-hidden cursor-pointer drop-shadow-md hover:drop-shadow-lg ${!hasImage ? 'border border-red-500' : ''}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dims.width}px`,
        height: `${dims.height}px`,
      }}
      onClick={() => onClick(dataPoint)}
    >
        {hasImage ? (
          // Image only - fixed height h-64
          <div className="overflow-hidden" style={{ width: `${dims.width}px`, height: `${dims.height}px` }}>
            <img
              src={dataPoint.Image}
              alt={dataPoint.Title}
              className="w-full h-full object-cover rounded-md hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                // Hide image if it fails to load and show title instead
                e.currentTarget.style.display = 'none';
                const titleDiv = e.currentTarget.nextElementSibling as HTMLElement;
                if (titleDiv) {
                  titleDiv.style.display = 'flex';
                }
              }}
            />
            {/* Hidden title that shows if image fails to load */}
            <div className="hidden w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center p-4">
              <h3 className="text-black text-base font-medium line-clamp-2 leading-tight text-center">
                {dataPoint.Title}
              </h3>
            </div>
          </div>
        ) : (
          // Title only - single line with max width md
          <div className="bg-white/60 flex items-center justify-center p-4" style={{ width: `${dims.width}px`, height: `${dims.height}px` }}>
            <h3 className="text-black text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis text-center">
              {dataPoint.Title}
            </h3>
          </div>
        )}
    </div>
  );
}
