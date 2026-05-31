import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { getMe } from '../../lib/apiClient';
import type { Role } from '../components/types';

const PROFILE_FETCH_TIMEOUT_MS = 10_000;

// ---------- Types ----------

interface Profile {
  id: string;
  full_name: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

// ---------- Context ----------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------- Provider ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const timeout = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), PROFILE_FETCH_TIMEOUT_MS);
    });

    const fromSupabase = supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return null;
        return data as Profile;
      });

    const fromApi = getMe().catch(() => null);

    const profile = await Promise.race([fromSupabase, fromApi, timeout]);
    return profile;
  }

  async function applySession(session: { user: User } | null) {
    setUser(session?.user ?? null);
    if (session?.user) {
      const p = await fetchProfile(session.user.id);
      setProfile(p);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const bootTimeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(bootTimeout);
      void applySession(session);
    });

    // Defer async work — awaiting Supabase calls inside this callback can deadlock signInWithPassword.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void applySession(session);
      }, 0);
    });

    return () => {
      clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // ---------- Auth actions ----------

  async function signIn(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    if (data.session?.user) {
      setUser(data.session.user);
      const p = await fetchProfile(data.session.user.id);
      if (!p) {
        return 'Signed in, but your profile could not be loaded. Check that the API worker is running (cd worker && npm run dev).';
      }
      setProfile(p);
      setLoading(false);
    }

    return null;
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return error.message;
    return null;
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- Hook ----------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}