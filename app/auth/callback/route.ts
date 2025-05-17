// File: /app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);

      // Get user after authentication - more secure than getSession
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (user && !userError) {
        // Check if a profile exists for this user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_profile_completed')
          .eq('id', user.id)
          .single();

        // If profile query had an error (likely no profile found)
        if (profileError) {
          // Create a new profile for this user
          try {
            // Generate a username from the email
            const emailUsername = user.email?.split('@')[0] || 'user';
            const safeUsername = `${emailUsername
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, '_')}_${Math.random()
              .toString(36)
              .substring(2, 8)}`;

            // Insert a basic profile
            await supabase.from('profiles').insert({
              id: user.id,
              username: safeUsername,
              first_name: '',
              last_name: '',
              is_profile_completed: false,
              user_type: 'content_creator',
            });

            // Redirect to profile setup
            return NextResponse.redirect(
              new URL('/profile-setup', request.url)
            );
          } catch (err) {
            console.error('Error creating profile in callback:', err);
          }
        }

        // If profile exists but is not completed
        if (profile && !profile.is_profile_completed) {
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }

        // If profile exists and is completed
        if (profile && profile.is_profile_completed) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }

    // Fallback redirect to profile setup
    return NextResponse.redirect(new URL('/profile-setup', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    // Redirect to auth page with error
    return NextResponse.redirect(
      new URL(
        `/auth?error=${encodeURIComponent('Authentication error occurred')}`,
        request.url
      )
    );
  }
}
