'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer } from '@/components';
import { PublicationList } from './PublicationList';
import { Search } from './Search';
import { DATAPOINT_DIMENSIONS } from '@/constants/datapoint';
import { CANVAS_EDGE_MARGIN, CANVAS_GAP, CANVAS_MAX_ITEMS, CANVAS_USE_RANDOM_WALKER } from '@/constants/canvas';
import { computePositions, getSelectedGroupIndices, PositionedItem } from '@/utils/canvas';
import { DataPointComponent } from './DataPointComponent';
import { CanvasLeva } from './CanvasLeva';


interface CanvasProps {
  dataPoints: DataPoint[];
}

export function Canvas({ dataPoints }: CanvasProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<PositionedItem[]>([]);

  const MAX_ITEMS = CANVAS_MAX_ITEMS;
  const USE_RANDOM_WALKER = CANVAS_USE_RANDOM_WALKER;
  const GAP = CANVAS_GAP;
  const EDGE_MARGIN = CANVAS_EDGE_MARGIN;
  
  // Get selected group indices for blur logic
  const selectedGroupIndices = useMemo(() => {
    return getSelectedGroupIndices(dataPoints.length, selectedGroup);
  }, [dataPoints.length, selectedGroup]);

  const measureAndPlace = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const adjustedHeight = Math.max(0, height - 120);
    const innerWidth = Math.max(0, width - EDGE_MARGIN * 2);
    const innerHeight = Math.max(0, adjustedHeight - EDGE_MARGIN * 2);
    if (innerWidth <= 0 || innerHeight <= 0) return;
    const count = Math.min(MAX_ITEMS, dataPoints.length);
    const getItemSizeAt = (i: number) => {
      const dp = dataPoints[i];
      const hasImage = !!(dp && dp.Image && dp.Image.trim() !== '');
      return hasImage
        ? { width: DATAPOINT_DIMENSIONS.SQUARE.WIDTH, height: DATAPOINT_DIMENSIONS.SQUARE.HEIGHT }
        : { width: DATAPOINT_DIMENSIONS.RECT.WIDTH, height: DATAPOINT_DIMENSIONS.RECT.HEIGHT };
    };

    let positions: PositionedItem[];
    
    if (selectedGroup === 0) {
      // All items: use normal positioning
      positions = computePositions(innerWidth, innerHeight, {
        count,
        gap: GAP,
        algorithm: USE_RANDOM_WALKER ? 'walker' : 'random',
        getItemSizeAt,
      }).map(p => ({ ...p, x: p.x + EDGE_MARGIN, y: p.y + EDGE_MARGIN }));
    } else {
      // Group selection: cluster selected items in center, keep others in original positions
      const groupIndices = Array.from(selectedGroupIndices);
      
      // First, generate all positions normally
      const allPositions = computePositions(innerWidth, innerHeight, {
        count,
        gap: GAP,
        algorithm: USE_RANDOM_WALKER ? 'walker' : 'random',
        getItemSizeAt,
      }).map(p => ({ ...p, x: p.x + EDGE_MARGIN, y: p.y + EDGE_MARGIN }));
      
      // Generate cluster positions for selected items using the same algorithm
      const clusterPositions = computePositions(innerWidth, innerHeight, {
        count: groupIndices.length,
        gap: GAP,
        algorithm: USE_RANDOM_WALKER ? 'walker' : 'random',
        getItemSizeAt: (i) => getItemSizeAt(groupIndices[i]),
      }).map(p => ({ ...p, x: p.x + EDGE_MARGIN, y: p.y + EDGE_MARGIN }));
      
      // Create final positions array
      positions = Array.from({ length: count }, (_, i) => {
        if (selectedGroupIndices.has(i)) {
          // This item is in the selected group, use cluster position
          const groupIndex = groupIndices.indexOf(i);
          return clusterPositions[groupIndex] || allPositions[i];
        } else {
          // This item is not selected, use original position
          return allPositions[i];
        }
      });
    }
    
    setItems(positions);
  }, [dataPoints, EDGE_MARGIN, GAP, MAX_ITEMS, USE_RANDOM_WALKER, selectedGroup, selectedGroupIndices]);

  useEffect(() => {
    measureAndPlace();
    const onResize = () => measureAndPlace();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measureAndPlace]);

  const shuffle = measureAndPlace;

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

      <div ref={containerRef} className='flex-1 relative overflow-hidden'>
        {items.map((it, idx) => {
          const dp = dataPoints[idx];
          const isSelected = selectedGroupIndices.has(idx);
          
          // Safety check: ensure item and dataPoint exist
          if (!it || !dp) return null;
          
          return (
            <DataPointComponent
              key={idx}
              dataPoint={dp}
              onClick={() => dp && handlePublicationClick(dp)}
              position={{ x: it.x, y: it.y }}
              isActive={isSelected}
              index={idx}
            />
          );
        })}
      </div>
      <CanvasLeva onShuffle={shuffle} onGroupChange={setSelectedGroup} />

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
