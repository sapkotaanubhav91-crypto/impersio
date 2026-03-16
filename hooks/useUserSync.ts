import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../services/supabaseClient';

export const useUserSync = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && isSignedIn && user) {
        const { id, primaryEmailAddress, fullName } = user;
        const email = primaryEmailAddress?.emailAddress;

        try {
          // First check if user exists to avoid overwriting credits/subscription_id
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', id)
            .single();

          if (!existingUser) {
            // New user: insert with defaults
            const { error } = await supabase
              .from('users')
              .insert({
                id: id,
                email: email,
                name: fullName,
                credits: 0, // Default credits
                subscription_id: null, // Default subscription
              });
            if (error) console.error('Error inserting user to Supabase:', error);
          } else {
            // Existing user: update only name/email
            const { error } = await supabase
              .from('users')
              .update({
                email: email,
                name: fullName,
              })
              .eq('id', id);
            if (error) console.error('Error updating user in Supabase:', error);
          }
        } catch (err) {
          console.error('Unexpected error during user sync:', err);
        }
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user]);
};
