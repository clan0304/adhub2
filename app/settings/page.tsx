/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { deleteProfile } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Trash2, AlertTriangle, Shield, Key, User } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) {
    // Redirect to login
    router.push('/auth');
    return null;
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      // Call the server action to delete the account
      await deleteProfile();

      // The server action should handle the redirect after successful deletion
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'An error occurred while deleting your account');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'An error occurred while signing out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and security
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5 text-indigo-600" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Update your profile information, photo, and visibility settings.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/profile">
                <Button variant="outline">Manage Profile</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-indigo-600" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Email Address
                </h3>
                <p className="mt-1">{user.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Password</h3>
                <p className="mt-1 text-sm text-gray-600">
                  You can change your password by signing out and using the
                  password reset feature on the login page.
                </p>
              </div>

              <div>
                <Button variant="outline" onClick={handleSignOut}>
                  <Key className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader className="border-b border-red-100">
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Actions that can&apos;t be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="border border-red-300 rounded-md p-4 bg-red-50">
                  <h4 className="text-sm font-medium text-red-800">
                    Are you sure you want to delete your account?
                  </h4>
                  <p className="mt-1 text-sm text-red-700 mb-4">
                    All of your data will be permanently removed. This action
                    cannot be undone.
                  </p>
                  <div className="flex space-x-4">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
