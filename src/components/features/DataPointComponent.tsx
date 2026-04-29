import { DataPoint as DataPointType } from '@/lib/api';
import { DATAPOINT_DIMENSIONS } from '@/constants/datapoint';
import { DataPointGlyph } from './DataPointGlyph';

interface Position {
  x: number;
  y: number;
}

interface DataPointProps {
  dataPoint: DataPointType;
  onClick: (dataPoint: DataPointType) => void;
  position: Position;
  isActive?: boolean;
  index?: number; // Add index for random color generation
}

export function DataPointComponent({ dataPoint, onClick, position, isActive = true, index = 0 }: DataPointProps) {
  const hasImage = dataPoint.Image && dataPoint.Image.trim() !== '';
  const dims = hasImage
    ? { width: DATAPOINT_DIMENSIONS.SQUARE.WIDTH, height: DATAPOINT_DIMENSIONS.SQUARE.HEIGHT }
    : { width: DATAPOINT_DIMENSIONS.RECT.WIDTH, height: DATAPOINT_DIMENSIONS.RECT.HEIGHT };
  
  // Generate consistent random color based on index
  const borderColors = ['border-red-500', 'border-green-500', 'border-blue-500'];
  const borderColor = borderColors[index % 3];
  
  return (
    <div 
      className={`absolute transition-all duration-300 hover:z-10 hover:scale-105 cursor-pointer drop-shadow-md hover:drop-shadow-lg ${!isActive ? 'blur-sm opacity-50' : ''}`}
      style={{ 
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={() => onClick(dataPoint)}
    >
        {hasImage ? (
          // Image only - fixed height h-64
          <div className="overflow-hidden rounded-md hover:bg-white/20 transition-colors duration-200 p-4" style={{ width: `${dims.width}px`, height: `${dims.height}px` }}>
            <img
              src={dataPoint.Image}
              alt={dataPoint.Title}
              className="h-full object-cover rounded-md hover:scale-105 transition-transform duration-200"
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
          // Title with glyph outside - flex row layout
          <div className="flex items-center">
            <div className={`rounded-full border ${borderColor} bg-white/80 p-2 flex items-center justify-center`}>
              <DataPointGlyph category={dataPoint.Category} size={20} />
            </div>
            <div className={`bg-white/60 border ${borderColor} flex items-center justify-center p-3`} style={{ width: `${dims.width}px`, height: `${dims.height}px` }}>
              <h3 className="text-black text-base font-medium whitespace-nowrap overflow-hidden text-ellipsis text-center">
                {dataPoint.Title}
              </h3>
            </div>
          </div>
        )}
    </div>
  );
}
