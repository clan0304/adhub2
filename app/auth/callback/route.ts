// File: /app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

    if (code) {
      const supabase = await createClient();
      await supabase.auth.exchangeCodeForSession(code);

      // Get user after authentication
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

        // If profile doesn't exist or had an error fetching, redirect to profile setup
        if (profileError) {
          // Try to create a basic profile
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
              phone_number: '',
              city: '',
              country: '',
              is_profile_completed: false,
              user_type: 'content_creator',
            });
          } catch (err) {
            console.error('Error creating profile in callback:', err);
          }

          // Redirect to profile setup
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }

        // If profile exists but is not completed, redirect to profile setup
        if (profile && !profile.is_profile_completed) {
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }

        // If profile exists and is completed, redirect to the requested page or home
        if (profile && profile.is_profile_completed) {
          const redirectURL =
            redirectTo !== '/' ? decodeURIComponent(redirectTo) : '/';
          return NextResponse.redirect(new URL(redirectURL, request.url));
        }
      }
    }

    // Default: redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
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
