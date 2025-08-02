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

    // Get Google OAuth credentials
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Create Google OAuth URL - this will show YOUR domain, not Supabase
    const googleOAuthParams = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: `${requestUrl.origin}/api/auth/callback`, // YOUR domain callback
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: encodeURIComponent(redirectTo), // Store redirect destination
    });

    const googleOAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleOAuthParams.toString()}`;

    console.log('Redirecting to Google OAuth with YOUR domain callback');
    return NextResponse.redirect(googleOAuthUrl);
  } catch (error) {
    console.error('OAuth proxy error:', error);
    return NextResponse.redirect(
      new URL('/auth?error=oauth_proxy_error', request.url)
    );
  }
}
