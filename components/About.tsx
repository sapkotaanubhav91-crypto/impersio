import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PerplexityLogo } from './Icons';

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
             <span className="text-2xl tracking-tight font-medium font-sans">Perplexity</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 pb-24">
        
        {/* Hero Section */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6 text-primary">About Impersio</h1>
          <p className="text-2xl md:text-3xl text-muted font-light leading-tight">
            The most intelligent way to search for truth.
          </p>
        </div>

        <div className="space-y-16">
          <section>
            <p className="text-lg leading-relaxed text-primary/90 mb-6">
              Impersio is a next-generation search AI built to deliver not just answers, but verified understanding.
            </p>
            <p className="text-lg leading-relaxed text-primary/90 mb-6">
              In a world where search engines return links and most AI systems return guesses, Impersio does something different:
              it searches, reasons, verifies, and explains — all in one place.
            </p>
            <p className="text-xl font-medium text-primary border-l-4 border-scira-accent pl-6 py-2">
              This is search rebuilt for the age of intelligence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-6">Why Impersio Exists</h2>
            <div className="space-y-4 text-lg text-muted/90">
              <p>
                Traditional search engines show you where information might be.
                Most AI tools tell you something confidently — even when it’s wrong.
              </p>
              <p>
                Impersio was built to combine the best of both worlds:
              </p>
              <ul className="space-y-3 mt-4">
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-primary">The breadth of search</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-primary">The depth of reasoning</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span className="text-primary">The discipline of verification</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 p-8 bg-surface rounded-2xl border border-border">
              <p className="text-center font-medium text-lg text-primary italic">
                "The best search AI doesn’t just retrieve information — it understands it."
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-8">What Makes Impersio the Best Search AI</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: "Search + reasoning", desc: "Impersio doesn’t dump links. It analyzes, connects, and explains." },
                { title: "Verification-first", desc: "Every response is grounded in logic and cross-checked information." },
                { title: "Explainable intelligence", desc: "You see why an answer is correct, not just the answer itself." },
                { title: "Honest uncertainty", desc: "When information is incomplete or unclear, Impersio says so." }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-surface hover:bg-surface-hover rounded-2xl border border-border transition-all duration-200">
                  <h3 className="font-semibold text-primary mb-2 text-lg">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
               <h3 className="text-lg font-medium text-primary mb-3">Who Impersio Is For</h3>
               <ul className="space-y-2 text-muted">
                 <li>• Students who want understanding, not shortcuts</li>
                 <li>• Builders and founders who need reliable research</li>
                 <li>• Professionals who depend on accurate information</li>
                 <li>• Curious minds who demand clarity over noise</li>
               </ul>
            </div>
          </section>

          <section className="pt-8 border-t border-border">
            <h2 className="text-2xl font-semibold mb-6">Our Mission</h2>
            <p className="text-2xl md:text-3xl font-light leading-relaxed text-primary">
              To build the world’s most trustworthy search AI —
              one that helps humans find truth, understand deeply, and decide confidently.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};