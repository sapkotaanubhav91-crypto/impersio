
import React from 'react';

export const ImpersioLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Left Loop */}
    <rect x="3.5" y="3" width="10" height="18" rx="5" />
    {/* Right Loop (Overlapping) */}
    <path d="M14.5 21C17.5 21 20.5 18.5 20.5 12C20.5 5.5 17.5 3 14.5 3" />
    <path d="M14.5 3C13.5 3 12.5 3.5 11.5 4" /> 
    <path d="M14.5 21C13.5 21 12.5 20.5 11.5 20" />
    {/* Dot */}
    <circle cx="8.5" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const GLMIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 6h11.5l-6 12H20v2H6.5l6-12H4z" />
  </svg>
);

export const SidebarToggleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

export const CoffeeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

export const PenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const GraduationCapIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const SparklesIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  </svg>
);

// --- Existing Icons Below ---

export const PerplexityLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    <path d="M12 6L13.5 10.5L18 12L13.5 13.5L12 18L10.5 13.5L6 12L10.5 10.5L12 6Z" fillOpacity="0.5"/>
  </svg>
);

export const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const RedditIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.025-5.968c.316.2.686.308 1.077.308.39 0 .76-.108 1.076-.308.859-.544 2.275-.544 3.134 0 .285.18.673.13 1.01-.131.336-.26.43-.652.296-.993-.365-.926-1.92-1.393-3.616-.708.204-.374.341-.75.341-1.169 0-.961.547-1.554 1.34-1.554 1.251 0 2.268 1.017 2.268 2.268 0 .864-.486 1.614-1.206 1.996.111.411.171.84.171 1.282 0 2.404-2.14 4.354-4.777 4.354S7.252 18.75 7.252 16.346c0-.442.06-871.171-1.282-.72-.382-1.206-1.132-1.206-1.996 0-1.251 1.017-2.268 2.268-2.268.793 0 1.34.593 1.34 1.554 0 .419.137.795.341 1.169-1.696-.685-3.251-.218-3.616.708-.134.341-.04.733.296.993.337.261.725.311 1.01.131.859-.544 2.275-.544 3.134 0zm.422-5.787a1.134 1.134 0 1 0 0 2.268 1.134 1.134 0 0 0 0-2.268zm6.806 0a1.134 1.134 0 1 0 0 2.268 1.134 1.134 0 0 0 0-2.268z" />
  </svg>
);

export const GeminiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 21.6C12 16.2981 16.2981 12 21.6 12C16.2981 12 12 7.70193 12 2.4C12 7.70193 7.70193 12 2.4 12C7.70193 12 12 16.2981 12 21.6Z"
      fill="url(#gemini-gradient)"
    />
    <defs>
      <linearGradient id="gemini-gradient" x1="2.4" y1="2.4" x2="21.6" y2="21.6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4E96F6" />
        <stop offset="0.5" stopColor="#7B87E8" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
  </svg>
);

export const MimoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
     <rect x="2" y="2" width="20" height="20" rx="4" fill="#A84B2F" />
     <path d="M14.5 16.5V10.8L13.1 12.9L11.7 10.8V16.5H10V7.5H11.7L13.1 9.6L14.5 7.5H16.2V16.5H14.5ZM8.3 16.5H6.6V7.5H8.3V16.5Z" fill="white" />
  </svg>
);

export const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0843 7.6148-4.4216a.8183.8183 0 0 0 .4024-.7122v-4.836l2.3963-1.3912a.294.294 0 0 1 .4323.2541v8.8687a4.4566 4.4566 0 0 1-1.346 3.1977 4.4991 4.4991 0 0 1-6.7652.1656zm-9.6658-4.5772a4.4708 4.4708 0 0 1-.539-3.0305l.1466.0844 7.5532 4.3837a.823.823 0 0 0 .823 0l4.1624-2.4151v2.7824a.294.294 0 0 1-.1466.2541l-7.6715 4.45a4.485 4.485 0 0 1-3.6655-.1889 4.4944 4.4944 0 0 1-2.0728-2.9497.0094.0094 0 0 1 .0047-.0047l1.4055-.8353zm-1.0963-9.5289a4.4944 4.4944 0 0 1 2.9308-2.0681 4.4803 4.4803 0 0 1 3.6655.1889l-7.662 4.4406a.2893.2893 0 0 1-.4323-.2542V7.5746l4.1812 2.4246-.8277 4.869a.8183.8183 0 0 0-.823 0L2.9033 10.4883a4.5227 4.5227 0 0 1-.4055-2.1648zm14.5057-2.7871l-7.5532-4.3838a.823.823 0 0 0-.823 0l-4.1624 2.4152V2.7303a.294.294 0 0 1 .1466-.2542l7.6715-4.4453a4.485 4.485 0 0 1 3.6655.1889 4.4944 4.4944 0 0 1 2.0728 2.9497l-1.4102.8164a4.4661 4.4661 0 0 1 .3924 2.146zm4.6106 5.8624a4.4944 4.4944 0 0 1-2.9308 2.0681 4.4803 4.4803 0 0 1-3.6655-.1889l7.662-4.4406a.294.294 0 0 1 .4323.2541v8.831l-4.1812-2.4246.8277-4.869a.8183.8183 0 0 0 .823 0l4.5772 2.6562a4.5085 4.5085 0 0 1-3.5451 4.3884z"/>
  </svg>
);

