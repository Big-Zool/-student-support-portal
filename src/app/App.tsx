import { ThemeProvider } from 'next-themes';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './components/LoginPage';
import { StudentInbox } from './components/StudentInbox';
import { SalesManagerInbox } from './components/SalesManagerInbox';
import { Loader2 } from 'lucide-react';

// AppContent reads the real auth state and renders the correct screen.
// Think of it like a traffic cop: it checks who you are and sends you to the right page.
function AppContent() {
  const { user, profile, loading, signOut } = useAuth();

  // While we're checking if there's an active session, show a spinner
  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Not logged in → show login page
  if (!user || !profile) {
    return (
      <div className="h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <LoginPage />
      </div>
    );
  }

  // Logged in → show role-appropriate inbox
  return (
    <div className="h-dvh flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Small logout bar at the top showing who's logged in */}
      <div className="flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 px-3 py-2 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
              Logged in as:
            </span>
            <span className="text-xs text-white font-semibold">{profile.full_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              profile.role === 'student'
                ? 'bg-violet-600 text-white'
                : profile.role === 'sales'
                ? 'bg-blue-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {profile.role}
            </span>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Render the correct inbox based on role */}
      <div className="flex-1 overflow-hidden">
        {profile.role === 'student' ? (
          <div className="h-full">
            <StudentInbox />
          </div>
        ) : (
          <div className="h-full">
            <SalesManagerInbox role={profile.role} />
          </div>
        )}
      </div>
    </div>
  );
}

// App is the root — it wraps everything with ThemeProvider and AuthProvider.
// AuthProvider must wrap everything so that useAuth() works anywhere in the tree.
export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
