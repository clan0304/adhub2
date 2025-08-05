import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/profile-setup(.*)',
  '/settings(.*)',
  '/travel(.*)',
  '/dashboard(.*)',
]);

// Explicitly exclude auth routes from protection
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth(.*)', // This excludes all auth routes from protection
  '/creators(.*)',
  '/findwork(.*)',
  '/aboutus(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Don't protect public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Redirect to auth page if not authenticated
      const authUrl = new URL('/auth', req.url);
      return NextResponse.redirect(authUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
