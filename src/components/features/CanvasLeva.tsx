'use client';

import { Leva, useControls, button } from 'leva';

interface CanvasLevaProps {
  onShuffle: () => void;
  onGroupChange: (group: number) => void;
}

export function CanvasLeva({ onShuffle, onGroupChange }: CanvasLevaProps) {
  useControls({
    group: {
      value: 0,
      options: { 'All': 0, 'Group 1': 1, 'Group 2': 2, 'Group 3': 3 },
      onChange: (value) => onGroupChange(value)
    },
    Shuffle: button(() => onShuffle())
  });
  
  return <Leva collapsed />;
}


