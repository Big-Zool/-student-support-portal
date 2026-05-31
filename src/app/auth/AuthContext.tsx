import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import type { Role } from '../components/types';

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

  async function fetchProfile(userId: string, retries = 3): Promise<Profile | null> {
  console.log('FETCHING PROFILE FOR:', userId);
  
  // Test the session token
  const { data: { session } } = await supabase.auth.getSession();
  console.log('HAS TOKEN:', !!session?.access_token);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  console.log('PROFILE RESULT:', { data, error });
  return data as Profile | null;
}
  supabase.auth.getSession().then(async ({ data: { session } }) => {
  console.log('SESSION BEFORE FETCH:', session?.access_token ? 'HAS TOKEN' : 'NO TOKEN');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session?.user?.id ?? '')
    .single();
  console.log('DIRECT QUERY:', { data, error });
});

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      console.log('SESSION:', session, 'ERROR:', error);
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---------- Auth actions ----------

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
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