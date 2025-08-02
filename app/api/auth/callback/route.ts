// app/api/auth/callback/route.ts - FIXED for existing users
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const state = requestUrl.searchParams.get('state');
    const redirectTo = state ? decodeURIComponent(state) : '/';

    // Handle OAuth errors from Google
    if (error) {
      console.error('OAuth error from Google:', error);
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      console.error('Missing authorization code from Google');
      return NextResponse.redirect(
        new URL('/auth?error=missing_authorization_code', request.url)
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
        redirect_uri: `${requestUrl.origin}/api/auth/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error('Failed to get access token from Google');
      return NextResponse.redirect(
        new URL('/auth?error=token_exchange_failed', request.url)
      );
    }

    // Get user info from Google
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      console.error('Failed to get user email from Google');
      return NextResponse.redirect(
        new URL('/auth?error=missing_user_email', request.url)
      );
    }

    console.log('Google user data received:', {
      email: googleUser.email,
      name: googleUser.name,
    });

    // Create Supabase client
    const supabase = await createClient();

    // Try to sign in first (if user exists)
    console.log('Attempting to sign in existing user...');
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: googleUser.email,
        password: `google_oauth_${googleUser.id}`, // Consistent password for Google users
      });

    let user = signInData?.user;

    // If sign in failed, create the user
    if (signInError || !signInData?.user) {
      console.log('User not found, creating new user...');

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: googleUser.email,
          password: `google_oauth_${googleUser.id}`, // Consistent password for Google users
          options: {
            data: {
              name: googleUser.name,
              picture: googleUser.picture,
              provider: 'google',
              google_id: googleUser.id,
              first_name: googleUser.given_name || '',
              last_name: googleUser.family_name || '',
            },
          },
        });

      if (signUpError) {
        console.error('Error creating user in Supabase:', signUpError);
        return NextResponse.redirect(
          new URL(
            `/auth?error=${encodeURIComponent(signUpError.message)}`,
            request.url
          )
        );
      }

      user = signUpData?.user;
    }

    if (!user) {
      console.error('Failed to create or authenticate user');
      return NextResponse.redirect(
        new URL('/auth?error=user_authentication_failed', request.url)
      );
    }

    console.log('User authenticated successfully:', user.id);

    // Check if profile exists (don't try to create if it exists)
    const { data: existingProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('is_profile_completed')
      .eq('id', user.id)
      .single();

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error - that's expected for new users
      console.error('Error checking existing profile:', profileFetchError);
    }

    const profile = existingProfile;

    // Only create profile if it doesn't exist
    if (!existingProfile) {
      console.log('No existing profile found, will let client create it');
      // Don't create profile here - let the profile setup page handle it
      // This avoids RLS issues entirely
    }

    // Determine final redirect destination
    const finalRedirect = profile?.is_profile_completed
      ? redirectTo
      : '/profile-setup';

    console.log('Authentication successful, redirecting to:', finalRedirect);

    // Create response with redirect
    return NextResponse.redirect(new URL(finalRedirect, request.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=callback_processing_failed', request.url)
    );
  }
}
