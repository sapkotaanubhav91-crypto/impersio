import { supabase } from '@/lib/supabase';

export const saveToLibrary = async (query: string, email: string, type: string) => {
  console.log('Saving to library:', { query, email, type });
  
  const { data, error } = await supabase
    .from('library')
    .insert([
      { 
        query, 
        user_email: email, 
        type,
        created_at: new Date().toISOString()
      }
    ]);

  if (error) {
    console.error('Error saving to Supabase library:', error);
    throw error;
  }
  
  return data;
};
