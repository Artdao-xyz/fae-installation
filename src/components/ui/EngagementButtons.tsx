import { BookOpenText, Play, Globe } from "lucide-react";

export function EngagementButtons() {
  return (
        <div className="flex items-center gap-2">
                <span className="bg-[#1900FF] cursor-pointer text-white rounded-md p-2 w-24 inline-flex justify-center items-center gap-2">
                        <BookOpenText size={16} />
                        Read
                </span>
                <span className="bg-[#1900FF] cursor-pointer text-white rounded-md p-2 w-24 inline-flex justify-center items-center gap-2">
                        <Play size={16} />
                        Play
                </span>
                <span className="bg-[#1900FF] cursor-pointer text-white rounded-md p-2 w-24 inline-flex justify-center items-center gap-2">
                        <Globe size={16} />
                        Watch
                </span>
        </div>
  );
}