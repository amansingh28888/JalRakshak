import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

type UserRole = 'admin' | 'field_worker' | null;

interface UserProfile {
  id: number;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  state_ut?: string;
  district?: string;
  village?: string;
  status: 'active' | 'inactive';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;       // true while session is being fetched on startup
  profileLoaded: boolean;   // true once profile fetch has completed (even if null)
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  profileLoaded: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchProfile = async (sessionData: Session) => {
    setProfileLoaded(false);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(
        `${baseUrl}/api/auth/me`,
        { headers: { Authorization: `Bearer ${sessionData.access_token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error('Failed to fetch profile:', e);
      setProfile(null);
    } finally {
      setProfileLoaded(true);
    }
  };

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) {
          fetchProfile(session).finally(() => setIsLoading(false));
        } else {
          setProfileLoaded(true);
          setIsLoading(false);
        }
      })
      .catch(e => {
        console.error('Supabase getSession error:', e);
        setProfileLoaded(true);
        setIsLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchProfile(session);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileLoaded(true);
  };

  return (
    <AuthContext.Provider value={{
      session, user, profile,
      role: profile?.role ?? null,
      isLoading, profileLoaded, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
