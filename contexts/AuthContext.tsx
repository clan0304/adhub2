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
  is_profile_completed: boolean;
  user_type: 'content_creator' | 'business_owner';
  [key: string]: any;
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: any | null;
    data: any | null;
  }>;
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

        // Changed from user_id to id to match your database schema
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId) // Changed from user_id to id
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
  ); // Only depend on supabase client

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

  // Wrap signIn in useCallback
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      console.log('Signing in with email and password...');

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Sign in error:', error);
        } else {
          console.log('Sign in successful');

          // If user has a profile but it's not completed, redirect to profile setup
          if (data.user) {
            const userProfile = await fetchProfile(data.user.id);

            if (!userProfile || !userProfile.is_profile_completed) {
              router.push('/profile-setup');
            } else {
              router.push('/');
            }
          }
        }

        return { data, error };
      } catch (err) {
        console.error('Exception during sign in:', err);
        return { data: null, error: err as any };
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile, router, supabase]
  );

  // Wrap signUp in useCallback
  const signUp = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      console.log('Signing up with email and password...');

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          console.error('Sign up error:', error);
        } else {
          console.log('Sign up successful');

          // Always redirect new users to profile setup
          if (data.user) {
            router.push('/profile-setup');
          }
        }

        return { data, error };
      } catch (err) {
        console.error('Exception during sign up:', err);
        return { data: null, error: err as any };
      } finally {
        setLoading(false);
      }
    },
    [router, supabase]
  );

  // Wrap signInWithGoogle in useCallback
  const signInWithGoogle = useCallback(
    async (redirectTo: string = '') => {
      console.log('Signing in with Google...');

      try {
        // Build the redirectTo URL with the destination encoded if provided
        const redirectUrl = redirectTo
          ? `${
              window.location.origin
            }/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
          : `${window.location.origin}/auth/callback`;

        console.log('Using redirect URL:', redirectUrl);

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          console.error('Google sign in error:', error);
          throw error;
        }
      } catch (err) {
        console.error('Exception during Google sign in:', err);
        throw err;
      }
    },
    [supabase]
  );

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
        signIn,
        signUp,
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
