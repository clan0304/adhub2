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

  // Define route categories
  const isAuthRoute = pathname === '/auth';
  const isProfileSetupRoute = pathname === '/profile-setup';

  // Define which routes require authentication
  // NOTE: /creators is NOT included here - it's public
  const protectedRoutes = [
    '/profile',
    '/dashboard',
    '/findwork/create',
    '/messages',
    '/settings',
  ];

  // Define public routes that anyone can access
  const publicRoutes = [
    '/',
    '/creators',
    '/aboutus',
    '/findwork', // Make findwork public too if you want
  ];

  const requiresAuth = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  // Get authenticated state
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // CASE 1: User is not authenticated
  if (!user) {
    // If trying to access protected routes, redirect to auth
    if (requiresAuth) {
      return NextResponse.redirect(
        new URL(`/auth?redirectTo=${encodeURIComponent(pathname)}`, request.url)
      );
    }

    // If trying to access profile setup without being logged in, redirect to auth
    if (isProfileSetupRoute) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // For public routes, allow access
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // For all other routes, allow access (default to public)
    return NextResponse.next();
  }

  // CASE 2: User is authenticated
  if (user) {
    // Skip profile check for profile setup page to prevent redirect loops
    if (isProfileSetupRoute) {
      return NextResponse.next();
    }

    // If on auth page and already authenticated, redirect to profile check
    if (isAuthRoute) {
      // Check if profile is completed
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_profile_completed')
          .eq('id', user.id)
          .single();

        // If profile doesn't exist or is not completed, redirect to profile setup
        if (profileError || !profile || !profile.is_profile_completed) {
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }

        // If profile is completed, redirect home
        return NextResponse.redirect(new URL('/', request.url));
      } catch (error) {
        console.error('Error checking profile in middleware:', error);
        // If error, default to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // For protected routes, check if profile is completed
    if (requiresAuth) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_profile_completed')
          .eq('id', user.id)
          .single();

        // If profile doesn't exist or is not completed, redirect to profile setup
        if (profileError || !profile || !profile.is_profile_completed) {
          return NextResponse.redirect(new URL('/profile-setup', request.url));
        }
      } catch (error) {
        console.error('Error checking profile in middleware:', error);
      }
    }
  }

  // Default: allow access to the requested page
  return NextResponse.next();
}
