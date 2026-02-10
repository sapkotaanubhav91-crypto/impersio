import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Clock, MoreHorizontal, ArrowRight } from 'lucide-react';
import { searchNews } from '../services/googleSearchService';
import { SearchResult, ModelOption } from '../types';
import { InputBar } from './search/InputBar';

interface SportsProps {
  onSearch: (query: string) => void;
  query: string;
  setQuery: (q: string) => void;
  selectedModel: ModelOption;
  setSelectedModel: (m: ModelOption) => void;
  models: ModelOption[];
}

export const Sports: React.FC<SportsProps> = ({ 
  onSearch, 
  query, 
  setQuery,
  selectedModel,
  setSelectedModel,
  models
}) => {
  const [news, setNews] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-switch to Impersio Sports model when entering this view
  useEffect(() => {
    const sportsModel = models.find(m => m.id === 'impersio-sports');
    if (sportsModel && selectedModel.id !== 'impersio-sports') {
        setSelectedModel(sportsModel);
    }
  }, []);

  useEffect(() => {
    const fetchSportsNews = async () => {
      setLoading(true);
      // Fetch latest sports news
      const response = await searchNews('latest sports news nba nfl soccer tennis scores headlines');
      
      const resultsWithFallback = response.results.map((item) => ({
        ...item,
        // Fallback generic sports image if none provided
        image: item.image || `https://tse2.mm.bing.net/th?q=${encodeURIComponent(item.title + ' sports')}&w=800&h=450&c=7&rs=1`
      }));
      setNews(resultsWithFallback.slice(0, 4));
      setLoading(false);
    };

    fetchSportsNews();
  }, []);

  const getFaviconUrl = (url: string) => {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`;
    } catch {
      return '';
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hours ago`;
  };

  // Custom search handler to ensure we contextually search for sports if the user didn't specify
  const handleSportsSearch = () => {
    if (!query.trim()) return;
    // We pass the query back up to App.tsx to handle the chat transition
    onSearch(query);
  };

  return (
    <div className="flex flex-col h-full bg-background text-primary font-sans animate-fade-in overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[600px] w-full max-w-5xl mx-auto">
          
          {/* Hero Section */}
          <div className="w-full max-w-3xl flex flex-col items-center mb-12">
               {/* Branding */}
               <div className="flex items-center justify-center gap-3 mb-10 select-none">
                   <h1 className="text-5xl md:text-6xl tracking-tight text-primary font-sans font-medium">
                      impersio
                   </h1>
                   <span className="text-5xl md:text-6xl font-light text-muted font-serif italic tracking-tight">
                      sports
                   </span>
               </div>
               
               {/* Input Bar - Reusing standard but with specific placeholder */}
               <div className="w-full">
                   <InputBar 
                      query={query} 
                      setQuery={setQuery} 
                      handleSearch={handleSportsSearch} 
                      isInitial={true}
                      selectedModel={selectedModel}
                      setSelectedModel={setSelectedModel}
                      models={models}
                   />
                   <div className="text-center mt-6">
                        <div className="flex flex-wrap justify-center gap-3 text-sm text-muted">
                            <button onClick={() => onSearch('winter olympics live stream today')} className="hover:text-primary transition-colors flex items-center gap-1">
                                <SearchIcon className="w-3 h-3" /> winter olympics live stream today
                            </button>
                            <button onClick={() => onSearch('nba games on tv tonight')} className="hover:text-primary transition-colors flex items-center gap-1">
                                <SearchIcon className="w-3 h-3" /> nba games on tv tonight
                            </button>
                            <button onClick={() => onSearch('usa vs canada women\'s hockey')} className="hover:text-primary transition-colors flex items-center gap-1">
                                <SearchIcon className="w-3 h-3" /> usa vs canada women's hockey
                            </button>
                        </div>
                   </div>
               </div>
          </div>

          {/* What's Happening Section */}
          <div className="w-full max-w-[1000px] mt-8">
              <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-lg font-medium text-primary">What's Happening</h2>
                  <span className="text-xs text-muted">Updated just now</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {loading ? (
                      [1,2,3,4].map(i => (
                          <div key={i} className="h-64 bg-surface rounded-xl border border-border animate-pulse"></div>
                      ))
                  ) : (
                      news.map((item, idx) => (
                          <a 
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col h-full bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover hover:shadow-md transition-all duration-300"
                          >
                              <div className="flex items-center gap-2 mb-3">
                                  <div className="w-4 h-4 rounded-full bg-background overflow-hidden">
                                      <img src={getFaviconUrl(item.link)} className="w-full h-full object-cover" alt="" />
                                  </div>
                                  <span className="text-xs text-muted font-medium truncate">{formatTime(item.publishedDate)}</span>
                              </div>
                              
                              <h3 className="text-sm font-semibold text-primary leading-snug mb-2 line-clamp-3 group-hover:text-[#1c7483] transition-colors">
                                  {item.title}
                              </h3>
                              
                              <p className="text-xs text-muted line-clamp-3 mb-4 leading-relaxed opacity-80">
                                  {item.snippet}
                              </p>
                          </a>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

const SearchIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
