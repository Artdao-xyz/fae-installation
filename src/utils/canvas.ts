import { DataPoint } from '@/lib/api';

export interface ItemDimensions {
  width: number;
  height: number;
}

export interface PositionedItem {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedDataPoint extends DataPoint {
  x: number;
  y: number;
}

/**
 * Get real dimensions for each data point type
 */
export const getItemDimensions = (dataPoint: DataPoint): ItemDimensions => {
  const hasImage = dataPoint.Image && dataPoint.Image.trim() !== '';
  return {
    width: 384, // max-w-sm for both types
    height: hasImage ? 256 : 60 // h-64 for images, ~60px for text
  };
};

/**
 * Check if two rectangles overlap
 */
export const checkRectCollision = (rect1: PositionedItem, rect2: PositionedItem): boolean => {
  return !(rect1.x + rect1.width < rect2.x || 
           rect1.x > rect2.x + rect2.width || 
           rect1.y + rect1.height < rect2.y || 
           rect1.y > rect2.y + rect2.height);
};

/**
 * Generate random positions for data points with improved collision detection
 */
export const generateRandomPositions = (dataPoints: DataPoint[], canvasWidth: number, canvasHeight: number): PositionedDataPoint[] => {
  const margin = 20;
  const maxAttempts = 100; // Maximum attempts to find a valid position
  
  const positionedItems: PositionedItem[] = [];
  
  return dataPoints.map((dataPoint) => {
    let attempts = 0;
    let x: number = 0;
    let y: number = 0;
    let validPosition = false;
    
    // Get real dimensions for this data point
    const dimensions = getItemDimensions(dataPoint);
    const { width: itemWidth, height: itemHeight } = dimensions;
    
    // Try to find a position that doesn't collide with existing items
    do {
      x = Math.random() * (canvasWidth - itemWidth - margin * 2) + margin;
      y = Math.random() * (canvasHeight - itemHeight - margin * 2) + margin;
      
      // Create rectangle for current item
      const currentRect: PositionedItem = { x, y, width: itemWidth, height: itemHeight };
      
      // Check collision with all existing items
      validPosition = positionedItems.every(existingItem => {
        return !checkRectCollision(currentRect, existingItem);
      });
      
      attempts++;
    } while (!validPosition && attempts < maxAttempts);
    
    // Fallback: use the last attempted position even if it collides
    if (!validPosition) {
      console.warn(`Could not find valid position for item ${dataPoint.id} after ${maxAttempts} attempts, using last position`);
    }
    
    // Add this item to the positioned items list
    positionedItems.push({ x, y, width: itemWidth, height: itemHeight });
    
    return {
      ...dataPoint,
      x,
      y,
    };
  });
};
