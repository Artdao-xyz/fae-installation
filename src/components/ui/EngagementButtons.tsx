import { BookOpenText, Play, Globe, Wrench, Eye } from "lucide-react";
import React from "react";

interface EngagementButtonsProps {
  engagementTypes?: string[];
  selectedEngagement?: string | null;
  onEngagementClick?: (engagement: string) => void;
}

interface EngagementConfig {
  icon: React.ReactNode;
  label: string;
  bgColor: string;
}

const getEngagementConfig = (engagement: string): EngagementConfig => {
  const normalized = engagement.toLowerCase().trim();
  
  switch (normalized) {
    case 'short read':
      return {
        icon: <BookOpenText size={16} />,
        label: 'Short Read',
        bgColor: 'bg-green-600 hover:bg-green-700',
      };
    case 'long read':
      return {
        icon: <BookOpenText size={16} />,
        label: 'Long Read',
        bgColor: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'play':
      return {
        icon: <Play size={16} />,
        label: 'Play',
        bgColor: 'bg-purple-600 hover:bg-purple-700',
      };
    case 'watch':
      return {
        icon: <Eye size={16} />,
        label: 'Watch',
        bgColor: 'bg-red-600 hover:bg-red-700',
      };
    case 'build':
      return {
        icon: <Wrench size={16} />,
        label: 'Build',
        bgColor: 'bg-orange-600 hover:bg-orange-700',
      };
    default:
      return {
        icon: <Globe size={16} />,
        label: engagement,
        bgColor: 'bg-gray-600 hover:bg-gray-700',
      };
  }
};

export function EngagementButtons({ 
  engagementTypes = [], 
  selectedEngagement = null,
  onEngagementClick 
}: EngagementButtonsProps) {
  if (engagementTypes.length === 0) {
    return null;
  }

  const handleClick = (engagement: string) => {
    onEngagementClick?.(engagement);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {engagementTypes.map((engagement) => {
        const config = getEngagementConfig(engagement);
        const isSelected = selectedEngagement?.toLowerCase() === engagement.toLowerCase();
        
        return (
          <button
            key={engagement}
            onClick={() => handleClick(engagement)}
            className={`
              bg-[#1900FF] hover:bg-[#1400CC]
              ${isSelected ? 'ring-2 ring-offset-2 ring-offset-white ring-gray-900' : ''}
              cursor-pointer text-white rounded-md p-2 min-w-[100px] inline-flex justify-center items-center gap-2 transition-all
            `}
            type="button"
          >
            {config.icon}
            {config.label}
          </button>
        );
      })}
    </div>
  );
}