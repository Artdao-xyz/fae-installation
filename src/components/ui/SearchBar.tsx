import { RotateCcw, Search } from "lucide-react";

export function SearchBar() {
  return (
        <div className="flex items-center justify-between gap-2">
                <span className="flex flex-1 border-b border-black pb-2">
                        <input type="text" placeholder="What are you looking for?" className="outline-none border-none w-full" />
                        <span className="flex items-center justify-center"><Search size={16} className="scale-x-[-1]" /></span>
                </span>
                <button className="border rounded-full p-2 self-start"><RotateCcw size={16} /></button>
        </div>
  );
}