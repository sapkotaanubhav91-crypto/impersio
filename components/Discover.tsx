
import React, { useState, useEffect } from 'react';
import { ChevronDown, MoreHorizontal, Clock, Heart } from 'lucide-react';
import { searchNews } from '../services/googleSearchService';
import { SearchResult } from '../types';

interface DiscoverProps {
  onBack: () => void;
}

const CATEGORIES = [
  { id: 'for-you', label: 'For You', query: 'Top trending news headlines today mix of technology business and world' },
  { id: 'top', label: 'Top', query: 'Top breaking world news today' },
  { id: 'tech', label: 'Tech & AI', query: 'Latest artificial intelligence and technology startup news' },
  { id: 'finance', label: 'Finance', query: 'Stock market economy and finance news today' },
  { id: 'health', label: 'Health', query: 'Latest medical health and wellness news' },
  { id: 'x', label: 'X (Twitter)', query: 'Trending viral topics on X Twitter today' },
];

export const Discover: React.FC<DiscoverProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState('for-you');
  const [news, setNews] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const category = CATEGORIES.find(c => c.id === activeCategory);
      if (category) {
        const response = await searchNews(category.query);
        
        // Use a dynamic search-based image fallback
        const resultsWithFallback = response.results.map((item) => ({
          ...item,
          image: item.image || `https://tse4.mm.bing.net/th?q=${encodeURIComponent(item.title)}&w=800&h=450&c=7&rs=1`
        }));
        setNews(resultsWithFallback);
      }
      setLoading(false);
    };

    fetchNews();
  }, [activeCategory]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return '';
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr || dateStr === "Recently") return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const categoriesList = CATEGORIES.slice(2); // Items for the dropdown

  return (
    <div className="flex flex-col h-full bg-background text-primary font-sans animate-fade-in transition-colors duration-300">
      {/* Header */}
      <div className="flex-none pt-12 pb-6 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <h1 className="text-5xl font-sans font-medium text-primary mb-8 tracking-tight">Discover</h1>
        
        <div className="flex items-center gap-6 border-b border-border pb-1">
          <button 
            onClick={() => setActiveCategory('for-you')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeCategory === 'for-you' ? 'text-primary' : 'text-muted hover:text-primary'}`}
          >
            For You
            {activeCategory === 'for-you' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>
          
          <button 
            onClick={() => setActiveCategory('top')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeCategory === 'top' ? 'text-primary' : 'text-muted hover:text-primary'}`}
          >
            Top
            {activeCategory === 'top' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsTopicsOpen(!isTopicsOpen)}
              className={`pb-3 text-sm font-medium transition-colors flex items-center gap-1 ${['tech', 'finance', 'health', 'x'].includes(activeCategory) ? 'text-primary' : 'text-muted hover:text-primary'}`}
            >
              Topics
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTopicsOpen ? 'rotate-180' : ''}`} />
              {['tech', 'finance', 'health', 'x'].includes(activeCategory) && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />}
            </button>
            
            {isTopicsOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {categoriesList.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setIsTopicsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-hover ${activeCategory === cat.id ? 'text-primary bg-surface-hover' : 'text-muted'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 scroll-smooth">
        <div className="max-w-7xl mx-auto">
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-80 bg-surface rounded-xl border border-border"></div>
                ))}
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, idx) => (
                <a 
                  key={idx} 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-surface hover:bg-surface-hover border border-border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Image Container */}
                  <div className="w-full aspect-video bg-surface-hover relative overflow-hidden">
                       <img 
                         src={item.image} 
                         alt={item.title}
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         loading="lazy"
                         onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const isBing = target.src.includes('bing.net');
                            if (!isBing) {
                                target.src = `https://tse4.mm.bing.net/th?q=${encodeURIComponent(item.title)}&w=800&h=450&c=7&rs=1`;
                            } else {
                                target.src = `https://picsum.photos/seed/${item.title.replace(/[^a-zA-Z0-9]/g, '')}/800/450?grayscale&blur=2`;
                            }
                         }}
                       />
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                         <div className="w-4 h-4 rounded-full bg-surface-hover overflow-hidden flex-shrink-0">
                            <img src={getFaviconUrl(item.link)} alt="" className="w-full h-full object-cover" />
                         </div>
                         <span className="text-xs text-muted font-medium truncate flex-1">{item.displayLink}</span>
                         <span className="text-xs text-muted whitespace-nowrap">{formatTime(item.publishedDate)}</span>
                    </div>

                    <h2 className="text-lg font-sans font-medium text-primary mb-2 line-clamp-2 leading-tight group-hover:text-blue-500 transition-colors">
                      {item.title}
                    </h2>

                    <p className="text-sm text-muted line-clamp-3 leading-relaxed mb-4 flex-1">
                      {item.snippet}
                    </p>
                    
                    <div className="flex items-center justify-end gap-4 mt-auto pt-3 border-t border-border">
                       <Heart className="w-4 h-4 text-muted hover:text-red-400 transition-colors hover:scale-110" />
                       <MoreHorizontal className="w-4 h-4 text-muted hover:text-primary transition-colors hover:scale-110" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
