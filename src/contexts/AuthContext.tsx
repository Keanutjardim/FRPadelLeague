import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/league';
import { supabase } from '@/lib/supabase';

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

  // Simple profile fetch - no complex retry/abort logic
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('[Auth] Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Auth] Profile fetch error:', error.message);
        return null;
      }

      if (!data) {
        console.error('[Auth] No profile data for user:', userId);
        return null;
      }

      console.log('[Auth] Profile loaded:', data.name);
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
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err);
      return null;
    }
  };

  // Initialize - check for existing session on mount
  useEffect(() => {
    let mounted = true;
    console.log('[Auth] Initializing...');

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[Auth] Initial session:', session ? 'exists' : 'none');

        if (session?.user && mounted) {
          const profile = await fetchUserProfile(session.user.id);
          if (mounted) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Listen for sign out and token refresh only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth event:', event);

      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Refresh profile on token refresh
        fetchUserProfile(session.user.id).then(profile => {
          if (mounted) setUser(profile);
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login - directly fetch and set profile after auth
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Auth] Login started for:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('[Auth] Login error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed - no user returned' };
      }

      console.log('[Auth] Auth successful, fetching profile...');

      // DIRECTLY fetch and set the profile - don't rely on event listener
      const profile = await fetchUserProfile(data.user.id);

      if (profile) {
        console.log('[Auth] Login complete, user:', profile.name);
        setUser(profile);
        return { success: true };
      } else {
        // Auth succeeded but profile fetch failed - still consider it a success
        // The user can refresh to try again
        console.log('[Auth] Profile fetch failed, but auth succeeded');
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          phone: '',
          name: data.user.user_metadata?.name || email,
          gender: data.user.user_metadata?.gender || 'male',
          playtomicLevel: data.user.user_metadata?.playtomic_level || 2,
          createdAt: data.user.created_at,
        });
        return { success: true };
      }
    } catch (err) {
      console.error('[Auth] Login exception:', err);
      return { success: false, error: 'An unexpected error occurred' };
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

      // Wait a moment for the database trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      const profile = await fetchUserProfile(authData.user.id);
      setUser(profile);

      return { success: true };
    } catch (err) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    const dbUpdates: Record<string, any> = {};
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
