import { RotateCcw, Search } from "lucide-react";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onReset?: () => void;
  placeholder?: string;
}

export function SearchBar({ value = "", onChange, onReset, placeholder = "What are you looking for?" }: SearchBarProps) {
  return (
        <div className="flex items-center justify-between gap-2">
                <span className="flex flex-1 border-b border-black pb-2">
                        <input 
                          type="text" 
                          value={value}
                          onChange={(e) => onChange?.(e.target.value)}
                          placeholder={placeholder} 
                          className="outline-none border-none w-full" 
                        />
                        <span className="flex items-center justify-center"><Search size={16} className="scale-x-[-1]" /></span>
                </span>
                <button 
                  onClick={onReset}
                  className="border rounded-full p-2 self-start"
                  type="button"
                >
                  <RotateCcw size={16} />
                </button>
        </div>
  );
}