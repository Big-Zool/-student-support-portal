import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import type { Role } from '../components/types';

// ---------- Types ----------

interface Profile {
  id: string;
  full_name: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;        // The raw Supabase auth user
  profile: Profile | null;  // Our custom profiles table row (includes role)
  loading: boolean;         // True while we're checking the session on startup
  signIn: (email: string, password: string) => Promise<string | null>;   // returns error message or null
  signUp: (email: string, password: string, fullName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

// ---------- Context ----------

// Think of Context like a global variable that any component in the tree can read.
// We create it here and export a hook `useAuth` so components can access it easily.
const AuthContext = createContext<AuthContextValue | null>(null);

// ---------- Provider ----------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // start as true — we don't know the session yet

  // Fetch the profile row from our public.profiles table.
  // Retries a few times because after signup the DB trigger may take a moment.
  async function fetchProfile(userId: string, retries = 3): Promise<Profile | null> {
    for (let i = 0; i < retries; i++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single();

      if (data) return data as Profile;

      // If the profile doesn't exist yet (trigger still running), wait and retry
      if (error) {
        console.warn(`Profile fetch attempt ${i + 1}/${retries}:`, error.message);
        if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
      }
    }
    return null;
  }

  // On mount, check if there's already a logged-in session (e.g. user refreshed the page)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for login/logout events happening anywhere in the app
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

    // Clean up the listener when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // ---------- Auth actions ----------

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null; // null = success
  }

  async function signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<string | null> {
    // The DB trigger `handle_new_user` automatically creates a profile row
    // with role='student' when a new user is inserted into auth.users.
    // So we only need to call signUp — no manual profile insert needed!
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

// This is the hook components will call: const { user, profile, signIn } = useAuth();
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
