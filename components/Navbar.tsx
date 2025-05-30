'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/public/assets/adhub.png';

const Navbar = () => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const { user, profile, loading, signOut } = useAuth();

  // Check if a link is active
  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Get link classes based on active state
  const getLinkClasses = (href: string, isMobile = false) => {
    const isActive = isActiveLink(href);
    const baseClasses = isMobile
      ? 'block px-3 py-2 rounded-md text-base font-medium font-roboto_slab transition-colors'
      : 'font-semibold transition-colors font-roboto_slab';

    if (isActive) {
      return `${baseClasses} text-indigo-600 ${isMobile ? 'bg-indigo-50' : ''}`;
    } else {
      return `${baseClasses} text-gray-700 hover:text-indigo-600 ${
        isMobile ? 'hover:bg-gray-50' : ''
      }`;
    }
  };

  // Use separate handlers for click events
  const handleProfileClick = () => {
    setProfileMenuOpen(!profileMenuOpen);
    // Close mobile menu if open
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // Handle navigation to profile page
  const handleProfileNav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Close the profile menu immediately
    setProfileMenuOpen(false);

    // Navigate to profile page
    router.push('/profile');
  };

  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Close the menu immediately
    setProfileMenuOpen(false);

    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '';

    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }

    // Try to get name from user_metadata
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    }

    // Fallback to email
    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return '';
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // Check if the click is on the profile button
      const isClickOnProfileButton = profileButtonRef.current?.contains(target);

      // Check if the click is inside the profile menu
      const isClickInsideProfileMenu = profileMenuRef.current?.contains(target);

      // Only close the profile menu if clicking outside both the button and the menu
      if (
        profileMenuOpen &&
        !isClickOnProfileButton &&
        !isClickInsideProfileMenu
      ) {
        setProfileMenuOpen(false);
      }

      // For mobile menu
      const isClickInsideMobileMenu = mobileMenuRef.current?.contains(target);
      const isClickOnMobileButton = (event.target as Element).closest(
        '.mobile-menu-button'
      );

      if (
        mobileMenuOpen &&
        !isClickInsideMobileMenu &&
        !isClickOnMobileButton
      ) {
        setMobileMenuOpen(false);
      }
    }

    // Use 'click' instead of 'mousedown' to allow button handlers to execute first
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileMenuOpen, mobileMenuOpen]);

  // Get username for display
  const getUsername = () => {
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`;
    }

    if (!user) return '';

    return (
      user.user_metadata?.username ||
      user.user_metadata?.first_name ||
      user.email?.split('@')[0] ||
      'User'
    );
  };

  // Get profile photo URL
  const getProfilePhotoUrl = () => {
    if (profile?.profile_photo) {
      return profile.profile_photo;
    }

    if (!user) return null;

    return (
      user.user_metadata?.profile_photo_url ||
      user.user_metadata?.avatar_url ||
      null
    );
  };

  // Handle sign in button click
  const handleSignIn = () => {
    router.push('/auth');
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-5">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <Image
                src={Logo}
                alt="logo image"
                width={150}
                height={50}
                className="hover:scale-110"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/creators">
              <div className={getLinkClasses('/creators')}>Creators</div>
            </Link>
            <Link href="/findwork">
              <div className={getLinkClasses('/findwork')}>Find Work</div>
            </Link>
            <Link href="/aboutus">
              <div className={getLinkClasses('/aboutus')}>About Us</div>
            </Link>

            {!loading ? (
              user ? (
                // User is logged in, show profile avatar
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={handleProfileClick}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 focus:outline-none hover:bg-indigo-200 transition-colors"
                    aria-expanded={profileMenuOpen}
                    aria-haspopup="true"
                  >
                    {getProfilePhotoUrl() ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={getProfilePhotoUrl() as string}
                          alt="Profile"
                          className="rounded-full object-cover"
                          fill
                        />
                      </div>
                    ) : (
                      <span className="font-medium">{getInitials()}</span>
                    )}
                  </button>

                  {/* Desktop Profile Dropdown */}
                  {profileMenuOpen && (
                    <div
                      ref={profileMenuRef}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                    >
                      <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                        <p className="font-medium">{getUsername()}</p>
                        <p className="text-gray-500 text-xs truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={handleProfileNav}
                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer"
                      >
                        Your Profile
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-white font-semibold bg-red-600 rounded-b-md hover:opacity-70 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // User is not logged in, show sign in button
                <button
                  onClick={handleSignIn}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-roboto_slab"
                >
                  Sign In
                </button>
              )
            ) : (
              // Loading state
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {!loading && user && (
              <div className="relative mr-4">
                <button
                  onClick={() => {
                    setProfileMenuOpen(!profileMenuOpen);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 focus:outline-none hover:bg-indigo-200 transition-colors"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                >
                  {getProfilePhotoUrl() ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={getProfilePhotoUrl() as string}
                        alt="Profile"
                        className="rounded-full object-cover"
                        fill
                      />
                    </div>
                  ) : (
                    <span className="font-medium text-sm">{getInitials()}</span>
                  )}
                </button>

                {/* Mobile Profile Dropdown */}
                {profileMenuOpen && (
                  <div
                    ref={profileMenuRef}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  >
                    <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                      <p className="font-medium">{getUsername()}</p>
                      <p className="text-gray-500 text-xs truncate">
                        {user.email}
                      </p>
                    </div>

                    <button
                      onClick={handleProfileNav}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer"
                    >
                      Your Profile
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-white font-semibold bg-red-600 rounded-b-md hover:opacity-70 cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setProfileMenuOpen(false);
              }}
              className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger menu icon */}
              <svg
                className={`h-6 w-6 ${mobileMenuOpen ? 'hidden' : 'block'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`h-6 w-6 ${mobileMenuOpen ? 'block' : 'hidden'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        id="mobile-menu"
        ref={mobileMenuRef}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-lg border-t border-gray-100">
          <Link href="/creators">
            <div
              className={getLinkClasses('/creators', true)}
              onClick={() => setMobileMenuOpen(false)}
            >
              Creators
            </div>
          </Link>
          <Link href="/findwork">
            <div
              className={getLinkClasses('/findwork', true)}
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Work
            </div>
          </Link>
          <Link href="/aboutus">
            <div
              className={getLinkClasses('/aboutus', true)}
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </div>
          </Link>

          {!loading && !user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push('/auth');
              }}
              className="block w-full text-center mt-4 px-4 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 font-roboto_slab"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
