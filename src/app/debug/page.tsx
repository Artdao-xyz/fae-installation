import type { Metadata } from "next";
import { Thumbnail } from "@/components/ui/thumbnail-full";

export const metadata: Metadata = {
  title: "Debug — Thumbnail",
  description: "Figma Thumbnails/Full preview",
};

export default function DebugPage() {
  return (
    <main className="flex min-h-screen flex-wrap items-start justify-center gap-16 bg-[#c8c8c8] p-12">
      <Thumbnail variant="full" size="lg" imageSrc="/title.svg" imageAlt="Full variant" />
      <Thumbnail variant="text" size="lg" label="Fairclouds" chipTone="light" />
      <Thumbnail variant="text" size="md" label="Fairclouds" chipTone="dark" />
      <Thumbnail variant="image" size="sm" imageSrc="/title.svg" imageAlt="Image only" />
    </main>
  );
}
