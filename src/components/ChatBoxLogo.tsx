export default function ChatBoxLogo({ className }: { className?: string }) {
  const src = 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg';
    
  return (
    <img 
      src={src} 
      alt="ChatBox Logo" 
      className={className || "h-14"} 
      referrerPolicy="no-referrer"
    />
  );
}
