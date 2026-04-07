import type { Metadata } from "next";
import Link from "next/link";
import { Thumbnail } from "@/components/ui/thumbnail-full";

export const metadata: Metadata = {
  title: "Debug — Thumbnails",
  description: "Figma Thumbnails/Full preview",
};

export default function DebugPage() {
  return (
    <main className="flex min-h-screen flex-col flex-wrap items-start justify-center gap-16 bg-[#c8c8c8] p-12">
      <p className="w-full font-sans text-sm text-text-primary">
        <Link href="/debug/spread" className="underline hover:no-underline">
          Thumbnail spread layout (center-out, Leva)
        </Link>
      </p>
      <Thumbnail variant="full" size="lg" imageSrc="/title.svg" imageAlt="Full variant" />
      <Thumbnail variant="text" size="lg" label="Fairclouds" />
      <Thumbnail variant="text" size="md" label="Fairclouds" />
      <Thumbnail variant="image" size="sm" imageSrc="/title.svg" imageAlt="Image only" />
    </main>
  );
}
