// File: /middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, api routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // IMPORTANT: Auth route should bypass most checks to prevent infinite loops
  const isAuthRoute = pathname === '/auth';
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Other public routes that don't require redirects
  const isPublicRoute = pathname === '/' || pathname === '/auth/callback';

  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    // Redirect unauthenticated users to auth page
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If user is authenticated
  if (user) {
    try {
      // Try to get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_profile_completed')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist or is not completed, and not already on profile setup
      if (
        (profileError || !profile || !profile.is_profile_completed) &&
        pathname !== '/profile-setup'
      ) {
        return NextResponse.redirect(new URL('/profile-setup', request.url));
      }

      // If profile is completed and on profile setup, redirect to dashboard
      if (profile?.is_profile_completed && pathname === '/profile-setup') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // If we encounter an error, just continue without redirecting
    }
  }

  return NextResponse.next();
}