export const MetaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M16.275 6.075c-1.575 0-3.075.45-4.125 1.725-1.05-1.275-2.55-1.725-4.125-1.725-3.375 0-5.7 2.4-5.7 5.925 0 2.925 1.8 5.625 4.575 5.625 2.1 0 3.675-1.275 4.5-2.85.825 1.575 2.4 2.85 4.5 2.85 2.775 0 4.575-2.7 4.575-5.625 0-3.525-2.325-5.925-5.7-5.925h1.5zm-9.825 9.75c-1.8 0-3.3-1.65-3.3-3.825 0-2.025 1.425-3.825 3.3-3.825 1.575 0 2.925 1.2 3.225 3.15h-1.8c-.3-.825-.975-1.425-1.425-1.425-.75 0-1.35.825-1.35 2.1 0 1.275.6 2.1 1.35 2.1.45 0 1.125-.6 1.425-1.425h1.8c-.3 1.95-1.65 3.15-3.225 3.15zm9.825 0c-1.575 0-2.925-1.2-3.225-3.15h1.8c.3.825.975 1.425 1.425 1.425.75 0 1.35-.825 1.35-2.1 0-1.275-.6-2.1-1.35-2.1-.45 0-1.125.6-1.425 1.425h-1.8c.3-1.95 1.65-3.15 3.225-3.15 1.875 0 3.3 1.8 3.3 3.825 0 2.175-1.5 3.825-3.3 3.825z" fill="#0081FB" />
  </svg>
);

export const KimiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
     <path d="M5 4V20H9V14L15 20H20L12.5 12.5L19 4H14L9 10.5V4H5Z" fill="currentColor" />
     <circle cx="19.5" cy="5.5" r="3" fill="#2E83F6" />
  </svg>
);

export const QwenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.5L18.5 6.2V13.8L12 17.5L5.5 13.8V6.2L12 2.5ZM12 4.8L16.5 7.4V12.6L12 15.2L7.5 12.6V7.4L12 4.8Z" fill="#615CED" opacity="0.3" />
    <path d="M12 2L19.79 6.5V15.5L12 20L4.21 15.5V6.5L12 2Z" stroke="#615CED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 7V13M12 13L16.5 15.5M12 13L7.5 15.5" stroke="#615CED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SearchIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const TelescopeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.5 4L22.5 2" />
    <path d="M12 22C17.5 22 22 17.5 22 12C22 11.5 21.9 11 21.8 10.6" />
    <path d="M2 12C2 6.5 6.5 2 12 2" />
    <path d="M15 15L19 19" />
    <circle cx="10" cy="10" r="5" />
  </svg>
);

export const GlobeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export const CPUIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

export const PaperclipIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

export const LibraryIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

export const FinanceIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export const LayoutGridIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

export const DiscoverIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
    <path d="m9 15 2-6 6-2-2 6-6 2z" />
  </svg>
);

export const CodeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const MonitorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const FileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

export const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const CatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5c2.5 0 4.5 2 4.5 4.5s-2 4.5-4.5 4.5S7.5 12 7.5 9.5 9.5 5 12 5z" />
    <path d="M12 5V3" />
    <path d="M15 6.5l1.5-1.5" />
    <path d="M16.5 9.5H18" />
    <path d="M15 12.5l1.5 1.5" />
    <path d="M12 14v2" />
    <path d="M9 12.5L7.5 14" />
    <path d="M7.5 9.5H6" />
    <path d="M9 6.5L7.5 5" />
  </svg>
);

export const ViewGridIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    <path d="M6.5 6.5h.01M17.5 6.5h.01M17.5 17.5h.01M6.5 17.5h.01" />
  </svg>
);

export const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M15.4,3.3C15,2.9,14.5,2.7,14,2.5c-0.5-0.2-1.1-0.3-1.6-0.3c-1.1,0-2.2,0.4-3.1,1.1C8.4,4.1,7.8,5,7.5,6l-0.1,0.4l-0.3,0.1C5,7.3,3.5,8.8,2.7,10.7c-0.8,1.9-0.9,4-0.1,6c0.7,1.9,2.2,3.4,4.1,4.2c1.9,0.8,4,0.7,5.9-0.1l0.3-0.1l0.2,0.3c0.9,1.3,2.4,2.1,4,2.1c0.8,0,1.6-0.2,2.3-0.6c0.7-0.4,1.3-1,1.8-1.7c0.4-0.7,0.7-1.5,0.7-2.3c0-0.8-0.3-1.6-0.7-2.3l-0.1-0.2l0.2-0.1c1.9-1.1,3-3.1,3-5.3c-0.1-2.2-1.3-4.1-3.2-5.2C19.1,4.4,17.3,3.3,15.4,3.3z M19.4,10.8c1.3,0.7,2.1,2,2.2,3.5c0,1.5-0.8,2.8-2.1,3.6l-0.7,0.4l0.4,0.7c0.5,0.9,0.5,2,0.1,2.9c-0.4,0.9-1.2,1.6-2.2,1.9c-0.5,0.1-1,0.2-1.5,0.2c-1,0-2-0.4-2.7-1.1l-0.4-0.4l-0.2,0.5c-0.7,1.8-2.4,2.9-4.3,2.9c-1,0-2-0.3-2.9-0.8c-1.8-1.1-2.7-3.1-2.4-5.2c0.2-2.1,1.6-3.8,3.5-4.5l0.6-0.2l-0.3-0.6C6,14,5.8,13,5.9,12c0.1-1,0.6-1.9,1.4-2.6c1.6-1.4,4-1.4,5.6,0.1l0.4,0.4l0.1-0.5c0.6-2.1,2.5-3.5,4.6-3.4c1.1,0,2.1,0.4,2.9,1.1c0.8,0.7,1.3,1.7,1.4,2.8C22.3,10.1,21.9,10.4,19.4,10.8z" />
  </svg>
);
