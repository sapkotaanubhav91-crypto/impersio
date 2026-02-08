
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Search, 
  RefreshCcw, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Coins,
  Target,
  LayoutGrid,
  Cpu,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { searchNews } from '../services/googleSearchService';
import { SearchResult } from '../types';

// --- Real-Time Data Services ---

const CORS_PROXY = "https://corsproxy.io/?";

/**
 * Fetches real-time price for a stock or crypto symbol using Yahoo Finance.
 * Supports symbols like ^GSPC, AAPL, BTC-USD, etc.
 */
const fetchRealPrice = async (symbol: string) => {
  try {
    // We use a 1m interval to get the most recent trade data
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = await res.json();
    
    if (!data.chart?.result?.[0]) return null;
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose;
    const changeAbs = price - prevClose;
    const changePct = (changeAbs / prevClose) * 100;
    
    return {
      price,
      change: parseFloat(changePct.toFixed(2)),
      changeAbs: parseFloat(changeAbs.toFixed(2)),
      symbol: meta.symbol,
      exchange: meta.exchangeName
    };
  } catch (e) {
    console.error(`Error fetching real-time price for ${symbol}:`, e);
    return null;
  }
};

/**
 * Fetches historical chart data from Yahoo Finance for a specific period.
 */
const fetchRealHistory = async (symbol: string, period: string) => {
  let interval = '15m';
  let range = '1d';

  switch (period) {
    case '24H': interval = '2m'; range = '1d'; break;
    case '7D': interval = '15m'; range = '7d'; break;
    case '30D': interval = '1h'; range = '1mo'; break;
    case '90D': interval = '1d'; range = '3mo'; break;
    case '1Y': interval = '1d'; range = '1y'; break;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
    const data = await res.json();
    
    if (!data.chart?.result?.[0]) return [];
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0].close || [];

    return timestamps.map((ts: number, i: number) => ({
      time: new Date(ts * 1000).toISOString(),
      displayTime: period === '24H' 
        ? new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      value: quotes[i] || (i > 0 ? quotes[i-1] : null),
    })).filter((d: any) => d.value !== null);
  } catch (e) {
    console.error(`Error fetching history for ${symbol}:`, e);
    return [];
  }
};

const INITIAL_INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^VIX', name: 'VIX' },
];

const PERIODS = ['24H', '7D', '30D', '90D', '1Y'];

