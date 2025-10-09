'use client';

import { DataPoint } from '@/lib/api';

interface PublicationDetailsProps {
  publication: DataPoint;
}

export function PublicationDetails({ publication }: PublicationDetailsProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-4 overflow-auto">
      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
        {JSON.stringify(publication, null, 2)}
      </pre>
    </div>
  );
}
