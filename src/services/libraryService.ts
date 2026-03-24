import { supabase } from '@/lib/supabase';

export const saveToLibrary = async (query: string, email: string, type: string) => {
  console.log('Saving to library:', { query, email, type });
  
  const { data, error } = await supabase
    .from('library')
    .insert([
      { 
        searchinput: query, 
        userEmail: email, 
        type,
        created_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving to Supabase library:', error);
    alert('Supabase Save Error: ' + error.message + ' | ' + error.details);
    throw error;
  }
  
  return data;
};
