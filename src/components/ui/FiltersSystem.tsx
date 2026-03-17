import { Filter } from "./Filter";

interface FiltersSystemProps {
  categories?: string[];
  selectedCategories?: string[];
  onCategoryToggle?: (category: string) => void;
}

export function FiltersSystem({ 
  categories = [], 
  selectedCategories = [],
  onCategoryToggle 
}: FiltersSystemProps) {
  // Group categories by type
  const categoryGroups = {
    briefing: categories.filter(cat => cat.toLowerCase().includes('briefing')),
    paper: categories.filter(cat => cat.toLowerCase().includes('paper')),
    asset: categories.filter(cat => cat.toLowerCase().includes('asset')),
    community: categories.filter(cat => cat.toLowerCase().includes('community')),
  };

  const getFilterType = (category: string): "briefing" | "paper" | "asset" | "community" => {
    const normalized = category.toLowerCase();
    if (normalized.includes('briefing')) return 'briefing';
    if (normalized.includes('paper')) return 'paper';
    if (normalized.includes('asset')) return 'asset';
    if (normalized.includes('community')) return 'community';
    return 'briefing'; // default
  };

  const handleToggle = (category: string) => {
    onCategoryToggle?.(category);
  };

  const isCategorySelected = (category: string) => {
    return selectedCategories.includes(category);
  };

  return (
        <div className="flex items-stretch gap-4">
                {categoryGroups.briefing.length > 0 && (
                  <div className="flex flex-col gap-3 flex-1">
                    <h3 className="text-sm text-black/60 font-medium">Briefing</h3>
                    {categoryGroups.briefing.map((category, index) => (
                      <Filter 
                        key={`briefing-${index}`}
                        title={category} 
                        type="briefing"
                        isSelected={isCategorySelected(category)}
                        onToggle={() => handleToggle(category)}
                      />
                    ))}
                  </div>
                )}
                {categoryGroups.paper.length > 0 && (
                  <div className="flex flex-col gap-3 flex-1">
                    <h3 className="text-sm text-black/60 font-medium">Paper</h3>
                    {categoryGroups.paper.map((category, index) => (
                      <Filter 
                        key={`paper-${index}`}
                        title={category} 
                        type="paper"
                        isSelected={isCategorySelected(category)}
                        onToggle={() => handleToggle(category)}
                      />
                    ))}
                  </div>
                )}
                {categoryGroups.asset.length > 0 && (
                  <div className="flex flex-col gap-3 flex-1">
                    <h3 className="text-sm text-black/60 font-medium">Asset</h3>
                    {categoryGroups.asset.map((category, index) => (
                      <Filter 
                        key={`asset-${index}`}
                        title={category} 
                        type="asset"
                        isSelected={isCategorySelected(category)}
                        onToggle={() => handleToggle(category)}
                      />
                    ))}
                  </div>
                )}
                {categoryGroups.community.length > 0 && (
                  <div className="flex flex-col gap-3 flex-1">
                    <h3 className="text-sm text-black/60 font-medium">Community</h3>
                    {categoryGroups.community.map((category, index) => (
                      <Filter 
                        key={`community-${index}`}
                        title={category} 
                        type="community"
                        isSelected={isCategorySelected(category)}
                        onToggle={() => handleToggle(category)}
                      />
                    ))}
                  </div>
                )}
        </div>
  );
}