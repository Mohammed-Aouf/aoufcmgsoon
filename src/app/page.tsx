
import CelestialOrbClientLoader from '@/components/celestial-orb-client-loader';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen w-screen overflow-hidden pt-20 sm:pt-24"
      aria-label="Home page with celestial orb animation"
    >
      {/* Orb container - positioned absolutely to be more like a background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-full h-[60vh] sm:h-[65vh] md:h-[70vh] max-h-[500px] opacity-75">
          <CelestialOrbClientLoader />
        </div>
      </div>

      <h1
        className="relative z-20 text-5xl sm:text-6xl md:text-7xl font-bold text-primary-foreground text-center px-4"
        style={{ marginTop: 'calc(1vh + 0.5rem)', marginBottom: 'calc(5vh + 1rem)' }}
      >
        Coming soon...
      </h1>

      <Link
        href="mailto:contact@aoufmohammed.com"
        className="relative z-30 mt-12 flex items-center text-lg text-foreground hover:text-primary transition-colors"
        aria-label="Contact email address"
      >
        <Mail className="mr-2 h-5 w-5" />
        contact@aoufmohammed.com
      </Link>
    </main>
  );
}
