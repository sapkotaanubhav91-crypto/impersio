import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-react';
import { Clock, MessageSquare } from 'lucide-react';
import moment from 'moment';

export const Library = ({ onSelectThread }: { onSelectThread: (id: string) => void }) => {
  const { user } = useUser();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      
      const { data, error } = await supabase
        .from('library')
        .select('*')
        .eq('user_email', user.primaryEmailAddress.emailAddress)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setThreads(data);
      }
      setLoading(false);
    };

    fetchLibrary();
  }, [user]);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-foreground font-sans">
          Library
        </h1>
      </div>

      {loading ? (
        <div className="text-muted text-sm">Loading your threads...</div>
      ) : threads.length === 0 ? (
        <div className="text-muted text-sm">No threads found in your library yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className="flex flex-col text-left p-4 bg-surface hover:bg-surface-hover border border-border rounded-xl transition-colors group"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="mt-1 bg-black/5 dark:bg-white/5 p-2 rounded-lg text-muted group-hover:text-foreground transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {thread.query}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="capitalize">{thread.type || 'Search'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(thread.created_at).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
