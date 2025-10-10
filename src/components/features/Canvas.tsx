'use client';

import { useState, useEffect, useRef } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer } from '@/components';
import { DataPoint as DataPointComponent } from './DataPoint';
import { PublicationList } from './PublicationList';
import { generateRandomPositions, PositionedDataPoint } from '@/utils/canvas';

interface CanvasProps {
  dataPoints: DataPoint[];
}


export function Canvas({ dataPoints }: CanvasProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [positionedDataPoints, setPositionedDataPoints] = useState<PositionedDataPoint[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });


  // Update canvas size and regenerate positions when window resizes
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial size
    updateCanvasSize();

    // Add resize listener
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Generate positions when canvas size changes or data points change
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0 && dataPoints.length > 0) {
      const positioned = generateRandomPositions(dataPoints, canvasSize.width, canvasSize.height);
      setPositionedDataPoints(positioned);
    }
  }, [canvasSize, dataPoints]);

  const handlePublicationClick = (publication: DataPoint) => {
    console.log('Publication clicked:', publication);
    setSelectedPublication(publication);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPublication(null);
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
    <div className="h-full w-full flex flex-col">
      {/* Canvas Container */}
      <div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden min-h-[600px]"
        style={{ position: 'relative' }}
      >


        {/* Positioned Data Points */}
        {positionedDataPoints.map((positionedDataPoint) => (
          <DataPointComponent
            key={positionedDataPoint.id}
            dataPoint={positionedDataPoint}
            onClick={handlePublicationClick}
            position={{
              x: positionedDataPoint.x,
              y: positionedDataPoint.y
            }}
          />
        ))}

        {/* Regenerate Button */}
        <button
          onClick={() => {
            if (canvasSize.width > 0 && canvasSize.height > 0) {
              const positioned = generateRandomPositions(dataPoints, canvasSize.width, canvasSize.height);
              setPositionedDataPoints(positioned);
            }
          }}
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Shuffle</span>
        </button>
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={selectedPublication?.Title || 'Publication Details'}
      >
        {selectedPublication && <PublicationList publication={selectedPublication} />}
      </Drawer>
    </div>
  );
}
