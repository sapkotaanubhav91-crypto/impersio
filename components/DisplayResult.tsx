import { LucideImage, LucideList, LucideSparkles, LucideVideo } from 'lucide-react';
import React, { useState } from 'react';

const tabs = [
    { label: 'Answer', icon: LucideSparkles },
    { label: 'Images', icon: LucideImage },
    { label: 'Videos', icon: LucideVideo },
    { label: 'Sources', icon: LucideList, badge: 10 },
];

interface SearchInputRecord {
    searchInput?: string;
    created_at?: Date | string;
}

interface DisplayResultProps {
    searchInputRecord?: SearchInputRecord;
}

const DisplayResult: React.FC<DisplayResultProps> = ({ searchInputRecord }) => {
    const [activeTab, setActiveTab] = useState('Answer');

    return (
        <div className='mt-7 px-4 md:px-8 max-w-4xl mx-auto w-full'>
            <h2 className='font-medium text-3xl line-clamp-2 text-foreground'>{searchInputRecord?.searchInput}</h2>
            <div className="flex items-center space-x-6 border-b border-border pb-2 mt-6 overflow-x-auto no-scrollbar">
                {tabs.map(({ label, icon: Icon, badge }) => (
                    <button
                        key={label}
                        onClick={() => setActiveTab(label)}
                        className={`flex items-center gap-1.5 relative text-sm font-medium transition-colors whitespace-nowrap pb-2 text-foreground`}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{label}</span>
                        {badge && (
                            <span className="ml-1 text-[10px] bg-surface text-muted px-1.5 py-0.5 rounded-full border border-border">
                                {badge}
                            </span>
                        )}
                        {activeTab === label && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground rounded-full"></span>
                        )}
                    </button>
                ))}
                <div className="ml-auto text-sm text-muted flex items-center gap-1">
                    1 task <span className="text-xs">↗</span>
                </div>
            </div>
        </div>
    );
};

export default DisplayResult;
