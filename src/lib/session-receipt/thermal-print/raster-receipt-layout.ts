import { buildReceiptViewUrl } from "../encode";
import {
  formatReceiptDate,
  formatSessionTranscript,
} from "../format-transcript";
import { formatTagFortuneLine } from "../journey-prompt";
import { hasPathActivity } from "../path-grid";
import type { StarRaster } from "../rasterize-path-stars";
import {
  RECEIPT_ACTIVITY_HEADING,
  RECEIPT_ARTIFACT_TITLE,
  type SessionReceipt,
} from "../types";
import {
  THERMAL_CONTENT_DOTS,
  THERMAL_HORIZONTAL_MARGIN_DOTS,
  THERMAL_LINE_DOTS,
} from "../thermal-spec";
import { insetRasterHorizontally } from "./margins";
import { rasterizeQrCode } from "./qr-raster";
import {
  RASTER_RECEIPT_INK,
  RASTER_RECEIPT_TYPE,
  RASTER_RECEIPT_WIDTH_DOTS,
  rasterMonoCharWidth,
} from "./raster-receipt-spec";
import {
  buildSvgTextBlock,
  rasterizeReceiptSvgBlock,
  type SvgTextLine,
  wrapMonoText,
} from "./raster-receipt-svg";
import {
  rasterizeSvgFile,
  stackRastersVertically,
} from "./rasterize-monochrome";
import { rasterizePathStars } from "./star-raster";

const SERPENTINE_LOGO_SVG = "public/svg/serpentine.svg";
const RECEIPT_QR_SHARE_LABEL = "share";

function blankRaster(widthDots: number, heightDots: number): StarRaster {
  const bytesPerRow = Math.ceil(widthDots / 8);
  return {
    widthDots,
    heightDots,
    bytesPerRow,
    data: new Uint8Array(bytesPerRow * heightDots),
  };
}

function padHeight(contentHeight: number, padY = RASTER_RECEIPT_TYPE.sectionPadY): number {
  return contentHeight + padY * 2;
}

function lineY(
  index: number,
  startY: number,
  leading: number,
  padY = RASTER_RECEIPT_TYPE.sectionPadY,
): number {
  return padY + startY + leading * (index + 1);
}

function centerRasterInContent(raster: StarRaster): StarRaster {
  const left = Math.max(0, Math.floor((RASTER_RECEIPT_WIDTH_DOTS - raster.widthDots) / 2));
  const bytesPerRow = Math.ceil(RASTER_RECEIPT_WIDTH_DOTS / 8);
  const data = new Uint8Array(bytesPerRow * raster.heightDots);
  for (let y = 0; y < raster.heightDots; y++) {
    for (let x = 0; x < raster.widthDots; x++) {
      const srcByteIdx = y * raster.bytesPerRow + Math.floor(x / 8);
      const srcBit = 7 - (x % 8);
      if (((raster.data[srcByteIdx] ?? 0) >> srcBit) & 1) {
        const destX = x + left;
        const destByteIdx = y * bytesPerRow + Math.floor(destX / 8);
        const destBit = 7 - (destX % 8);
        data[destByteIdx] = (data[destByteIdx] ?? 0) | (1 << destBit);
      }
    }
  }
  return {
    widthDots: RASTER_RECEIPT_WIDTH_DOTS,
    heightDots: raster.heightDots,
    bytesPerRow,
    data,
  };
}

function rasterizeHorizontalRule(): StarRaster {
  const height = Math.max(2, Math.round(RASTER_RECEIPT_TYPE.bodySize * 0.15));
  const bytesPerRow = Math.ceil(RASTER_RECEIPT_WIDTH_DOTS / 8);
  const data = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < RASTER_RECEIPT_WIDTH_DOTS; x++) {
      const byteIdx = y * bytesPerRow + Math.floor(x / 8);
      const bit = 7 - (x % 8);
      data[byteIdx] = (data[byteIdx] ?? 0) | (1 << bit);
    }
  }
  return {
    widthDots: RASTER_RECEIPT_WIDTH_DOTS,
    heightDots: height,
    bytesPerRow,
    data,
  };
}

