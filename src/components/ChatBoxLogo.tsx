export default function ChatBoxLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="text-4xl font-medium tracking-tight text-gray-800 dark:text-gray-200" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        perplexity
      </span>
      <span className="text-sm font-medium text-[#1c7483] border border-[#1c7483]/30 rounded-md px-1.5 py-0.5 bg-[#1c7483]/5">
        pro
      </span>
    </div>
  );
}
