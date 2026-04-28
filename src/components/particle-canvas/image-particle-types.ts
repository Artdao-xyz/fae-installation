export type ImageParticleSimulationMode = "optimized" | "snappy";

export type ImageParticleSimulationStats = {
  loadedCount: number;
  errorCount: number;
  loadDurationMs: number | null;
  contentRowsCount: number;
  contentTotal: number;
  fetchDurationMs: number | null;
  fetchError: string | null;
  totalImages: number;
  loadDone: boolean;
};
