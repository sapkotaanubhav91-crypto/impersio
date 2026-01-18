import React from 'react';

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

export const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const ReasoningIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a10 10 0 1 0 10 10H12V2z" opacity="0.5" />
    <path d="M12 2a10 10 0 1 1-10 10h10V2z" />
    <circle cx="12" cy="12" r="2" />
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
     <rect x="2" y="2" width="20" height="20" rx="4" fill="#FF6900" />
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
    <path 
      d="M16.275 6.075c-1.575 0-3.075.45-4.125 1.725-1.05-1.275-2.55-1.725-4.125-1.725-3.375 0-5.7 2.4-5.7 5.925 0 2.925 1.8 5.625 4.575 5.625 2.1 0 3.675-1.275 4.5-2.85.825 1.575 2.4 2.85 4.5 2.85 2.775 0 4.575-2.7 4.575-5.625 0-3.525-2.325-5.925-5.7-5.925h1.5zm-9.825 9.75c-1.8 0-3.3-1.65-3.3-3.825 0-2.025 1.425-3.825 3.3-3.825 1.575 0 2.925 1.2 3.225 3.15h-1.8c-.3-.825-.975-1.425-1.425-1.425-.75 0-1.35.825-1.35 2.1 0 1.275.6 2.1 1.35 2.1.45 0 1.125-.6 1.425-1.425h1.8c-.3 1.95-1.65 3.15-3.225 3.15zm9.825 0c-1.575 0-2.925-1.2-3.225-3.15h1.8c.3.825.975 1.425 1.425 1.425.75 0 1.35-.825 1.35-2.1 0-1.275-.6-2.1-1.35-2.1-.45 0-1.125.6-1.425 1.425h-1.8c.3-1.95 1.65-3.15 3.225-3.15 1.875 0 3.3 1.8 3.3 3.825 0 2.175-1.5 3.825-3.3 3.825z" 
      fill="#0081FB"
    />
  </svg>
);

export const KimiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
     {/* Large K */}
     <path d="M5 4V20H9V14L15 20H20L12.5 12.5L19 4H14L9 10.5V4H5Z" fill="currentColor" />
     {/* Blue Dot */}
     <circle cx="19.5" cy="5.5" r="3" fill="#2E83F6" />
  </svg>
);

export const QwenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M12 2.5L18.5 6.2V13.8L12 17.5L5.5 13.8V6.2L12 2.5ZM12 4.8L16.5 7.4V12.6L12 15.2L7.5 12.6V7.4L12 4.8Z"
      fill="#615CED"
      opacity="0.3"
    />
    <path 
      d="M12 2L19.79 6.5V15.5L12 20L4.21 15.5V6.5L12 2Z" 
      stroke="#615CED" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 7V13M12 13L16.5 15.5M12 13L7.5 15.5" 
      stroke="#615CED" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export const DeepSeekIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 2C16.5 2 12.5 5 11 8C9.5 11 12 12 12 12C12 12 8.5 12.5 7 15C5.5 17.5 7.5 20 7.5 20C7.5 20 4.5 18 4.5 15C4.5 12 7.5 9 7.5 9C7.5 9 5.5 8 5.5 6C5.5 4 7.5 2 7.5 2H16.5Z" fill="#4D6BFE" />
    <path d="M12 12L14.5 9.5M12 12L15 14" stroke="white" strokeWidth="2" />
  </svg>
);

export const ClaudeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM4.5 12C4.5 11.04 4.68 10.12 5.01 9.27C6.06 10.53 7.63 11.36 9.42 11.36C10.74 11.36 11.95 10.89 12.91 10.1C13.23 10.66 13.42 11.31 13.42 12C13.42 14.15 11.68 15.9 9.53 15.9C7.59 15.9 5.98 14.47 5.72 12.61C5.64 12.42 5.6 12.21 5.6 12C5.6 11.95 5.61 11.9 5.61 11.85C5.22 11.8 4.88 11.49 4.88 11.1C4.88 10.71 5.17 10.38 5.54 10.32C4.88 10.79 4.5 11.36 4.5 12ZM19.5 12C19.5 16.14 16.14 19.5 12 19.5C10.68 19.5 9.44 19.16 8.36 18.57C10.22 18.29 11.69 16.79 11.93 14.91C12.39 14.85 12.79 14.61 13.04 14.28C14.12 14.8 15.36 14.85 16.48 14.41C16.82 15.65 17.96 16.57 19.32 16.57C19.38 16.57 19.44 16.57 19.5 16.56V12Z" fill="#D97757" />
  </svg>
);

export const MistralIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 19V5L8 9V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    <path d="M8 9L12 5L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    <path d="M16 19V9L20 5V19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
  </svg>
);

export const PerplexityIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M5.5 7C5.5 6.17 6.17 5.5 7 5.5H10.5V18.5H7C6.17 18.5 5.5 17.83 5.5 17V7Z" fill="#22B3A6" />
     <path d="M13.5 5.5H17C17.83 5.5 18.5 6.17 18.5 7V17C18.5 17.83 17.83 18.5 17 18.5H13.5V5.5Z" fill="#22B3A6" />
     <path d="M10.5 5.5H13.5V8.5H10.5V5.5Z" fill="#22B3A6" fillOpacity="0.6" />
     <path d="M10.5 15.5H13.5V18.5H10.5V15.5Z" fill="#22B3A6" fillOpacity="0.6" />
  </svg>
);

export const GrokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M2 12V2H22V22H2V12ZM4 12V20H20V4H4V12Z" fill="white" />
    <path d="M8 8H16V16H8V8Z" fill="white" />
  </svg>
);