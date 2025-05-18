// File: /app/profile-setup/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileSetup from './ProfileSetup';

export default async function ProfileSetupPage() {
  const supabase = await createClient();

  // Get authenticated user - more secure than getSession()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // If user is not signed in, redirect to auth page
  if (!user || userError) {
    redirect('/auth');
  }

  // Check if profile is already completed
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If there's an error fetching the profile or it doesn't exist, we need to create one
  if (profileError) {
    // Attempt to create a new profile entry
    try {
      // Create a username from the email
      const emailUsername = user.email?.split('@')[0] || 'user';
      const safeUsername = `${emailUsername
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')}_${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      // Insert a new profile
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        username: safeUsername,
        first_name: '',
        last_name: '',
        is_profile_completed: false,
        user_type: 'content_creator',
      });

      if (insertError) {
        console.error('Error creating profile:', insertError);
      }

      // Continue to profile setup with the new username
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
            <ProfileSetup userId={user.id} initialUsername={safeUsername} />
          </div>
        </div>
      );
    } catch (err) {
      console.error('Error in profile creation:', err);
    }
  }

  // If profile is already completed, redirect to dashboard
  if (profile?.is_profile_completed) {
    redirect('/dashboard');
  }

  // Get the initial username that was auto-generated during OAuth
  const initialUsername = profile?.username || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <ProfileSetup userId={user.id} initialUsername={initialUsername} />
      </div>
    </div>
  );
}
