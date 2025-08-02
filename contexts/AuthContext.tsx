/* eslint-disable @typescript-eslint/no-explicit-any */
// contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Define types for our authentication context
interface User {
  id: string;
  email?: string;
  user_metadata?: any;
  [key: string]: any;
}

interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  [key: string]: any;
}

interface Profile {
  id: string; // This is both the profile ID and the user ID
  username: string;
  first_name: string;
  last_name: string;
  profile_photo?: string | null;
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
  [key: string]: any;
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Wrap fetchProfile in useCallback to prevent recreating the function on every render
  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!userId) return null;

      try {
        setProfileLoading(true);
        console.log('Fetching profile for user:', userId);

        // Fetch profile using the user's ID
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        console.log('Initializing auth state...');
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error fetching session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (data.session && mounted) {
          try {
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error('Error fetching user data:', userError);
            } else if (mounted && userData?.user) {
              setUser(userData.user);
              setSession(data.session);

              // Fetch user profile
              const userProfile = await fetchProfile(userData.user.id);
              if (userProfile) {
                setProfile(userProfile);
              }
            }
          } catch (userFetchError) {
            console.error('Exception fetching user:', userFetchError);
          }
        }
      } catch (e) {
        console.error('Exception in auth initialization:', e);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [fetchProfile, supabase]);

  // Set up auth state change listener
  useEffect(() => {
    if (!initialized) return;

    console.log('Setting up auth listener...');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        try {
          if (newSession) {
            const { data: userData, error: userError } =
              await supabase.auth.getUser();

            if (userError) {
              console.error(
                'Error fetching user data on state change:',
                userError
              );
              setUser(null);
              setSession(null);
              setProfile(null);
            } else if (userData?.user) {
              setUser(userData.user);
              setSession(newSession);

              // Fetch user profile on auth state change
              const userProfile = await fetchProfile(userData.user.id);
              if (userProfile) {
                setProfile(userProfile);
              }
            }
          } else {
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        } catch (e) {
          console.error('Exception in auth state change:', e);
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      }
    );

    return () => {
      console.log('Cleaning up auth listener...');
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, initialized, supabase]);

  // Wrap signInWithGoogle in useCallback - UPDATED for OAuth proxy
  const signInWithGoogle = useCallback(async (redirectTo: string = '') => {
    console.log('Initiating Google sign-in via OAuth proxy...');
    setLoading(true);

    try {
      // Build the proxy URL with optional redirect
      const proxyUrl = new URL('/api/auth/oauth', window.location.origin);
      proxyUrl.searchParams.set('provider', 'google');

      if (redirectTo) {
        proxyUrl.searchParams.set('redirectTo', redirectTo);
      }

      console.log('Redirecting to OAuth proxy:', proxyUrl.toString());

      // Redirect to your OAuth proxy (this will ultimately redirect to Google)
      window.location.href = proxyUrl.toString();
    } catch (err) {
      console.error('Exception during Google sign in via proxy:', err);
      setLoading(false);
      throw err;
    }
  }, []);

  // Wrap signOut in useCallback
  const signOut = useCallback(async () => {
    setLoading(true);
    console.log('Signing out...');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
        setUser(null);
        setSession(null);
        setProfile(null);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Exception during sign out:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  // Function to manually refresh the profile data - wrapped in useCallback
  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    }
  }, [fetchProfile, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        signInWithGoogle,
        signOut,
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
