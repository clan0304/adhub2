// app/api/auth/oauth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const provider = requestUrl.searchParams.get('provider');
    const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

    if (!provider || provider !== 'google') {
      return NextResponse.json(
        { error: 'Invalid or unsupported provider' },
        { status: 400 }
      );
    }

    // Create a custom OAuth URL that goes directly to your domain
    // This bypasses Supabase's OAuth entirely
    const googleClientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const googleOAuthParams = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: `${requestUrl.origin}/auth/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: encodeURIComponent(redirectTo),
    });

    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleOAuthParams.toString()}`;

    console.log(
      'Redirecting directly to Google OAuth (no Supabase URL exposed)'
    );

    return NextResponse.redirect(googleOAuthUrl);
  } catch (error) {
    console.error('OAuth proxy error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=oauth_proxy_error', request.url)
    );
  }
}
