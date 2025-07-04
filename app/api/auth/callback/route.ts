// app/auth/callback/route.ts (Update your existing file)
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

    // Handle OAuth errors from Google/Supabase
    if (error) {
      console.error('OAuth callback error:', error, errorDescription);
      const errorMessage = errorDescription || error;
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(errorMessage)}`, request.url)
      );
    }

    // Handle missing authorization code
    if (!code) {
      console.error('Missing authorization code in callback');
      return NextResponse.redirect(
        new URL('/auth?error=missing_authorization_code', request.url)
      );
    }

    const supabase = await createClient();

    try {
      // Exchange the authorization code for a session
      console.log('Exchanging code for session...');
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          new URL(
            `/auth?error=${encodeURIComponent(exchangeError.message)}`,
            request.url
          )
        );
      }

      if (!data.user) {
        console.error('No user data received after code exchange');
        return NextResponse.redirect(
          new URL('/auth?error=authentication_failed', request.url)
        );
      }

      console.log('OAuth authentication successful for user:', data.user.id);

      // Check if a profile exists for this user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_profile_completed')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist or had an error fetching, create a new one
      if (profileError) {
        console.log(
          'Profile not found, creating new profile for user:',
          data.user.id
        );

        try {
          // Generate a username from the email
          const emailUsername = data.user.email?.split('@')[0] || 'user';
          const safeUsername = `${emailUsername
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')}_${Math.random()
            .toString(36)
            .substring(2, 8)}`;

          // Insert a basic profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: safeUsername,
              first_name: '',
              last_name: '',
              phone_number: '',
              city: '',
              country: '',
              is_profile_completed: false,
              user_type: 'content_creator',
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
        } catch (profileCreationError) {
          console.error('Exception creating profile:', profileCreationError);
        }

        // Redirect to profile setup for new users
        console.log('Redirecting to profile setup');
        return NextResponse.redirect(new URL('/profile-setup', request.url));
      }

      // If profile exists but is not completed, redirect to profile setup
      if (profile && !profile.is_profile_completed) {
        console.log('Profile incomplete, redirecting to profile setup');
        return NextResponse.redirect(new URL('/profile-setup', request.url));
      }

      // If profile exists and is completed, redirect to the intended destination
      if (profile && profile.is_profile_completed) {
        const finalRedirect =
          redirectTo !== '/' ? decodeURIComponent(redirectTo) : '/';
        console.log('Profile complete, redirecting to:', finalRedirect);
        return NextResponse.redirect(new URL(finalRedirect, request.url));
      }

      // Fallback: redirect to profile setup
      return NextResponse.redirect(new URL('/profile-setup', request.url));
    } catch (authError) {
      console.error('Authentication processing error:', authError);
      return NextResponse.redirect(
        new URL('/auth?error=authentication_processing_failed', request.url)
      );
    }
  } catch (error) {
    console.error('OAuth callback route error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=callback_route_error', request.url)
    );
  }
}
