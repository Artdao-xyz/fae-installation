'use client';

import { useState } from 'react';
import { DataPoint } from '@/lib/api';
import { Drawer } from '@/components';
import { DataPoint as DataPointComponent } from './DataPoint';
import { PublicationList } from './PublicationList';

interface DataPointsListProps {
  dataPoints: DataPoint[];
}

export function DataPointsList({ dataPoints }: DataPointsListProps) {
  const [selectedPublication, setSelectedPublication] = useState<DataPoint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    <div className="h-full w-full flex flex-col border border-red-500">
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 border border-blue-500">
        {dataPoints.map((publication) => (
          <DataPointComponent
            key={publication.id}
            dataPoint={publication}
            onClick={handlePublicationClick}
          />
        ))}
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
