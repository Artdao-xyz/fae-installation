export const DATAPOINT_DIMENSIONS = {
  SQUARE: { WIDTH: 180, HEIGHT: 180 },
  RECT: { WIDTH: 180, HEIGHT: 60 },
} as const;

export type Dimensions = { width: number; height: number };

export const BASE_ITEM_SIZE = 180;

export const getDataPointDimensions = (index: number): Dimensions => {
  const isSquare = index % 2 === 0;
  return isSquare
    ? { width: DATAPOINT_DIMENSIONS.SQUARE.WIDTH, height: DATAPOINT_DIMENSIONS.SQUARE.HEIGHT }
    : { width: DATAPOINT_DIMENSIONS.RECT.WIDTH, height: DATAPOINT_DIMENSIONS.RECT.HEIGHT };
};


