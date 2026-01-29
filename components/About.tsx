
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SciraLogo } from './Icons';

interface AboutProps {
  onBack: () => void;
}

export const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-background text-primary font-sans animate-fade-in transition-colors duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-muted hover:text-primary transition-colors hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="opacity-100 flex items-center gap-2">
             <SciraLogo className="w-6 h-6 text-primary" />
             <span className="font-sans text-xl font-bold tracking-tight">Scira</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 pb-24">
        
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-primary">About Scira</h1>
          <p className="text-2xl md:text-3xl text-muted font-light leading-tight">
            Minimalist intelligence for the modern web.
          </p>
        </div>

        <div className="space-y-16">
          <section>
            <p className="text-lg leading-relaxed text-primary/90 mb-6">
              Scira is a search engine built on a simple premise: clarity is power.
            </p>
            <p className="text-lg leading-relaxed text-primary/90 mb-6">
              We stripped away the noise, the ads, and the clutter to create a direct line between your curiosity and the truth.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-8">Core Principles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: "Zero Noise", desc: "No ads. No SEO spam. Just the answer." },
                { title: "Radical Speed", desc: "Engineered for millisecond latency." },
                { title: "Transparency", desc: "Always know where the information comes from." },
                { title: "Privacy First", desc: "Your curiosity is your business, not ours." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-surface hover:bg-surface-hover rounded-2xl border border-border transition-all duration-200">
                  <h3 className="font-semibold text-primary mb-2 text-lg">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-8 border-t border-border">
            <p className="text-xl font-light leading-relaxed text-primary">
              Built by <strong className="font-semibold">Anubhav Sapkota</strong> in the UAE.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