async function rasterizeHeaderBlock(receipt: SessionReceipt): Promise<StarRaster> {
  const { titleLeading, bodySize, bodyLeading, sectionPadY, sectionGap } =
    RASTER_RECEIPT_TYPE;
  const contentHeight = titleLeading + sectionGap + bodyLeading;
  const height = sectionPadY * 2 + contentHeight;
  const lines: SvgTextLine[] = [
    {
      y: sectionPadY + titleLeading,
      spans: [
        {
          x: 0,
          text: RECEIPT_ARTIFACT_TITLE,
          weight: 500,
          size: RASTER_RECEIPT_TYPE.titleSize,
          fill: RASTER_RECEIPT_INK.primary,
        },
      ],
    },
    {
      y: sectionPadY + titleLeading + sectionGap + bodyLeading,
      spans: [
        {
          x: 0,
          text: formatReceiptDate(receipt.sessionStart),
          size: bodySize,
          fill: RASTER_RECEIPT_INK.secondary,
        },
      ],
    },
  ];

  const svg = buildSvgTextBlock({ heightDots: height, lines });
  return rasterizeReceiptSvgBlock(svg);
}

async function rasterizeProcessingHeading(): Promise<StarRaster> {
  const { bodySize, bodyLeading, sectionPadY } = RASTER_RECEIPT_TYPE;
  const height = padHeight(bodyLeading, sectionPadY);
  const svg = buildSvgTextBlock({
    heightDots: height,
    lines: [
      {
        y: lineY(0, 0, bodyLeading, sectionPadY),
        spans: [
          {
            x: 0,
            text: RECEIPT_ACTIVITY_HEADING,
            size: bodySize,
            fill: RASTER_RECEIPT_INK.secondary,
          },
        ],
      },
    ],
  });
  return rasterizeReceiptSvgBlock(svg);
}

async function rasterizeTranscriptBlock(
  receipt: SessionReceipt,
): Promise<StarRaster | null> {
  const transcript = formatSessionTranscript(receipt.events);
  const { bodySize, transcriptLeading, sectionPadY, transcriptColGap } =
    RASTER_RECEIPT_TYPE;

  const timeColumnWidth = Math.ceil(rasterMonoCharWidth(bodySize) * 6);
  const labelMaxWidth =
    RASTER_RECEIPT_WIDTH_DOTS - timeColumnWidth - transcriptColGap;

  const rows: { time: string; label: string }[] = [];
  if (transcript.length === 0) {
    rows.push({ time: "", label: "No activity recorded" });
  } else {
    for (const line of transcript) {
      rows.push({ time: line.time, label: line.text });
    }
  }

  const lines: SvgTextLine[] = [];
  let rowIndex = 0;
  for (const row of rows) {
    const labelLines = wrapMonoText(row.label, labelMaxWidth, bodySize);
    for (let i = 0; i < labelLines.length; i++) {
      lines.push({
        y: lineY(rowIndex, 0, transcriptLeading, sectionPadY),
        spans: [
          {
            x: 0,
            text: i === 0 ? row.time : "",
            size: bodySize,
            fill: RASTER_RECEIPT_INK.secondary,
          },
          {
            x: timeColumnWidth + transcriptColGap,
            text: labelLines[i]!,
            size: bodySize,
            fill: RASTER_RECEIPT_INK.secondary,
          },
        ],
      });
      rowIndex++;
    }
  }

  if (lines.length === 0) return null;

  const height = padHeight(transcriptLeading * lines.length, sectionPadY);
  const svg = buildSvgTextBlock({ heightDots: height, lines });
  return rasterizeReceiptSvgBlock(svg);
}

