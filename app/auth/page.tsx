/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

// This component safely uses useSearchParams inside a Suspense boundary
function AuthContent() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, loading, signIn, signUp, signInWithGoogle } =
    useAuth();

  // Check if there's a reset=success param to show password reset success message
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setResetSuccess(true);

      // Clear the query parameter from URL after 5 seconds
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        setResetSuccess(false);
      }, 5000);
    }
  }, [searchParams]);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!loading) {
      setAuthChecking(false);

      // If user is already authenticated
      if (user) {
        console.log('User already authenticated, checking profile status');

        // If profile isn't complete, redirect to profile setup
        if (profile && !profile.is_profile_completed) {
          console.log('Profile not complete, redirecting to profile setup');
          router.replace('/profile-setup');
          return;
        }

        // If profile is complete, redirect to the intended destination (or home)
        if (profile && profile.is_profile_completed) {
          console.log('Profile complete, redirecting to home');
          router.replace('/');
          return;
        }

        // If no profile yet, redirect to profile setup as a fallback
        router.replace('/profile-setup');
      }
    }
  }, [user, profile, loading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('Attempting to sign in with:', email);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
      }
      // Redirects are handled by the useEffect
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'An error occurred during sign in');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('Attempting to sign up with:', email);

    try {
      const { error } = await signUp(email, password);

      if (error) {
        setError(error.message);
      }
      // Redirects are handled by the useEffect
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(error.message || 'An error occurred during sign up');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    console.log('Attempting to sign in with Google');

    try {
      // Pass the redirectTo param to OAuth if needed
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(error.message || 'An error occurred during Google sign in');
    }
  };

  if (authChecking || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignIn ? 'Sign in to your account' : 'Create a new account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignIn ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsSignIn(!isSignIn)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {resetSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <Check className="h-4 w-4" />
              <AlertDescription>
                Your password has been successfully reset. You can now sign in
                with your new password.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full flex justify-center"
            >
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 24 24"
                width="24"
                height="24"
              >
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  ></path>
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  ></path>
                </g>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <form
              onSubmit={isSignIn ? handleSignIn : handleSignUp}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isSignIn ? 'current-password' : 'new-password'
                    }
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>

                {isSignIn && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Remember me
                      </label>
                    </div>

                    <div className="text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isSignIn ? (
                    'Sign in'
                  ) : (
                    'Sign up'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Wrapper page component with Suspense boundary
export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
