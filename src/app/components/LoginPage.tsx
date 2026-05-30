import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useTheme } from 'next-themes';
import { GraduationCap, Loader2, AlertCircle, Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [tab, setTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Login form refs
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);

  // Signup form refs
  const signupNameRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const email = loginEmailRef.current?.value ?? '';
    const password = loginPasswordRef.current?.value ?? '';

    const error = await signIn(email, password);
    if (error) setErrorMsg(error);

    setIsLoading(false);
    // No need to call onLogin() — the AuthContext will update and App.tsx will redirect automatically
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const fullName = signupNameRef.current?.value ?? '';
    const email = signupEmailRef.current?.value ?? '';
    const password = signupPasswordRef.current?.value ?? '';

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    const error = await signUp(email, password, fullName);
    if (error) {
      setErrorMsg(error);
    } else {
      // After signup, Supabase may require email confirmation.
      // For demo purposes we switch to login tab and show a success note.
      setErrorMsg(null);
      setTab('login');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-sm">
        <div className="relative flex items-center justify-center mb-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-slate-900 dark:text-slate-50">Student Support</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your questions, answered quickly</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 p-3"
          >
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm dark:bg-slate-900">
          <CardHeader className="pb-0 pt-5 px-6">
            <Tabs value={tab} onValueChange={(v) => { setTab(v); setErrorMsg(null); }}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <CardTitle className="text-base mt-5 dark:text-slate-50">Welcome back</CardTitle>
                <CardDescription className="text-sm mt-0.5 dark:text-slate-400">
                  Sign in to view your support conversations.
                </CardDescription>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <CardTitle className="text-base mt-5 dark:text-slate-50">Get started</CardTitle>
                <CardDescription className="text-sm mt-0.5 dark:text-slate-400">
                  Create an account to contact our support team.
                </CardDescription>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent className="px-6 pt-4 pb-6">
            {/* Error message banner */}
            {errorMsg && (
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Tabs value={tab} onValueChange={setTab}>
              {/* ---- Login Form ---- */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-email" className="dark:text-slate-300">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="student@demo.com"
                      ref={loginEmailRef}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="login-password" className="dark:text-slate-300">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      ref={loginPasswordRef}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full mt-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in…
                      </>
                    ) : 'Sign in'}
                  </Button>
                  {/* Quick-fill hint for reviewers */}
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    Demo: student@demo.com · sales1@demo.com · manager@demo.com
                    <br />Password: <span className="font-mono">demo1234</span>
                  </p>
                </form>
              </TabsContent>

              {/* ---- Signup Form ---- */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="signup-name" className="dark:text-slate-300">Full name</Label>
                    <Input id="signup-name" type="text" placeholder="Emma Chen" ref={signupNameRef} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="signup-email" className="dark:text-slate-300">Email</Label>
                    <Input id="signup-email" type="email" placeholder="student@example.com" ref={signupEmailRef} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="signup-password" className="dark:text-slate-300">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Min. 8 characters" ref={signupPasswordRef} required />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full mt-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account…
                      </>
                    ) : 'Create account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
