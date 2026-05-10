import dynamic from 'next/dynamic';

/** Defers tsparticles (~large) until after first paint; not needed on SSR. */
export const ParticlesBackground = dynamic(() => import('./Particles'), {
  ssr: false,
  loading: () => null,
});
