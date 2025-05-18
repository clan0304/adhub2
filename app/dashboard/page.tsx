// File: /app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get authenticated user - more secure than getSession
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // If user is not signed in, redirect to auth page
  if (!user || userError) {
    redirect('/auth');
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If profile doesn't exist or is not completed, redirect to profile setup
  if (profileError || !profile || !profile.is_profile_completed) {
    redirect('/profile-setup');
  }

  async function handleSignOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-indigo-600">
                  MyPlatform
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="ml-3 text-sm text-gray-700 hover:text-indigo-600"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to your dashboard,{' '}
                {profile.first_name || user.email?.split('@')[0] || 'User'}!
              </h2>
              <p className="mt-2 text-gray-600">
                You are logged in as {profile.user_type.replace('_', ' ')}.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Your profile has been successfully set up.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
