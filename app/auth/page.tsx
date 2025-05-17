// File: /app/auth/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AuthForm from '@/components/ui/AuthForm';

export default async function AuthPage() {
  const supabase = await createClient();

  try {
    // Check if user is already authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is already signed in, check profile completion
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_profile_completed')
          .eq('id', user.id)
          .single();

        // If profile exists and is completed, redirect to dashboard
        if (profile?.is_profile_completed) {
          redirect('/dashboard');
        }

        // If profile exists but is not completed, redirect to profile setup
        if (profile && !profile.is_profile_completed) {
          redirect('/profile-setup');
        }

        // If we can't determine profile status, default to profile setup
        redirect('/profile-setup');
      } catch (error) {
        // If error occurs while checking profile, still redirect to profile setup
        console.error('Error checking profile in auth page:', error);
        redirect('/profile-setup');
      }
    }

    // If user is not authenticated, show the auth form
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <AuthForm />
      </div>
    );
  } catch (error) {
    console.error('Auth page error:', error);

    // If error occurs, show auth form anyway
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <AuthForm />
      </div>
    );
  }
}
