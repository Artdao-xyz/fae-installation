import type { Metadata } from "next";
import type { ContentRow } from "@/data/content-types";

export const SITE_URL = "https://futureartecosystems.org";
export const SITE_TITLE = "Future Art Ecosystems";
export const SITE_DESCRIPTION = "Cultural Infrastructure Research";
export const SITE_OG_IMAGE_PATH = "";

const metadataBase = new URL(SITE_URL);

function metadataTitle(title?: string): string {
  if (!title || title === SITE_TITLE) return SITE_TITLE;
  return `${title} | ${SITE_TITLE}`;
}

function sitePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function ogImages(): NonNullable<NonNullable<Metadata["openGraph"]>["images"]> {
  return SITE_OG_IMAGE_PATH ? [{ url: SITE_OG_IMAGE_PATH }] : [];
}

function descriptionFromRow(row: ContentRow): string {
  const plain = row.content.replace(/\s+/g, " ").trim();
  if (!plain) return SITE_DESCRIPTION;
  return plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}...` : plain;
}

export function buildSiteMetadata(): Metadata {
  return {
    metadataBase,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      url: "/",
      siteName: SITE_TITLE,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: ogImages(),
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: ogImages(),
    },
  };
}

export function buildOutputMetadata(row: ContentRow | null, slug: string): Metadata {
  const path = sitePath(row?.shareSlug ?? slug);
  const title = metadataTitle(row?.title);
  const description = row ? descriptionFromRow(row) : SITE_DESCRIPTION;

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "article",
      url: path,
      siteName: SITE_TITLE,
      title,
      description,
      images: ogImages(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages(),
    },
  };
}

