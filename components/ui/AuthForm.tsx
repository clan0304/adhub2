/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AuthForm() {
  // TEMPORARILY DISABLED - Email/Password states
  // const [isSignIn, setIsSignIn] = useState(true);
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const supabase = createClient();

  // Check for URL hash errors (from OAuth redirects)
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorMessage = hashParams.get('error_description');

    if (errorMessage) {
      setError(decodeURIComponent(errorMessage.replace(/\+/g, ' ')));

      // If the error is about database issues, show the manual setup notice
      if (errorMessage.includes('Database error')) {
        setShowManualSetup(true);
      }

      // Clear the hash without reloading the page
      window.history.replaceState(
        null,
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, []);

  /* TEMPORARILY DISABLED - Email/Password handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      }

      // Refresh the page to let middleware handle redirects
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  END TEMPORARILY DISABLED */

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Store site URL in a variable - make sure it matches Supabase settings
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/callback`;

      console.log('OAuth redirect URL:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('OAuth error:', error);
      setError(
        error.message || 'An unknown error occurred with Google sign in'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Welcome to AdHub
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in or create an account to get started
        </p>
        {/* TEMPORARILY DISABLED - Sign in/Sign up toggle
        <p className="mt-2 text-sm text-gray-600">
          {isSignIn ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setIsSignIn(!isSignIn)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignIn ? 'Sign up' : 'Sign in'}
          </button>
        </p>
        END TEMPORARILY DISABLED */}
      </div>

      {/* Display error messages prominently */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          <p className="font-semibold mb-1">Error:</p>
          <p>{error}</p>
          {error.includes('Database error') && (
            <p className="mt-2 text-sm text-gray-700">
              This could be a temporary issue. Please try again.
            </p>
          )}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-500" viewBox="0 0 24 24">
              <path
                d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.033s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.083z"
                fill="currentColor"
              />
            </svg>
          </span>
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin h-5 w-5 text-gray-500 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Signing in...
            </div>
          ) : (
            'Continue with Google'
          )}
        </button>

        {/* TEMPORARILY DISABLED - Email/Password form
        {!showManualSetup && (
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
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignIn ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && error.includes('Database error') && (
            <div className="mt-4 text-sm text-indigo-600">
              <p>
                Please try again or contact support if the issue persists.
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <span>{isSignIn ? 'Sign in' : 'Sign up'}</span>
              )}
            </button>
          </div>
        </form>
        END TEMPORARILY DISABLED */}

        {showManualSetup && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            <p className="font-semibold mb-1">Note:</p>
            <p>
              If you&apos;re experiencing issues with Google sign-in, please try
              again in a few moments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
