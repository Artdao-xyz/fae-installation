"use client";

import type { BlocksContent } from "@strapi/blocks-react-renderer";
import { BlocksRenderer } from "@strapi/blocks-react-renderer";

const bodyText =
  "font-suisseintl text-xs font-normal leading-[1.6] tracking-[0.36px] text-ink-caption";

/** Strapi blocks → React, styled to match preview typography. */
export function PreviewBlocksBody({ content }: { content: BlocksContent }) {
  return (
    <div className="fae-preview-body-stack flex min-w-0 flex-col gap-3">
      <BlocksRenderer
        content={content}
        blocks={{
          paragraph: ({ children }) => (
            <p className={`mb-0 last:mb-0 ${bodyText}`}>{children}</p>
          ),
          quote: ({ children }) => (
            <blockquote
              className={`my-0 border-l-2 border-ink-primary/40 pl-3 ${bodyText}`}
            >
              {children}
            </blockquote>
          ),
          code: ({ plainText }) => (
            <pre className="mb-0 max-w-full overflow-x-auto rounded-sm bg-surface-muted p-3">
              <code className="font-fira-mono text-[10px] leading-relaxed text-ink-body">
                {plainText}
              </code>
            </pre>
          ),
          heading: ({ level, children }) => {
            const cls =
              level <= 2
                ? "mb-1 font-suisseintl text-sm font-medium text-ink-body"
                : "mb-1 font-suisseintl text-xs font-medium text-ink-body";
            switch (level) {
              case 1:
                return <h1 className={cls}>{children}</h1>;
              case 2:
                return <h2 className={cls}>{children}</h2>;
              case 3:
                return <h3 className={cls}>{children}</h3>;
              case 4:
                return <h4 className={cls}>{children}</h4>;
              case 5:
                return <h5 className={cls}>{children}</h5>;
              case 6:
                return <h6 className={cls}>{children}</h6>;
              default:
                return <h6 className={cls}>{children}</h6>;
            }
          },
          list: ({ format, children }) =>
            format === "ordered" ? (
              <ol
                className={`mb-0 list-decimal space-y-1 pl-5 ${bodyText} marker:text-ink-caption`}
              >
                {children}
              </ol>
            ) : (
              <ul
                className={`mb-0 list-disc space-y-1 pl-5 ${bodyText} marker:text-ink-caption`}
              >
                {children}
              </ul>
            ),
          "list-item": ({ children }) => (
            <li className="pl-0.5 [&>p]:mb-0">{children}</li>
          ),
          link: ({ url, children }) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-body underline decoration-solid underline-offset-2 [text-decoration-skip-ink:none] hover:text-ink-primary"
            >
              {children}
            </a>
          ),
          image: ({ image }) => (
            // eslint-disable-next-line @next/next/no-img-element -- Strapi media URL from CMS
            <img
              src={image.url}
              alt={image.alternativeText ?? ""}
              className="h-auto max-w-full rounded-sm object-contain"
              width={image.width}
              height={image.height}
            />
          ),
        }}
      />
    </div>
  );
}
