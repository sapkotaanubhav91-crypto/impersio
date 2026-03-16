import { supabase } from './supabaseClient';

export const saveToLibrary = async (searchInput: string, userEmail: string, type: 'search' | 'research' = 'search') => {
  if (!searchInput.trim() || !userEmail) return;

  try {
    const { error } = await supabase
      .from('library')
      .insert({
        searchinput: searchInput,
        userEmail: userEmail,
        type: type,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving to library:', error);
    }
  } catch (err) {
    console.error('Unexpected error saving to library:', err);
  }
};
