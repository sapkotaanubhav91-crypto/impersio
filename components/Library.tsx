
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Clock, 
  Trash2, 
  FolderPlus, 
  ChevronRight, 
  X,
  LayoutGrid,
  Library as LibraryIcon,
  Check
} from 'lucide-react';
import { 
  getUserConversations, 
  deleteConversation, 
  getCollections, 
  createCollection, 
  deleteCollection,
  moveConversationToCollection 
} from '../services/chatStorageService';
import { SavedConversation, Collection } from '../types';

interface LibraryProps {
  onSelectThread: (id: string) => void;
}

export const Library: React.FC<LibraryProps> = ({ onSelectThread }) => {
  const [threads, setThreads] = useState<SavedConversation[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState<{ isOpen: boolean; threadId: string | null }>({ isOpen: false, threadId: null });
  
  // New Collection Form
  const [newColTitle, setNewColTitle] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColIcon, setNewColIcon] = useState('📁');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await getUserConversations('guest');
    const c = await getCollections();
    setThreads(t);
    setCollections(c);
  };

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this thread?')) {
      await deleteConversation(id);
      loadData();
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle) return;
    await createCollection(newColTitle, newColDesc, newColIcon);
    setIsCreateModalOpen(false);
    setNewColTitle('');
    setNewColDesc('');
    loadData();
  };

  const handleMoveToCollection = async (collectionId: string | null) => {
    if (isMoveModalOpen.threadId) {
      await moveConversationToCollection(isMoveModalOpen.threadId, collectionId);
      setIsMoveModalOpen({ isOpen: false, threadId: null });
      loadData();
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const filteredThreads = threads.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = activeCollectionId ? t.collection_id === activeCollectionId : true;
    return matchesSearch && matchesCollection;
  });

  return (
    <div className="flex flex-col h-full bg-[#f9faf5] dark:bg-[#121211] font-sans">
      {/* Top Header */}
      <div className="flex-none px-12 py-8 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-3">
          <LibraryIcon className="w-8 h-8 text-primary opacity-60" />
          <h1 className="text-3xl font-medium text-primary tracking-tight">Library</h1>
        </div>
        
        <div className="relative w-full max-w-md">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
           <input 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search your threads"
             className="w-full bg-white dark:bg-[#1C1C1C] border border-border rounded-full py-2.5 pl-12 pr-6 text-sm focus:outline-none focus:border-primary transition-colors"
           />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content: Threads */}
        <div className="flex-1 overflow-y-auto px-12 py-10 border-r border-border/40 scroll-smooth">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-primary opacity-60" />
              <h2 className="text-xl font-bold text-primary">Threads</h2>
            </div>
            <div className="flex items-center gap-2">
               <button className="p-2 text-muted hover:text-primary transition-colors rounded-lg bg-sidebar/50">
                  <MoreHorizontal className="w-4 h-4" />
               </button>
               <button className="p-2 text-muted hover:text-primary transition-colors rounded-lg bg-sidebar/50">
                  <Plus className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredThreads.map((thread) => (
              <div 
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className="group w-full text-left p-6 rounded-2xl hover:bg-white dark:hover:bg-[#1C1C1C] hover:shadow-sm border border-transparent hover:border-border transition-all cursor-pointer relative"
              >
                <h3 className="text-[17px] font-bold text-primary mb-1 line-clamp-1">{thread.title}</h3>
                <p className="text-sm text-muted line-clamp-2 leading-relaxed opacity-70 mb-4">
                  {thread.snippet || "No snippet available."}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(thread.created_at)}
                  </div>
                  {thread.collection_id && (
                     <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {collections.find(c => c.id === thread.collection_id)?.title}
                     </span>
                  )}
                </div>
                
                {/* Actions Popover Trigger (Simplified) */}
                <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                   <button 
                    onClick={(e) => { e.stopPropagation(); setIsMoveModalOpen({ isOpen: true, threadId: thread.id }); }}
                    className="p-2 text-muted hover:text-primary transition-colors hover:bg-sidebar rounded-lg"
                    title="Move to Collection"
                   >
                     <FolderPlus className="w-4 h-4" />
                   </button>
                   <button 
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="p-2 text-muted hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                    title="Delete Thread"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
            {filteredThreads.length === 0 && (
               <div className="py-20 text-center text-muted font-medium opacity-50 italic">
                  No threads found.
               </div>
            )}
          </div>
        </div>

        {/* Side Panel: Collections */}
        <div className="w-80 flex-none px-8 py-10 bg-sidebar/30">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-5 h-5 text-primary opacity-60" />
              <h2 className="text-xl font-bold text-primary">Collections</h2>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 text-muted hover:text-primary transition-colors rounded-lg bg-sidebar/50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
             <button 
               onClick={() => setActiveCollectionId(null)}
               className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${!activeCollectionId ? 'bg-white dark:bg-[#1C1C1C] border-border shadow-sm' : 'border-transparent hover:bg-sidebar/50'}`}
             >
                <div className="flex items-center gap-3">
                   <span className="text-xl">🗃️</span>
                   <span className="text-sm font-bold text-primary">All Threads</span>
                </div>
                <span className="text-xs font-bold text-muted opacity-60">{threads.length}</span>
             </button>

             {collections.map(col => {
                const threadCount = threads.filter(t => t.collection_id === col.id).length;
                return (
                  <button 
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all relative group ${activeCollectionId === col.id ? 'bg-white dark:bg-[#1C1C1C] border-border shadow-sm' : 'border-transparent hover:bg-sidebar/50'}`}
                  >
                     <div className="flex items-center gap-3">
                        <span className="text-xl">{col.icon}</span>
                        <span className="text-sm font-bold text-primary">{col.title}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted opacity-60">{threadCount}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted opacity-30" />
                     </div>
                     
                     {/* Delete Collection Action */}
                     <button 
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete collection?')) { deleteCollection(col.id); loadData(); } }}
                      className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-red-500 transition-opacity"
                     >
                       <X className="w-3 h-3" />
                     </button>
                  </button>
                );
             })}
          </div>
        </div>
      </div>

      {/* Create Collection Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 border border-border">
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-6 right-6 text-muted hover:text-primary"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-1">Create Collection</h2>
              <p className="text-muted text-sm mb-8">Organize and group your threads</p>
              
              <form onSubmit={handleCreateCollection} className="space-y-6">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Title</label>
                    <input 
                      value={newColTitle}
                      onChange={(e) => setNewColTitle(e.target.value)}
                      placeholder="Vacation Research"
                      className="w-full bg-sidebar/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                      autoFocus
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Description</label>
                    <textarea 
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      placeholder="Planning a trip to Mexico with Daniela"
                      rows={3}
                      className="w-full bg-sidebar/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2">Icon</label>
                    <div className="flex gap-2 flex-wrap">
                       {['📁', '🏖️', '🔬', '🚀', '🍱', '💡', '📝'].map(emoji => (
                          <button 
                            key={emoji}
                            type="button"
                            onClick={() => setNewColIcon(emoji)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${newColIcon === emoji ? 'bg-primary/10 border-primary border-2 scale-110' : 'bg-sidebar/50 border border-border hover:bg-sidebar'}`}
                          >
                            {emoji}
                          </button>
                       ))}
                    </div>
                 </div>
                 <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={!newColTitle}
                      className="w-full py-3.5 bg-[#1c7483] text-white rounded-xl font-bold shadow-lg shadow-[#1c7483]/20 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                       Create
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Move to Collection Modal */}
      {isMoveModalOpen.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-lg bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in-95 duration-200 border border-border">
              <button onClick={() => setIsMoveModalOpen({ isOpen: false, threadId: null })} className="absolute top-6 right-6 text-muted hover:text-primary"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-8">Choose Collection</h2>
              
              <div className="space-y-2">
                 <button 
                   onClick={() => handleMoveToCollection(null)}
                   className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-sidebar/50 hover:bg-sidebar transition-all"
                 >
                    <div className="flex items-center gap-3">
                       <Plus className="w-4 h-4 text-muted" />
                       <span className="text-sm font-bold text-primary">No Collection</span>
                    </div>
                 </button>

                 {collections.map(col => (
                    <button 
                      key={col.id}
                      onClick={() => handleMoveToCollection(col.id)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-sidebar/50 hover:bg-sidebar transition-all"
                    >
                       <div className="flex items-center gap-3">
                          <span className="text-xl">{col.icon}</span>
                          <span className="text-sm font-bold text-primary">{col.title}</span>
                       </div>
                       {threads.find(t => t.id === isMoveModalOpen.threadId)?.collection_id === col.id && (
                          <Check className="w-4 h-4 text-emerald-500" />
                       )}
                    </button>
                 ))}
                 
                 <button 
                  onClick={() => { setIsMoveModalOpen({ isOpen: false, threadId: isMoveModalOpen.threadId }); setIsCreateModalOpen(true); }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-border text-muted hover:text-primary transition-all mt-4"
                 >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">New Collection</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
