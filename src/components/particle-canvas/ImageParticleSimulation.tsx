"use client";

import { lazy, Suspense } from "react";
import { DEFAULTS } from "./particle-system";
import { ImageParticleSimulationView } from "./ImageParticleSimulationView";
import type { ImageParticleSimulationViewProps } from "./ImageParticleSimulationView";

export type { ImageParticleSimulationStats } from "./image-particle-types";

export type ImageParticleSimulationProps = Omit<
  ImageParticleSimulationViewProps,
  "config"
>;

const ImageParticleSimulationLeva = lazy(() =>
  import("./ImageParticleSimulationLeva").then((m) => ({
    default: m.ImageParticleSimulationLeva,
  })),
);

/** Set to `process.env.NODE_ENV === "development"` to show the Leva panel again. */
const showLeva = false;

export function ImageParticleSimulation(props: ImageParticleSimulationProps) {
  if (showLeva) {
    return (
      <Suspense fallback={null}>
        <ImageParticleSimulationLeva {...props} />
      </Suspense>
    );
  }
  return <ImageParticleSimulationView {...props} config={DEFAULTS} />;
}