export const Finance: React.FC = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<any>({ symbol: '^GSPC', name: 'S&P 500', price: 0, change: 0, changeAbs: 0 });
  const [period, setPeriod] = useState('24H');
  const [chartData, setChartData] = useState<any[]>([]);
  const [news, setNews] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoverData, setHoverData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto' | 'predict'>('stocks');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Refs for intervals to prevent memory leaks
  const pollingRef = useRef<number | null>(null);
  const gridPollingRef = useRef<number | null>(null);

  // 1. Fetch Market Overview Grid
  const refreshIndices = async () => {
    const updated = await Promise.all(INITIAL_INDICES.map(async (idx) => {
      const data = await fetchRealPrice(idx.symbol);
      return data ? { ...idx, ...data } : { ...idx, price: 0, change: 0, changeAbs: 0 };
    }));
    setIndices(updated);
    
    // Sync active symbol if it's currently selected in the grid
    const activeFromGrid = updated.find(i => i.symbol === activeSymbol.symbol);
    if (activeFromGrid) {
      setActiveSymbol(activeFromGrid);
    }
    setLastUpdated(new Date());
  };

  // 2. Fetch Active Stock History and News
  const refreshActiveData = async () => {
    setIsLoading(true);
    const [history, newsData] = await Promise.all([
      fetchRealHistory(activeSymbol.symbol, period),
      searchNews(`${activeSymbol.name} ${activeSymbol.symbol} financial reports`)
    ]);
    setChartData(history);
    setNews(newsData.results.slice(0, 6));
    setIsLoading(false);
  };

  // 3. Effect: Initial Load and Periodic Grid Refresh (every 30s)
  useEffect(() => {
    refreshIndices();
    gridPollingRef.current = window.setInterval(refreshIndices, 30000);
    return () => {
        if (gridPollingRef.current) clearInterval(gridPollingRef.current);
    };
  }, []);

  // 4. Effect: Refresh chart when active symbol or period changes
  useEffect(() => {
    refreshActiveData();
    
    // High-frequency price updates for the active stock (every 5 seconds)
    pollingRef.current = window.setInterval(async () => {
      const live = await fetchRealPrice(activeSymbol.symbol);
      if (live) {
        setActiveSymbol(prev => ({ ...prev, ...live }));
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeSymbol.symbol, period]);

  const handleSearchStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const data = await fetchRealPrice(searchQuery.toUpperCase());
    if (data) {
      setActiveSymbol({
        symbol: searchQuery.toUpperCase(),
        name: searchQuery.toUpperCase(),
        ...data
      });
      setIsSearchOpen(false);
      setSearchQuery('');
    } else {
      // Logic for crypto symbols if yahoo fails (e.g. search Binance)
      alert(`Symbol "${searchQuery.toUpperCase()}" not found on public index.`);
    }
    setIsLoading(false);
  };

  const isPositive = activeSymbol.change >= 0;
  const color = isPositive ? '#10B981' : '#EF4444'; 

  return (
    <div className="flex flex-col h-full bg-background text-primary font-sans animate-fade-in overflow-y-auto">
      <div className="max-w-[1400px] mx-auto w-full px-6 py-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <BarChart3 className="w-7 h-7 text-[#21808D]" />
                <h1 className="text-3xl font-medium tracking-tight text-primary">Finance</h1>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end text-[10px] text-muted font-bold uppercase tracking-widest leading-none gap-1">
                    <span>Live Connection Active</span>
                    <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
                {isSearchOpen ? (
                     <form onSubmit={handleSearchStock} className="relative animate-in fade-in slide-in-from-right-2">
                        <input 
                            autoFocus
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onBlur={() => !searchQuery && setIsSearchOpen(false)}
                            placeholder="Enter ticker (e.g. AAPL, BTC-USD, NVDA)" 
                            className="bg-surface border border-border rounded-full px-5 py-2.5 text-sm w-80 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm transition-all"
                        />
                    </form>
                ) : (
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-full text-sm font-medium transition-all group shadow-sm"
                    >
                        <Search className="w-4 h-4 text-muted group-hover:text-primary" />
                        <span>Search stocks</span>
                    </button>
                )}
                <button 
                    onClick={() => { refreshIndices(); refreshActiveData(); }}
                    className="p-2.5 text-muted hover:text-primary transition-colors hover:bg-surface-hover rounded-full border border-border/50"
                    title="Force Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-[#21808D]' : ''}`} />
                </button>
            </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mb-8">
            <button 
                onClick={() => setActiveTab('stocks')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === 'stocks' 
                        ? 'bg-[#21808D]/15 text-[#21808D] border border-[#21808D]/30 shadow-sm' 
                        : 'bg-surface/50 text-muted hover:text-primary hover:bg-surface border border-transparent'
                }`}
            >
                <LayoutGrid className="w-4 h-4" /> Stocks
            </button>
            <button 
                onClick={() => {
                    setActiveTab('crypto');
                    setActiveSymbol({ symbol: 'BTC-USD', name: 'Bitcoin' });
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === 'crypto' 
                        ? 'bg-[#21808D]/15 text-[#21808D] border border-[#21808D]/30 shadow-sm' 
                        : 'bg-surface/50 text-muted hover:text-primary hover:bg-surface border border-transparent'
                }`}
            >
                <Coins className="w-4 h-4" /> Crypto
            </button>
            <button 
                onClick={() => setActiveTab('predict')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === 'predict' 
                        ? 'bg-[#21808D]/15 text-[#21808D] border border-[#21808D]/30 shadow-sm' 
                        : 'bg-surface/50 text-muted hover:text-primary hover:bg-surface border border-transparent'
                }`}
            >
                <Target className="w-4 h-4" /> Predict
            </button>
        </div>

        {/* Real-Time Market Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {indices.length > 0 ? indices.map((idx) => (
                <div 
                    key={idx.symbol}
                    onClick={() => setActiveSymbol(idx)}
                    className={`
                        p-5 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden group
                        ${activeSymbol.symbol === idx.symbol 
                            ? 'bg-surface border-[#21808D]/50 shadow-md ring-1 ring-[#21808D]/20' 
                            : 'bg-surface border-border hover:border-border/80 shadow-elegant'}
                    `}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className={`w-4 h-4 ${activeSymbol.symbol === idx.symbol ? 'text-[#21808D]' : 'text-muted'}`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted">{idx.name}</span>
                    </div>
                    
                    <div className="text-2xl font-semibold text-primary mb-2 font-mono tabular-nums tracking-tighter">
                        {idx.price > 0 ? idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                    </div>
                    
                    <div className={`flex items-center gap-2 text-sm font-bold ${idx.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {idx.change >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                        <span>{idx.change > 0 ? '+' : ''}{idx.change}%</span>
                        <span className="opacity-50 text-[10px] font-mono">({idx.changeAbs > 0 ? '+' : ''}{idx.changeAbs})</span>
                    </div>
                </div>
            )) : (
                [1,2,3,4].map(i => <div key={i} className="h-32 bg-surface animate-pulse rounded-2xl border border-border"></div>)
            )}
        </div>

        {/* Dynamic Trading Chart Card */}
        <div className="w-full bg-surface border border-border rounded-[32px] p-6 md:p-10 mb-10 relative shadow-elegant overflow-hidden">
             {isLoading && (
                 <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#21808D]" />
                 </div>
             )}

             {/* Stock Info Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-[#21808D]/10 flex items-center justify-center border border-[#21808D]/20 shadow-inner">
                        <Cpu className="w-8 h-8 text-[#21808D]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1.5">
                            <h2 className="text-2xl font-bold text-primary tracking-tight">{activeSymbol.name}</h2>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#21808D]/10 text-[#21808D] border border-[#21808D]/20 uppercase tracking-tighter">
                                {activeSymbol.symbol}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-4">
                             <span className="text-4xl font-mono font-medium tracking-tighter text-primary tabular-nums">
                                ${(hoverData?.value || activeSymbol.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                             </span>
                             <div className={`flex items-center gap-1.5 text-base font-bold px-3 py-1 rounded-full ${
                                 isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                             }`}>
                                {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(activeSymbol.change)}%
                             </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="ml-auto md:ml-0 flex items-center gap-2.5 px-6 py-2.5 bg-background hover:bg-surface-hover border border-border rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4 text-muted" />
                        Change Stock
                    </button>
                </div>
             </div>

             {/* Chart Viewport */}
             <div className="space-y-8">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between pb-6 border-b border-border/40">
                    <div className="flex gap-4">
                        {PERIODS.map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-2 py-1 text-sm font-bold transition-all relative ${
                                    period === p 
                                        ? 'text-[#21808D]' 
                                        : 'text-muted hover:text-primary'
                                }`}
                            >
                                {p}
                                {period === p && <div className="absolute -bottom-[25px] left-0 right-0 h-0.5 bg-[#21808D] rounded-full" />}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
                        <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Real-Time Feed</span>
                    </div>
                </div>

                {/* Main Graph */}
                <div className="h-[450px] w-full relative group/chart select-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                            data={chartData} 
                            onMouseMove={(data) => {
                                if (data.activePayload) {
                                    setHoverData(data.activePayload[0].payload);
                                }
                            }}
                            onMouseLeave={() => setHoverData(null)}
                            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="4 4" 
                                stroke="var(--border)" 
                                opacity={0.15} 
                                vertical={false} 
                            />
                            <XAxis 
                                dataKey="displayTime" 
                                hide={false}
                                axisLine={false} 
                                tickLine={false}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 'bold' }}
                                minTickGap={60}
                            />
                            <YAxis 
                                domain={['auto', 'auto']} 
                                orientation="right" 
                                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => val.toLocaleString()}
                                width={70}
                            />
                            <Tooltip 
                                content={() => null} 
                                cursor={{ stroke: 'var(--text-secondary)', strokeWidth: 1, strokeDasharray: '6 6' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={color} 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                                animationDuration={1200}
                                isAnimationActive={false} // Disable initial jump animation for live feel
                            />
                            {hoverData && (
                                <ReferenceLine x={hoverData.displayTime} stroke="var(--text-secondary)" strokeDasharray="3 3" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Cursor Legend */}
                    {hoverData && (
                        <div className="absolute top-0 right-[80px] bg-background border-2 border-border px-5 py-3 rounded-2xl shadow-2xl pointer-events-none z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-muted font-black uppercase tracking-wider">{hoverData.displayTime}</span>
                                <span className="text-2xl font-mono font-medium text-primary tabular-nums tracking-tighter">
                                    ${hoverData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>

        {/* Global Finance News */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#21808D]/10 rounded-xl border border-[#21808D]/20">
                        <TrendingUp className="w-5 h-5 text-[#21808D]" />
                    </div>
                    <h3 className="text-xl font-bold text-primary tracking-tight">Financial Intelligence</h3>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.length > 0 ? news.map((item, idx) => (
                    <a 
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex flex-col h-full bg-surface border border-border rounded-2xl p-6 hover:bg-surface-hover transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                    >
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm">
                                {item.displayLink}
                            </span>
                            <span className="text-[10px] text-muted font-bold whitespace-nowrap">
                                {item.publishedDate || 'Breaking'}
                            </span>
                        </div>
                        
                        <h4 className="text-base font-bold text-primary leading-snug mb-3 group-hover:text-[#21808D] transition-colors line-clamp-2">
                            {item.title}
                        </h4>
                        
                        <p className="text-sm text-muted leading-relaxed line-clamp-3 mb-6 flex-1 opacity-80">
                            {item.snippet}
                        </p>

                        <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/50">
                            {item.image ? (
                                <img src={item.image} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-[#21808D]/10 flex items-center justify-center border border-[#21808D]/20">
                                    <TrendingUp className="w-5 h-5 text-[#21808D]" />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-muted uppercase group-hover:text-primary transition-colors">Open Report</span>
                                <span className="text-[10px] text-muted/60">Verified Source</span>
                            </div>
                        </div>
                    </a>
                )) : (
                    [1,2,3].map(i => <div key={i} className="h-64 bg-surface animate-pulse rounded-2xl border border-border"></div>)
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
