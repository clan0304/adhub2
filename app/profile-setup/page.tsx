import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import ProfileSetup from './ProfileSetup';

export default async function ProfileSetupPage() {
  // ADD AWAIT HERE - auth() returns a Promise
  const { userId } = await auth();

  // If user is not signed in, redirect to auth page
  if (!userId) {
    redirect('/auth');
  }

  const supabase = await createClient();

  // Check if profile is already completed
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // If profile is completed, redirect to home
  if (profile?.is_profile_completed) {
    redirect('/');
  }

  // If profile doesn't exist, create a basic one (fallback)
  if (profileError && profileError.code === 'PGRST116') {
    // This shouldn't happen with webhooks, but just in case
    console.log('Profile not found, will be created by form submission');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <ProfileSetup
          userId={userId}
          initialUsername={profile?.username || ''}
        />
      </div>
    </div>
  );
}
