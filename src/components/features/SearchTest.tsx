"use client";

import { useState, useRef, useEffect } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { SuggestionFilter } from "@/components/ui/SuggestionFilter";
import { EngagementButtons } from "@/components/ui/EngagementButtons";
import { FiltersSystem } from "@/components/ui/FiltersSystem";

interface SearchTestProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onReset?: () => void;
  resultsCount?: number;
  totalCount?: number;
  engagementTypes?: string[];
  selectedEngagement?: string | null;
  onEngagementClick?: (engagement: string) => void;
  categories?: string[];
  selectedCategories?: string[];
  onCategoryToggle?: (category: string) => void;
}

export function SearchTest({ 
  searchQuery = "", 
  onSearchChange, 
  onReset,
  resultsCount,
  totalCount,
  engagementTypes = [],
  selectedEngagement = null,
  onEngagementClick,
  categories = [],
  selectedCategories = [],
  onCategoryToggle
}: SearchTestProps) {
  const [isOpen, setIsOpen] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Solo toggle si el click es en el contenedor mismo, no en elementos hijos
    if (e.target === e.currentTarget) {
      setIsOpen(!isOpen);
    }
  };

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <div 
      ref={searchRef}
      onClick={handleContainerClick}
      className="font-geist-sans font-medium font-xs fixed bottom-11 -translate-x-1/2 left-1/2 w-full max-w-7xl flex flex-col justify-center px-10 py-5 gap-6 bg-white/60 rounded-t-xl backdrop-blur-lg z-40 cursor-pointer hover:bg-white/70 transition-colors"
    >
        <SearchBar 
          value={searchQuery}
          onChange={handleSearchChange}
          onReset={handleReset}
          placeholder="Search by title, description, category, etc..."
        />
        
        {/* Results count */}
        {(resultsCount !== undefined || totalCount !== undefined) && (
          <div className="text-sm text-black/60">
            {searchQuery ? (
              <>
                Showing {resultsCount ?? 0} of {totalCount ?? 0} results
              </>
            ) : (
              <>Start typing to search...</>
            )}
          </div>
        )}

        <SuggestionFilter />

        {isOpen && (
          <>
            <FiltersSystem 
              categories={categories}
              selectedCategories={selectedCategories}
              onCategoryToggle={onCategoryToggle}
            />
            <EngagementButtons 
              engagementTypes={engagementTypes}
              selectedEngagement={selectedEngagement}
              onEngagementClick={onEngagementClick}
            />
          </>
        )}
    </div>
  );
}

