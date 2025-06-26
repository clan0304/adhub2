// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const state = requestUrl.searchParams.get('state');
    const error = requestUrl.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth?error=missing_code', request.url)
      );
    }

    // Exchange Google code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${requestUrl.origin}/auth/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token from Google');
    }

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      throw new Error('Failed to get user email from Google');
    }

    // Now use Supabase to create/sign in the user
    const supabase = await createClient();

    // Try to sign in with email (this will work if user exists)
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: googleUser.email,
        password: `google_oauth_${googleUser.id}`, // Use a consistent password for Google users
      });

    let user = signInData?.user;

    // If sign in failed, create the user
    if (signInError || !user) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: googleUser.email,
          password: `google_oauth_${googleUser.id}`,
          options: {
            data: {
              name: googleUser.name,
              picture: googleUser.picture,
              provider: 'google',
              google_id: googleUser.id,
            },
          },
        });

      if (signUpError) {
        console.error('Error creating user:', signUpError);
        return NextResponse.redirect(
          new URL(
            `/auth?error=${encodeURIComponent(signUpError.message)}`,
            request.url
          )
        );
      }

      user = signUpData.user;
    }

    if (!user) {
      throw new Error('Failed to create or authenticate user');
    }

    // Check/create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_profile_completed')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // Create profile with minimal data - user will complete it in profile setup
      try {
        const emailUsername = user.email?.split('@')[0] || 'user';
        const safeUsername = `${emailUsername
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')}_${Math.random()
          .toString(36)
          .substring(2, 8)}`;

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

      // Always redirect to profile setup for new users
      return NextResponse.redirect(new URL('/profile-setup', request.url));
    }

    // For existing users, redirect based on profile completion and state
    const redirectTo = state ? decodeURIComponent(state) : '/';
    const finalRedirect = profile?.is_profile_completed
      ? redirectTo
      : '/profile-setup';

    return NextResponse.redirect(new URL(finalRedirect, request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=oauth_callback_failed', request.url)
    );
  }
}
