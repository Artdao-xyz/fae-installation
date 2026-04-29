import Image from 'next/image';

interface DataPointGlyphProps {
  category: string;
  size?: number;
  className?: string;
}

export function DataPointGlyph({ category, size = 24, className = "" }: DataPointGlyphProps) {
  const getGlyphForCategory = (category: string) => {
    const normalizedCategory = category.toLowerCase();
    
    switch (normalizedCategory) {
      case 'research':
      case 'paper':
      case 'academic':
        return (
          <Image
            src="/glyphs/glyph-paper.svg"
            alt="Paper/Research"
            width={size}
            height={size}
            className="w-full h-full"
          />
        );
      
      case 'dao':
      case 'governance':
      case 'community':
        return (
          <Image
            src="/glyphs/glyph-community.svg"
            alt="Community/DAO"
            width={size}
            height={size}
            className="w-full h-full rotate-45"
          />
        );
      
      case 'art':
      case 'creative':
      case 'design':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
            <path d="M19 15L20.09 18.26L24 19L20.09 19.74L19 23L17.91 19.74L14 19L17.91 18.26L19 15Z" fill="currentColor"/>
            <path d="M5 15L6.09 18.26L10 19L6.09 19.74L5 23L3.91 19.74L0 19L3.91 18.26L5 15Z" fill="currentColor"/>
          </svg>
        );
      
      case 'technology':
      case 'tech':
      case 'software':
      case 'development':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6" cy="7" r="1" fill="currentColor"/>
            <circle cx="10" cy="7" r="1" fill="currentColor"/>
            <circle cx="14" cy="7" r="1" fill="currentColor"/>
          </svg>
        );
      
      case 'blockchain':
      case 'crypto':
      case 'web3':
      case 'defi':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      
      case 'nft':
      case 'digital art':
      case 'collectible':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 9H15V15H9V9Z" fill="currentColor"/>
            <path d="M9 1V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 1V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 19V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 19V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M1 9H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M1 15H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 9H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 15H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      
      case 'music':
      case 'audio':
      case 'sound':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      
      case 'gaming':
      case 'game':
      case 'play':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 11H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12H15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 10H18.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.32 5H6.68C5.28 5 4.38 6.35 4.9 7.68L8.22 17.32C8.71 18.57 9.85 19.32 11.1 19.32H12.9C14.15 19.32 15.29 18.57 15.78 17.32L19.1 7.68C19.62 6.35 18.72 5 17.32 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      
      default:
        // Default glyph for unknown categories
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {getGlyphForCategory(category)}
    </div>
  );
}
