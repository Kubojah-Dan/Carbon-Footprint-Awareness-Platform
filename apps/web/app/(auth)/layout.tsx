import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In — EarthPrint',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen max-h-screen relative flex flex-col bg-[#0A2318] text-ink-inverse overflow-hidden">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.35] filter blur-[3px] scale-[1.05]" 
        style={{ backgroundImage: `url('https://static.vecteezy.com/system/resources/thumbnails/049/141/745/small/a-glass-globe-encapsulating-a-small-plant-symbolizing-environmental-conservation-and-growth-surrounded-by-lush-greenery-photo.jpeg')` }}
      />

      <div className="relative z-10 flex-grow flex flex-col justify-between h-full max-h-screen overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 flex-shrink-0">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-green flex items-center justify-center shadow-glow group-hover:shadow-lg transition-shadow">
              <span className="text-lg" role="img" aria-label="EarthPrint">🌿</span>
            </div>
            <span className="font-display text-xl text-ink-inverse">EarthPrint</span>
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto flex justify-center px-4 py-4 md:py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center border-t border-white/5 bg-black/10 backdrop-blur-sm flex-shrink-0">
          <p className="text-xs text-pale-green/70">
            © 2026 EarthPrint · Making sustainable choices feel natural
          </p>
        </footer>
      </div>
    </div>
  );
}