async function rasterizeQuoteBlock(receipt: SessionReceipt): Promise<StarRaster> {
  const { bodySize, quoteLeading, blockPadY } = RASTER_RECEIPT_TYPE;
  const quote = formatTagFortuneLine(receipt.prompt);
  const wrapped = wrapMonoText(quote, RASTER_RECEIPT_WIDTH_DOTS, bodySize);
  const lines: SvgTextLine[] = wrapped.map((text, index) => ({
    y: lineY(index, 0, quoteLeading, blockPadY),
    spans: [
      {
        x: 0,
        text,
        size: bodySize,
        fill: RASTER_RECEIPT_INK.secondary,
      },
    ],
  }));
  const textHeight = padHeight(quoteLeading * wrapped.length, blockPadY);
  const textBlock = await rasterizeReceiptSvgBlock(
    buildSvgTextBlock({ heightDots: textHeight, lines }),
  );

  return stackRastersVertically(
    [rasterizeHorizontalRule(), textBlock, rasterizeHorizontalRule()],
    RASTER_RECEIPT_WIDTH_DOTS,
    RASTER_RECEIPT_TYPE.sectionGap,
  );
}

async function rasterizeShareLabel(): Promise<StarRaster> {
  const { bodySize, bodyLeading, sectionPadY } = RASTER_RECEIPT_TYPE;
  const height = padHeight(bodyLeading, sectionPadY);
  const labelWidth = rasterMonoCharWidth(bodySize) * RECEIPT_QR_SHARE_LABEL.length;
  const x = Math.max(0, Math.floor((RASTER_RECEIPT_WIDTH_DOTS - labelWidth) / 2));
  const svg = buildSvgTextBlock({
    heightDots: height,
    lines: [
      {
        y: lineY(0, 0, bodyLeading, sectionPadY),
        spans: [
          {
            x,
            text: RECEIPT_QR_SHARE_LABEL,
            size: bodySize,
            fill: RASTER_RECEIPT_INK.secondary,
          },
        ],
      },
    ],
  });
  return rasterizeReceiptSvgBlock(svg);
}

async function rasterizeFooterBlock(): Promise<StarRaster> {
  const logoHeight = RASTER_RECEIPT_TYPE.footerSize;
  return rasterizeSvgFile(SERPENTINE_LOGO_SVG, logoHeight, 120);
}

/**
 * Compose the full session receipt as one 1-bit raster (Figma-aligned typography).
 */
export async function buildSessionReceiptRaster(
  receipt: SessionReceipt,
  viewOrigin?: string,
): Promise<StarRaster> {
  const sections: StarRaster[] = [];

  if (receipt.path && hasPathActivity(receipt.path)) {
    sections.push(
      stackRastersVertically(
        [
          blankRaster(RASTER_RECEIPT_WIDTH_DOTS, RASTER_RECEIPT_TYPE.starsPadY),
          rasterizePathStars(receipt.path, THERMAL_CONTENT_DOTS),
        ],
        RASTER_RECEIPT_WIDTH_DOTS,
        0,
      ),
    );
  }

  sections.push(await rasterizeProcessingHeading());
  sections.push(await rasterizeHeaderBlock(receipt));

  const transcript = await rasterizeTranscriptBlock(receipt);
  if (transcript) sections.push(transcript);

  sections.push(await rasterizeQuoteBlock(receipt));

  const qrUrl = buildReceiptViewUrl(receipt, viewOrigin);
  sections.push(await rasterizeShareLabel());
  sections.push(
    stackRastersVertically(
      [
        blankRaster(RASTER_RECEIPT_WIDTH_DOTS, RASTER_RECEIPT_TYPE.qrPadTop),
        centerRasterInContent(rasterizeQrCode(qrUrl)),
        blankRaster(RASTER_RECEIPT_WIDTH_DOTS, RASTER_RECEIPT_TYPE.qrPadBottom),
      ],
      RASTER_RECEIPT_WIDTH_DOTS,
      0,
    ),
  );

  sections.push(await rasterizeFooterBlock());

  const stacked = stackRastersVertically(
    sections,
    RASTER_RECEIPT_WIDTH_DOTS,
    RASTER_RECEIPT_TYPE.sectionGap,
  );

  return insetRasterHorizontally(stacked, THERMAL_HORIZONTAL_MARGIN_DOTS, THERMAL_LINE_DOTS);
}
