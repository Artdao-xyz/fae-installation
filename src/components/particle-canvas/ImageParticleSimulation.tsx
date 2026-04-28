"use client";

import { DEFAULTS } from "./particle-system";
import { ImageParticleSimulationView } from "./ImageParticleSimulationView";
import type { ImageParticleSimulationViewProps } from "./ImageParticleSimulationView";

export type { ImageParticleSimulationStats } from "./image-particle-types";

export type ImageParticleSimulationProps = Omit<
  ImageParticleSimulationViewProps,
  "config"
>;

export function ImageParticleSimulation(props: ImageParticleSimulationProps) {
  return <ImageParticleSimulationView {...props} config={DEFAULTS} />;
}
