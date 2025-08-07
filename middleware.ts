// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/profile-setup(.*)',
  '/settings(.*)',
  '/travel(.*)',
  '/dashboard(.*)',
]);

// Define completely public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/creators(.*)',
  '/findwork(.*)',
  '/aboutus(.*)',
  '/auth(.*)',
  '/api/webhooks(.*)', // Important: Allow webhook routes
]);

export default clerkMiddleware(async (auth, req) => {
  console.log('🔍 Middleware processing:', req.nextUrl.pathname);

  // Always allow public routes
  if (isPublicRoute(req)) {
    console.log('✅ Public route, allowing access');
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (!userId) {
      console.log('❌ Protected route requires auth, redirecting to /auth');
      const authUrl = new URL('/auth', req.url);
      // Add the current path as a redirect parameter
      authUrl.searchParams.set('redirect_url', req.nextUrl.pathname);
      return NextResponse.redirect(authUrl);
    }

    console.log('✅ Authenticated user accessing protected route');
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
