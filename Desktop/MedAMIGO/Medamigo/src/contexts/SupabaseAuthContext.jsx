
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false);
      return false;
    }
    
    // Check local app_metadata first for speed
    const localRole = currentUser.app_metadata?.role;
    if (localRole === 'admin') {
      setIsAdmin(true);
      return true;
    }

    // If not in local metadata, query the database as a fallback
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      setIsAdmin(false);
      return false;
    }

    const roleIsAdmin = data?.role === 'admin';
    setIsAdmin(roleIsAdmin);
    return roleIsAdmin;
  }, []);
  
  const refreshUserRole = useCallback(async () => {
    // Manually refresh the user session to get the latest app_metadata
    const { data: { user: refreshedUser }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error.message);
      return;
    }
    setUser(refreshedUser);
    await checkAdminRole(refreshedUser);
  }, [checkAdminRole]);


  useEffect(() => {
    const processAuthStateChange = async (event, session) => {
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      await checkAdminRole(currentUser);
      setLoading(false);
    };

    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(processAuthStateChange);

    // Initial check
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      await processAuthStateChange('INITIAL_SESSION', initialSession);
    };
    
    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    } else {
      // Manually trigger role check after sign-in to ensure UI updates correctly
      const { data: { user } } = await supabase.auth.getUser();
      await checkAdminRole(user);
    }

    return { error };
  }, [toast, checkAdminRole]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    setIsAdmin(false); // Reset state immediately on sign out

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserRole,
  }), [user, session, isAdmin, loading, signUp, signIn, signOut, refreshUserRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
