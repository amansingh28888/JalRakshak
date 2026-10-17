import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export type UserRole = 'admin' | 'field_worker' | 'analyst' | 'citizen' | null;
export type UserStatus = 'active' | 'pending_approval' | 'inactive';

export interface UserProfile {
  id: number | string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  state_ut?: string;
  district?: string;
  state_id?: string;
  district_id?: string;
  village?: string;
  status: UserStatus;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  status: UserStatus | null;
  isLoading: boolean;       // true while session is being verified on startup
  profileLoaded: boolean;   // true once profile resolution has finished
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  status: null,
  isLoading: true,
  profileLoaded: false,
  signOut: async () => {},
  refreshProfile: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Sequence ref to prevent race conditions during rapid state updates or token refreshes
  const fetchSeqRef = useRef(0);

  const resolveProfile = async (sessionData: Session): Promise<UserProfile | null> => {
    const currentSeq = ++fetchSeqRef.current;
    const authUserId = sessionData.user.id;
    const userEmail = sessionData.user.email || '';

    try {
      // 1. Try authoritative FastAPI backend
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      try {
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${sessionData.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (fetchSeqRef.current === currentSeq) {
            let stateUt = data.state_ut || '';
            let district = data.district || '';
            let stateId = data.state_id || '';
            let districtId = data.district_id || '';
            let phone = data.phone || '';

            // If location is missing for a citizen, check citizen_profiles
            if (data.role === 'citizen' && (!stateUt || !district)) {
              try {
                const { data: cit } = await supabase
                  .from('citizen_profiles')
                  .select('*')
                  .eq('user_id', authUserId)
                  .maybeSingle();
                if (cit) {
                  stateUt = stateUt || cit.state || '';
                  district = district || cit.district || '';
                  stateId = stateId || cit.state_id || '';
                  districtId = districtId || cit.district_id || '';
                  phone = phone || cit.mobile || '';
                }
              } catch {
                // Ignore fallback error
              }
            }

            const mappedProfile: UserProfile = {
              id: data.id,
              auth_user_id: data.auth_user_id,
              full_name: data.full_name || userEmail.split('@')[0],
              email: data.email || userEmail,
              phone: phone,
              role: data.role as UserRole,
              state_ut: stateUt,
              district: district,
              state_id: stateId,
              district_id: districtId,
              village: data.village || '',
              status: (data.status || 'active') as UserStatus,
            };
            setProfile(mappedProfile);
            return mappedProfile;
          }
          return null;
        }
      } catch (backendErr) {
        // Backend might be offline or running standalone; fall back to Supabase client
        console.warn('Backend /api/auth/me unavailable, querying Supabase directly:', backendErr);
      }

      // 2. Query user_profiles directly from Supabase (protected by RLS)
      const { data: dbUser, error: dbErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (fetchSeqRef.current !== currentSeq) return null;

      if (dbUser && !dbErr) {
        let stateUt = dbUser.state_ut || '';
        let district = dbUser.district || '';
        let stateId = dbUser.state_id || '';
        let districtId = dbUser.district_id || '';
        let phone = dbUser.phone || '';

        if (dbUser.role === 'citizen' && (!stateUt || !district)) {
          try {
            const { data: cit } = await supabase
              .from('citizen_profiles')
              .select('*')
              .eq('user_id', authUserId)
              .maybeSingle();
            if (cit) {
              stateUt = stateUt || cit.state || '';
              district = district || cit.district || '';
              stateId = stateId || cit.state_id || '';
              districtId = districtId || cit.district_id || '';
              phone = phone || cit.mobile || '';
            }
          } catch {
            // Ignore fallback error
          }
        }

        const mappedProfile: UserProfile = {
          id: dbUser.id,
          auth_user_id: dbUser.auth_user_id,
          full_name: dbUser.full_name || sessionData.user.user_metadata?.full_name || userEmail.split('@')[0],
          email: dbUser.email || userEmail,
          phone: phone,
          role: (dbUser.role || 'citizen') as UserRole,
          state_ut: stateUt,
          district: district,
          state_id: stateId,
          district_id: districtId,
          village: dbUser.village || '',
          status: (dbUser.status || 'active') as UserStatus,
        };
        setProfile(mappedProfile);
        return mappedProfile;
      }

      // 3. Fallback: check citizen_profiles
      const { data: citizen, error: citErr } = await supabase
        .from('citizen_profiles')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      if (fetchSeqRef.current !== currentSeq) return null;

      if (citizen && !citErr) {
        const mappedProfile: UserProfile = {
          id: citizen.id,
          auth_user_id: citizen.user_id,
          full_name: citizen.full_name || userEmail.split('@')[0],
          email: citizen.email || userEmail,
          phone: citizen.mobile || '',
          role: 'citizen',
          state_ut: citizen.state || '',
          district: citizen.district || '',
          state_id: citizen.state_id || '',
          district_id: citizen.district_id || '',
          village: citizen.village || '',
          status: 'active',
        };
        setProfile(mappedProfile);
        return mappedProfile;
      }

      // 4. Default for new/OAuth user whose DB trigger hasn't finished or setup is needed
      const metaRole = sessionData.user.user_metadata?.role;
      const initialRole: UserRole = metaRole === 'field_worker' || metaRole === 'analyst' ? metaRole : 'citizen';
      const initialStatus: UserStatus = metaRole === 'field_worker' || metaRole === 'analyst' ? 'pending_approval' : 'active';

      const fallbackProfile: UserProfile = {
        id: authUserId,
        auth_user_id: authUserId,
        full_name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || userEmail.split('@')[0],
        email: userEmail,
        phone: '',
        role: initialRole,
        state_ut: '',
        district: '',
        village: '',
        status: initialStatus,
      };

      setProfile(fallbackProfile);
      return fallbackProfile;

    } catch (e) {
      console.error('Failed to resolve user profile:', e);
      if (fetchSeqRef.current === currentSeq) {
        setProfile(null);
      }
      return null;
    } finally {
      if (fetchSeqRef.current === currentSeq) {
        setProfileLoaded(true);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession) {
        await resolveProfile(newSession);
      } else {
        // User logged out
        fetchSeqRef.current++;
        setProfile(null);
        setProfileLoaded(true);
        setIsLoading(false);
      }
    });

    // Check existing session on boot if onAuthStateChange hasn't fired yet
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      if (existingSession && !session) {
        setSession(existingSession);
        setUser(existingSession.user);
        resolveProfile(existingSession);
      } else if (!existingSession) {
        setIsLoading(false);
        setProfileLoaded(true);
      }
    }).catch(err => {
      console.error('Error fetching initial auth session:', err);
      if (isMounted) {
        setIsLoading(false);
        setProfileLoaded(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!session) return null;
    return await resolveProfile(session);
  };

  const signOut = async () => {
    fetchSeqRef.current++;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during Supabase signout:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setProfileLoaded(true);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      role: profile?.role ?? null,
      status: profile?.status ?? null,
      isLoading,
      profileLoaded,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
