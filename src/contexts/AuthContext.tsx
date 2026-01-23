import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/league';
import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from database with retry logic
  const fetchUserProfile = async (userId: string, retries = 3): Promise<User | null> => {
    console.log('[Auth] fetchUserProfile started for:', userId);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[Auth] Querying profiles table (attempt ${attempt}/${retries})...`);

        // Add timeout to individual query
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error(`[Auth] Profile query error (attempt ${attempt}):`, error.message);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
          return null;
        }

        if (!data) {
          console.error('[Auth] No profile data returned for user:', userId);
          return null;
        }

        console.log('[Auth] Profile data found for:', data.name);
        return {
          id: data.id,
          email: data.email,
          phone: data.phone,
          name: data.name,
          gender: data.gender as 'male' | 'female',
          playtomicLevel: data.playtomic_level,
          teamId: data.team_id || undefined,
          createdAt: data.created_at,
        };
      } catch (err: any) {
        console.error(`[Auth] Exception fetching profile (attempt ${attempt}):`, err.message || err);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        return null;
      }
    }
    return null;
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let profileFetchInProgress = false;
    console.log('[Auth] Initializing auth state...');

    // Check active session with timeout
    const initializeAuth = async () => {
      try {
        console.log('[Auth] Getting session...');

        // Add timeout to getSession to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) =>
          setTimeout(() => {
            console.log('[Auth] getSession timed out after 15s');
            resolve({ data: { session: null }, error: null });
          }, 15000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[Auth] getSession result - session:', !!session, 'error:', error?.message);

        if (session?.user && isMounted) {
          console.log('[Auth] Session found, fetching profile for:', session.user.id);
          profileFetchInProgress = true;
          const profile = await fetchUserProfile(session.user.id);
          profileFetchInProgress = false;
          console.log('[Auth] Profile fetched:', profile?.name);
          if (isMounted) {
            setUser(profile);
          }
        } else {
          console.log('[Auth] No session found');
        }
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        profileFetchInProgress = false;
      } finally {
        if (isMounted) {
          console.log('[Auth] Setting loading to false');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange event:', event);

      // Skip INITIAL_SESSION event as we handle it above
      if (event === 'INITIAL_SESSION') {
        console.log('[Auth] Skipping INITIAL_SESSION event');
        return;
      }

      if (session?.user && isMounted) {
        // Prevent duplicate profile fetches
        if (profileFetchInProgress) {
          console.log('[Auth] Profile fetch already in progress, skipping');
          return;
        }

        console.log('[Auth] Auth state changed, fetching profile...');
        profileFetchInProgress = true;
        const profile = await fetchUserProfile(session.user.id);
        profileFetchInProgress = false;
        if (isMounted) {
          setUser(profile);
          setLoading(false);
        }
      } else if (isMounted) {
        console.log('[Auth] Auth state changed, no session');
        setUser(null);
        setLoading(false);
      }
    });

    // Handle visibility change - refresh session when user returns to tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMounted && !profileFetchInProgress) {
        console.log('[Auth] Tab became visible, refreshing session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted && !profileFetchInProgress) {
            profileFetchInProgress = true;
            const profile = await fetchUserProfile(session.user.id, 2); // Fewer retries for background refresh
            profileFetchInProgress = false;
            if (isMounted) {
              setUser(profile);
            }
          }
        } catch (err) {
          console.error('[Auth] Error refreshing session on visibility change:', err);
          profileFetchInProgress = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Login attempt started for:', email);

    try {
      // Add timeout to the sign-in operation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      console.log('[Auth] Calling signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      clearTimeout(timeoutId);
      console.log('[Auth] signInWithPassword completed, error:', error?.message || 'none');

      if (error) {
        console.log('[Auth] Login error from Supabase:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('[Auth] User authenticated successfully');
        // Don't fetch profile here - onAuthStateChange will handle it
        // This prevents duplicate fetches and race conditions
        return { success: true };
      }

      console.log('[Auth] No user data returned');
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      console.error('[Auth] Login exception:', err);
      // Handle abort specifically
      if (err.name === 'AbortError') {
        return { success: false, error: 'Login timeout - please check your internet connection and try again' };
      }
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const register = async (
    userData: Omit<User, 'id' | 'createdAt'>,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password,
        options: {
          data: {
            phone: userData.phone,
            name: userData.name,
            gender: userData.gender,
            playtomic_level: userData.playtomicLevel,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' };
      }

      // Profile is automatically created by database trigger
      const profile = await fetchUserProfile(authData.user.id);
      setUser(profile);

      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    const dbUpdates: any = {};
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.playtomicLevel !== undefined) dbUpdates.playtomic_level = updates.playtomicLevel;
    if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    } else {
      console.error('Error updating profile:', error);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
