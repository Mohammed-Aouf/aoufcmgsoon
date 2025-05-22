
"use client";

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

// Assuming CelestialOrbProps will be defined in celestial-orb.tsx
// For now, we don't need to pass specific props if defaults are handled in the component.
// interface CelestialOrbLoaderProps {} // No specific props needed from page for now

const CelestialOrbWithNoSSR = dynamic(
  () => import('@/components/celestial-orb'),
  { ssr: false }
);

export default function CelestialOrbClientLoader(/*props: CelestialOrbLoaderProps*/) {
  return <CelestialOrbWithNoSSR />;
}
