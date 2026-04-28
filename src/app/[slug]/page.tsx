import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePageClient } from "@/app/HomePageClient";
import { buildOutputMetadata } from "@/lib/site-metadata";
import { fetchStrapiOutputDetailByShareSlug } from "@/lib/strapi/fetch-outputs-list";

type OutputPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: OutputPageProps): Promise<Metadata> {
  const { slug } = await params;
  const row = await fetchStrapiOutputDetailByShareSlug(slug);
  return buildOutputMetadata(row, slug);
}

export default async function OutputPage({ params }: OutputPageProps) {
  const { slug } = await params;
  const row = await fetchStrapiOutputDetailByShareSlug(slug);

  if (!row) {
    notFound();
  }

  return <HomePageClient initialPreviewSlug={row.shareSlug} />;
}

