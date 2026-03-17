"use client";

import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

type FilterType = "briefing" | "paper" | "asset" | "community";

const typeColors = {
  briefing: {
    bg: "bg-[#1A00FF]/20",
    color: "text-[#1A00FF]"
  },
  paper: {
    bg: "bg-[#00DC00]/20", 
    color: "text-[#00DC00]"
  },
  asset: {
    bg: "bg-[#B200FF]/20",
    color: "text-[#B200FF]"
  },
  community: {
    bg: "bg-[#FF6B00]/20",
    color: "text-[#FF6B00]"
  }
};

interface FilterProps {
  title: string;
  type: FilterType;
  isSelected?: boolean;
  onToggle?: () => void;
}

export function Filter({ title, type, isSelected = true, onToggle }: FilterProps) {
  const [isVisible, setIsVisible] = useState(isSelected);
  const colors = typeColors[type];
  
  const handleToggle = () => {
    setIsVisible(!isVisible);
    onToggle?.();
  };
  
  return (
        <div className="flex items-stretch font-xs gap-1 leading-3">
                <button className="text-left flex-1 py-2.5 bg-[#F5F5F5] px-2.5 rounded-md">{title}</button>
                <button 
                  onClick={handleToggle}
                  className={`h-full px-2.5 rounded-lg cursor-pointer ${
                    isVisible 
                      ? `${colors.bg} ${colors.color}` 
                      : 'bg-transparent text-black'
                  }`}
                >
                  {isVisible ? <Eye size={16} /> : <EyeClosed size={16} />}
                </button>

        </div>
        );
}