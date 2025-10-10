'use client';

import { useState, useEffect, useRef } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer } from '@/components';
import { DataPoint as DataPointComponent } from './DataPoint';
import { PublicationList } from './PublicationList';

interface CanvasProps {
  dataPoints: DataPoint[];
}

interface PositionedDataPoint extends DataPoint {
  x: number;
  y: number;
  rotation: number;
}

export function Canvas({ dataPoints }: CanvasProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [positionedDataPoints, setPositionedDataPoints] = useState<PositionedDataPoint[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Generate random positions for data points with minimum distance
  const generateRandomPositions = (dataPoints: DataPoint[], canvasWidth: number, canvasHeight: number) => {
    const itemWidth = 200;
    const itemHeight = 250;
    const margin = 20;
    const minDistance = 300; // Minimum distance between centers of data points
    const maxAttempts = 100; // Maximum attempts to find a valid position
    
    const positionedItems: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    return dataPoints.map((dataPoint) => {
      let attempts = 0;
      let x: number = 0;
      let y: number = 0;
      let validPosition = false;
      
      // Try to find a position that maintains minimum distance from other items
      do {
        x = Math.random() * (canvasWidth - itemWidth - margin * 2) + margin;
        y = Math.random() * (canvasHeight - itemHeight - margin * 2) + margin;
        
        // Check if this position maintains minimum distance from existing items
        validPosition = positionedItems.every(existingItem => {
          const centerX1 = x + itemWidth / 2;
          const centerY1 = y + itemHeight / 2;
          const centerX2 = existingItem.x + existingItem.width / 2;
          const centerY2 = existingItem.y + existingItem.height / 2;
          
          const distance = Math.sqrt(
            Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2)
          );
          
          return distance >= minDistance;
        });
        
        attempts++;
      } while (!validPosition && attempts < maxAttempts);
      
      // If we couldn't find a valid position, use the last attempted position
      if (!validPosition) {
        console.warn(`Could not find valid position for item ${dataPoint.id} after ${maxAttempts} attempts`);
      }
      
      // Add this item to the positioned items list
      positionedItems.push({ x, y, width: itemWidth, height: itemHeight });
      
      return {
        ...dataPoint,
        x,
        y,
        rotation: (Math.random() - 0.5) * 30, // Random rotation between -15 and 15 degrees
      };
    });
  };

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
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-red-500 min-h-[600px]"
        style={{ position: 'relative' }}
      >
        {/* Background Pattern (optional) */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #3b82f6 2px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #8b5cf6 2px, transparent 2px)`,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0, 25px 25px'
          }} />
        </div>

        {/* Positioned Data Points */}
        {positionedDataPoints.map((positionedDataPoint) => (
          <div
            key={positionedDataPoint.id}
            className="absolute transition-all duration-300 hover:z-10"
            style={{
              left: `${positionedDataPoint.x}px`,
              top: `${positionedDataPoint.y}px`,
              transform: `rotate(${positionedDataPoint.rotation}deg)`,
              width: '200px',
              height: '250px',
            }}
          >
            <div 
              className="w-full h-full hover:scale-105 transition-transform duration-200"
              style={{ transform: `rotate(${-positionedDataPoint.rotation}deg)` }}
            >
              <DataPointComponent
                dataPoint={positionedDataPoint}
                onClick={handlePublicationClick}
              />
            </div>
          </div>
        ))}

        {/* Regenerate Button */}
        <button
          onClick={() => {
            if (canvasSize.width > 0 && canvasSize.height > 0) {
              const positioned = generateRandomPositions(dataPoints, canvasSize.width, canvasSize.height);
              setPositionedDataPoints(positioned);
            }
          }}
          className="absolute top-4 right-4 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg shadow-md border border-gray-200 transition-colors duration-200 flex items-center space-x-2"
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
