export const DATAPOINT_DIMENSIONS = {
  IMAGE: { WIDTH: 384, HEIGHT: 256 }, // Tailwind: max-w-sm (384), h-64 (256)
  TEXT: { WIDTH: 384, HEIGHT: 60 },   // Title-only approx height
  MARGIN: 20,
} as const;

export interface Dimensions {
  width: number;
  height: number;
}

export const getDataPointDimensions = (hasImage: boolean): Dimensions => {
  return hasImage
    ? { width: DATAPOINT_DIMENSIONS.IMAGE.WIDTH, height: DATAPOINT_DIMENSIONS.IMAGE.HEIGHT }
    : { width: DATAPOINT_DIMENSIONS.TEXT.WIDTH, height: DATAPOINT_DIMENSIONS.TEXT.HEIGHT };
};


