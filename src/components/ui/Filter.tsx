"use client";

import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

type FilterType = "mission" | "vector" | "theme";

const typeColors = {
  mission: {
    bg: "bg-[#1A00FF]/20",
    color: "text-[#1A00FF]"
  },
  vector: {
    bg: "bg-[#00DC00]/20", 
    color: "text-[#00DC00]"
  },
  theme: {
    bg: "bg-[#B200FF]/20",
    color: "text-[#B200FF]"
  }
};

export function Filter({ title, type }: { title: string; type: FilterType }) {
  const [isVisible, setIsVisible] = useState(true);
  const colors = typeColors[type];
  
  return (
        <div className="flex items-stretch font-xs gap-1 leading-3">
                <button className="text-left flex-1 py-2.5 bg-[#F5F5F5] px-2.5 rounded-md">{title}</button>
                <button 
                  onClick={() => setIsVisible(!isVisible)}
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