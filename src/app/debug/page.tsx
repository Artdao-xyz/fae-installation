import type { Metadata } from "next";
import { FilterMenu } from "@/components/ui/filter-menu";
import { Thumbnail } from "@/components/ui/thumbnail-full";

export const metadata: Metadata = {
  title: "Debug — Filters & thumbnails",
  description: "Filter menu and thumbnail previews",
};

export default function DebugPage() {
  return (
    <div className="flex min-h-screen bg-[#c8c8c8]">
      <FilterMenu />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto p-12">
        <div className="flex flex-wrap items-start justify-center gap-16">
          <Thumbnail variant="full" size="lg" imageSrc="/title.svg" imageAlt="Full variant" />
          <Thumbnail variant="text" size="lg" label="Fairclouds" chipTone="light" />
          <Thumbnail variant="text" size="md" label="Fairclouds" chipTone="dark" />
          <Thumbnail variant="image" size="sm" imageSrc="/title.svg" imageAlt="Image only" />
        </div>
      </main>
    </div>
  );
}
