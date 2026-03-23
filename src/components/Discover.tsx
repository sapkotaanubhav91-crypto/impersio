import { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  source: string;
}

export const Discover = ({ onBack }: { onBack: () => void }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async (query: string) => {
      try {
        const response = await fetch('https://google.serper.dev/news', {
          method: 'POST',
          headers: {
            'X-API-KEY': import.meta.env.VITE_SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query, num: 10 }) // Request 10 per query
        });
        const data = await response.json();
        return data.news ? data.news.map((n: any) => ({
          title: n.title,
          link: n.link,
          snippet: n.snippet,
          imageUrl: n.imageUrl,
          source: n.source
        })) : [];
      } catch (error) {
        console.error(`Error fetching ${query} news:`, error);
        return [];
      }
    };

    const queries = ['openai', 'tech news', 'ai news', 'deepmindnews', 'perplexity news'];
    
    Promise.all(queries.map(q => fetchNews(q))).then(results => {
      const aggregatedNews = results.flat().filter(item => item.imageUrl); // Filter for items with images
      setNews(aggregatedNews);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Tech & AI News</h1>
        <button onClick={onBack} className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg text-sm font-medium transition-all">Back</button>
      </div>
      {loading ? (
        <div className="text-center text-muted">Loading news...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {news.map((item, idx) => (
            <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover transition-colors flex flex-col gap-2">
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover object-center aspect-video rounded-lg" referrerPolicy="no-referrer" />}
              <h3 className="font-medium text-sm line-clamp-2">{item.title}</h3>
              <p className="text-xs text-muted line-clamp-2">{item.snippet}</p>
              <span className="text-[10px] text-muted-foreground mt-auto">{item.source}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
