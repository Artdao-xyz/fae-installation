export type ContentRow = {
  id: string;
  title: string;
  imageUrl: string;
  content: string;
  resources: readonly string[];
  focusAreas: readonly string[];
  activityTypes: readonly string[];
  year: number;
  formats: readonly string[];
  networks: readonly string[];
};
