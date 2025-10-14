'use client';

import { useEffect, useRef, useState } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer } from '@/components';
import { PublicationList } from './PublicationList';
import { Search } from './Search';
import { DATAPOINT_DIMENSIONS } from '@/constants/datapoint';
import { CANVAS_EDGE_MARGIN, CANVAS_GAP, CANVAS_MAX_ITEMS, CANVAS_USE_RANDOM_WALKER } from '@/constants/canvas';
import { computePositions, PositionedItem } from '@/utils/canvas';
import { DataPointComponent } from './DataPointComponent';


interface CanvasProps {
  dataPoints: DataPoint[];
}

export function Canvas({ dataPoints }: CanvasProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<PositionedItem[]>([]);

  const MAX_ITEMS = CANVAS_MAX_ITEMS;
  const USE_RANDOM_WALKER = CANVAS_USE_RANDOM_WALKER;
  const GAP = CANVAS_GAP;
  const EDGE_MARGIN = CANVAS_EDGE_MARGIN;

  

  useEffect(() => {
    const measureAndPlace = () => {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      // Reserve 100px bottom space for the Search component
      const adjustedHeight = Math.max(0, height - 120);
      const innerWidth = Math.max(0, width - EDGE_MARGIN * 2);
      const innerHeight = Math.max(0, adjustedHeight - EDGE_MARGIN * 2);
      if (innerWidth <= 0 || innerHeight <= 0) return;
      const count = Math.min(MAX_ITEMS, Array.isArray(dataPoints) ? dataPoints.length : 0);
      // Size resolver based on API item: with image -> square, without -> rect
      const getItemSizeAt = (i: number) => {
        const dp = dataPoints[i];
        const hasImage = !!(dp && dp.Image && dp.Image.trim() !== '');
        return hasImage
          ? { width: DATAPOINT_DIMENSIONS.SQUARE.WIDTH, height: DATAPOINT_DIMENSIONS.SQUARE.HEIGHT }
          : { width: DATAPOINT_DIMENSIONS.RECT.WIDTH, height: DATAPOINT_DIMENSIONS.RECT.HEIGHT };
      };

      const positions = computePositions(innerWidth, innerHeight, {
        count,
        gap: GAP,
        algorithm: USE_RANDOM_WALKER ? 'walker' : 'random',
        getItemSizeAt,
      }).map(p => ({ ...p, x: p.x + EDGE_MARGIN, y: p.y + EDGE_MARGIN }));
      setItems(positions);
    };

    measureAndPlace();
    const onResize = () => measureAndPlace();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [dataPoints]);

  const handlePublicationClick = (publication: DataPoint) => {
    setSelectedPublication(publication);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPublication(null);
  };

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
    <div className="h-full w-full flex flex-col overflow-x-hidden">
      {/* Masonry grid using CSS columns */}

      <div ref={containerRef} className='flex-1 relative border-2 border-red-500 overflow-hidden'>
        {items.map((it, idx) => {
          const dp = dataPoints[idx];
          return (
            <DataPointComponent
              key={idx}
              dataPoint={dp}
              onClick={() => dp && handlePublicationClick(dp)}
              position={{ x: it.x, y: it.y }}
            />
          );
        })}
      </div>

      <Search />

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
