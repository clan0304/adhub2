'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useUser } from '@clerk/nextjs';
import type { UserResource } from '@clerk/types'; // Import correct Clerk UserResource type
import { createClient } from '@/lib/supabase/client';

// Keep your existing Profile interface but update it
interface Profile {
  id: string; // Now stores Clerk user ID
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url?: string | null;
  is_profile_completed: boolean;
  user_type: 'content_creator' | 'business_owner';
  phone_number?: string | null;
  city?: string | null;
  country?: string | null;
  youtube_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  bio?: string | null;
  is_public?: boolean;
  is_collaborated?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextProps {
  user: UserResource | null; // Use UserResource type from @clerk/types
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: clerkLoaded } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!userId) return null;

      try {
        setProfileLoading(true);
        console.log('Fetching profile for Clerk user:', userId);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          return null;
        }

        console.log('Profile fetched:', data);
        return data as Profile;
      } catch (err) {
        console.error('Exception fetching profile:', err);
        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    [supabase]
  );

  // Fetch profile when Clerk user changes
  useEffect(() => {
    if (clerkLoaded && user) {
      fetchProfile(user.id).then(setProfile);
    } else if (clerkLoaded && !user) {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user, clerkLoaded, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      setProfile(userProfile);
    }
  }, [fetchProfile, user]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null, // Handle undefined by converting to null
        profile,
        loading: !clerkLoaded,
        profileLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
