export default function ImpersioLogo({ className, variant = 'full' }: { className?: string, variant?: 'text' | 'full' }) {
  const src = 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg';
    
  return (
    <img 
      src={src} 
      alt="Impersio Logo" 
      className={className || (variant === 'full' ? "h-12 w-auto px-4" : "h-16 w-auto")} 
      referrerPolicy="no-referrer"
    />
  );
}
