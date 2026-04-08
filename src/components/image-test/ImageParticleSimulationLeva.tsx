"use client";

import { folder, useControls } from "leva";
import { DEFAULTS, type SimConfig } from "./particle-system";
import {
  ImageParticleSimulationView,
  type ImageParticleSimulationViewProps,
} from "./ImageParticleSimulationView";

type Props = Omit<
  ImageParticleSimulationViewProps,
  "config" | "idleTextFullTitle" | "filterMatchMode"
>;

export function ImageParticleSimulationLeva(props: Props) {
  const idleLabel = useControls("Idle text", {
    showFullTitle: {
      value: false,
      label: "Full title (not keyword)",
    },
  });

  /** `true` = original OR-style (cumulative); `false` = require every selected tag (AND). */
  const { cumulativeFilterMatching } = useControls("Filter matching (dev)", {
    cumulativeFilterMatching: {
      value: false,
      label:
        "Cumulative (OR — widen when adding tags). Off = require ALL selected tags (AND). Same result if only 1 Focus + 1 Activity tag.",
    },
  });

  const config = useControls({
    Depth: folder({
      perspective: { value: DEFAULTS.perspective, min: 400, max: 2000, step: 50 },
      zNear: { value: DEFAULTS.zNear, min: 0, max: 800, step: 25 },
      zFar: { value: DEFAULTS.zFar, min: -1200, max: 0, step: 25 },
    }),
    Orbit: folder({
      orbitSpeedMin: {
        value: DEFAULTS.orbitSpeedMin,
        min: 0.02,
        max: 1.0,
        step: 0.02,
      },
      orbitSpeedMax: {
        value: DEFAULTS.orbitSpeedMax,
        min: 0.05,
        max: 1.5,
        step: 0.02,
      },
      orbitRadialSpring: {
        value: DEFAULTS.orbitRadialSpring,
        min: 0.05,
        max: 3,
        step: 0.05,
      },
      orbitTangentialForce: {
        value: DEFAULTS.orbitTangentialForce,
        min: 50,
        max: 800,
        step: 10,
      },
      orbitZAmplitude: {
        value: DEFAULTS.orbitZAmplitude,
        min: 0,
        max: 1,
        step: 0.05,
      },
      orbitZSpeedMin: {
        value: DEFAULTS.orbitZSpeedMin,
        min: 0.05,
        max: 2,
        step: 0.05,
      },
      orbitZSpeedMax: {
        value: DEFAULTS.orbitZSpeedMax,
        min: 0.1,
        max: 3,
        step: 0.05,
      },
      orbitTiltDeg: { value: DEFAULTS.orbitTiltDeg, min: -45, max: 45, step: 1 },
      orbitRadiusSpread: {
        value: DEFAULTS.orbitRadiusSpread,
        min: 0,
        max: 0.6,
        step: 0.02,
      },
    }),
    Bounds: folder({
      viewportPadding: {
        value: DEFAULTS.viewportPadding,
        min: 0,
        max: 200,
        step: 5,
      },
      viewportWallStrength: {
        value: DEFAULTS.viewportWallStrength,
        min: 0.5,
        max: 10,
        step: 0.5,
      },
    }),
    Forces: folder({
      drag: { value: DEFAULTS.drag, min: 0.1, max: 5, step: 0.1 },
      turbulenceStrength: {
        value: DEFAULTS.turbulenceStrength,
        min: 0,
        max: 600,
        step: 10,
      },
      turbulenceSpeed: {
        value: DEFAULTS.turbulenceSpeed,
        min: 0.1,
        max: 4,
        step: 0.1,
      },
      repulsionRadius: {
        value: DEFAULTS.repulsionRadius,
        min: 20,
        max: 300,
        step: 5,
      },
      repulsionStrength: {
        value: DEFAULTS.repulsionStrength,
        min: 500,
        max: 20000,
        step: 500,
      },
    }),
    Lifecycle: folder({
      lifeSpeedMin: {
        value: DEFAULTS.lifeSpeedMin,
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
      lifeSpeedMax: {
        value: DEFAULTS.lifeSpeedMax,
        min: 0.02,
        max: 1,
        step: 0.01,
      },
      birthPhase: { value: DEFAULTS.birthPhase, min: 0.01, max: 0.35, step: 0.01 },
      deathPhaseStart: {
        value: DEFAULTS.deathPhaseStart,
        min: 0.5,
        max: 1,
        step: 0.01,
      },
    }),
    Visual: folder({
      blurMax: { value: DEFAULTS.blurMax, min: 0, max: 12, step: 0.25 },
      blurFarGate: {
        value: DEFAULTS.blurFarGate,
        min: 0.08,
        max: 0.55,
        step: 0.01,
      },
      baseScaleMin: { value: DEFAULTS.baseScaleMin, min: 0.2, max: 2, step: 0.1 },
      baseScaleMax: { value: DEFAULTS.baseScaleMax, min: 0.3, max: 3, step: 0.1 },
    }),
  }) as SimConfig;

  return (
    <ImageParticleSimulationView
      {...props}
      config={config}
      idleTextFullTitle={idleLabel.showFullTitle}
      filterMatchMode={
        cumulativeFilterMatching ? "union" : "intersection"
      }
    />
  );
}
