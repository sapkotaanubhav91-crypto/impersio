import { LucideImage, LucideList, LucideSparkles, LucideVideo, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Markdown from 'react-markdown';

export function DisplayResult({ searchInputRecord, images, videos, sources, answer }: any) {
    const [activeTab, setActiveTab] = useState('Answer');

    const tabs = [
        { label: 'Answer', icon: LucideSparkles },
        { label: 'Images', icon: LucideImage },
        { label: 'Videos', icon: LucideVideo },
        { label: 'Sources', icon: LucideList, badge: sources?.length || 0 },
    ];

    const getDomain = (url: string) => {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    };

    return (
        <div className='mt-7 px-4 max-w-3xl mx-auto w-full'>
            <h2 className='font-medium text-3xl line-clamp-2 mb-8'>{searchInputRecord?.searchInput}</h2>
            
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-6">
                <div className="flex items-center space-x-6">
                    {tabs.map(({ label, icon: Icon, badge }) => (
                        <button
                            key={label}
                            onClick={() => setActiveTab(label)}
                            className={`flex items-center gap-1.5 relative text-sm font-medium transition-colors pb-2 ${
                                activeTab === label ? 'text-black' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{label}</span>
                            {badge !== undefined && badge > 0 && (
                                <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded-full min-w-[18px] text-center">
                                    {badge}
                                </span>
                            )}
                            {activeTab === label && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors">
                    1 task <ChevronRight className="w-3 h-3" />
                </div>
            </div>

            <div className="mt-6">
                {activeTab === 'Answer' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Elegant Source Cards */}
                        {sources && sources.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                {sources.slice(0, 3).map((source: any, idx: number) => (
                                    <a 
                                        key={idx} 
                                        href={source.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex flex-col p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/80 transition-all group"
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${getDomain(source.link)}&sz=64`} 
                                                alt="" 
                                                className="w-3.5 h-3.5 rounded-sm"
                                                referrerPolicy="no-referrer"
                                            />
                                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider truncate">
                                                {getDomain(source.link).split('.')[0]}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-medium text-gray-800 line-clamp-1 group-hover:text-black transition-colors">
                                            {source.title}
                                        </div>
                                    </a>
                                ))}
                                {sources.length > 3 && (
                                    <button 
                                        onClick={() => setActiveTab('Sources')}
                                        className="flex flex-col p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/80 transition-all group items-start justify-center"
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className="flex -space-x-1.5">
                                                {sources.slice(3, 5).map((s: any, i: number) => (
                                                    <img 
                                                        key={i}
                                                        src={`https://www.google.com/s2/favicons?domain=${getDomain(s.link)}&sz=32`} 
                                                        alt="" 
                                                        className="w-3 h-3 rounded-full border border-white bg-white"
                                                        referrerPolicy="no-referrer"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500">
                                                +{sources.length - 3} sources
                                            </span>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Answer Text */}
                        {answer && (
                            <div className="markdown-body prose dark:prose-invert max-w-none text-[15px] leading-relaxed text-gray-800">
                                <Markdown>{answer}</Markdown>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Images' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
                        {images?.slice(0, 12).map((img: any, idx: number) => (
                            <a key={idx} href={img.link} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-all shadow-sm">
                                <img src={img.image} alt={img.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </a>
                        ))}
                    </div>
                )}

                {activeTab === 'Videos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
                        {videos?.slice(0, 6).map((video: any, idx: number) => (
                            <a key={idx} href={video.link} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gray-100 bg-gray-50/50 hover:bg-gray-100/80 transition-all shadow-sm group">
                                <div className="aspect-video relative">
                                    <img src={video.image} alt={video.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm transform group-hover:scale-110 transition-transform">
                                            <LucideVideo className="w-5 h-5 text-black fill-black" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{video.title}</div>
                                    <div className="text-xs text-gray-500 truncate">{video.displayLink}</div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {activeTab === 'Sources' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-500">
                        {sources?.map((source: any, idx: number) => (
                            <a key={idx} href={source.link} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/80 transition-all shadow-sm group">
                                <div className="flex items-center gap-2 mb-2">
                                    <img 
                                        src={`https://www.google.com/s2/favicons?domain=${getDomain(source.link)}&sz=64`} 
                                        alt="" 
                                        className="w-4 h-4 rounded-sm"
                                        referrerPolicy="no-referrer"
                                    />
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {getDomain(source.link)}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-black transition-colors">
                                    {source.title}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2">
                                    {source.snippet}
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DisplayResult;
