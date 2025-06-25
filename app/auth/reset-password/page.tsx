/* eslint-disable @typescript-eslint/no-explicit-any */
// app/auth/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Key,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasResetToken, setHasResetToken] = useState<boolean | null>(null); // null = checking, true/false = determined
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // First, ensure we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if the URL contains the reset token (only after client-side hydration)
  useEffect(() => {
    if (!isClient) return;

    const checkResetToken = async () => {
      try {
        // First, check URL parameters for reset token
        const fragment = window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);

        // Log what we're receiving for debugging
        console.log('URL fragment:', fragment);
        console.log('Search params:', window.location.search);
        console.log('Full URL:', window.location.href);

        // Check for reset token in query parameters (most common for email links)
        const tokenFromQuery = searchParams.get('token');
        const typeFromQuery = searchParams.get('type');

        // Check for tokens in URL fragment (alternative format)
        const hasTokenInFragment =
          fragment.includes('access_token=') ||
          fragment.includes('token=') ||
          fragment.includes('type=recovery');

        // Check if this is a password reset request
        const isPasswordReset =
          (tokenFromQuery && typeFromQuery === 'recovery') ||
          hasTokenInFragment ||
          fragment.includes('type=recovery');

        if (isPasswordReset || tokenFromQuery) {
          console.log('Password reset token found');

          // If we have URL fragments, we need to exchange them for a session
          if (
            fragment.includes('access_token=') ||
            fragment.includes('refresh_token=')
          ) {
            console.log('Processing URL fragments for session');
            // Let Supabase handle the URL fragments automatically
            const { data, error } = await supabase.auth.getSession();
            if (error) {
              console.error('Error getting session from fragments:', error);
              setHasResetToken(false);
              return;
            }
            console.log('Session from fragments:', data.session);
          }

          setHasResetToken(true);
        } else {
          console.log('No reset token found');
          setHasResetToken(false);
        }
      } catch (error) {
        console.error('Error checking reset token:', error);
        setHasResetToken(false);
      }
    };

    checkResetToken();
  }, [isClient, supabase]);

  const validatePassword = (password: string): boolean => {
    // Password should be at least 8 characters
    if (password.length < 8) {
      setError('Password should be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    if (!validatePassword(password)) {
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(
        err.message ||
          'An error occurred updating your password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking for reset token
  if (!isClient || hasResetToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
            <p className="text-center mt-4 text-gray-600">
              Checking reset link...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invalid link message if no reset token
  if (hasResetToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please request a new password reset link from the forgot password
              page.
            </p>
          </CardContent>
          <CardFooter>
            <div className="w-full">
              <Link href="/auth/forgot-password">
                <Button className="w-full">Request New Reset Link</Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show the reset password form if we have a valid token
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Please enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Password Updated
              </h3>
              <p className="text-gray-600 mb-4">
                Your password has been successfully updated. You&apos;ll be
                redirected to the login page shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters long.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            <Link
              href="/auth"
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
