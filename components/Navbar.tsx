'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { UserButton, useUser } from '@clerk/nextjs';

import Logo from '@/public/assets/adhub.png';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser(); // Clerk user

  // Your existing isActiveLink and getLinkClasses functions...
  const isActiveLink = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

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

            {user ? (
              // User is logged in, show Clerk's UserButton
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-10 w-10',
                    userButtonPopoverCard: 'shadow-lg',
                    userButtonPopoverActionButton:
                      'text-gray-700 hover:text-indigo-600',
                  },
                }}
                userProfileProps={{
                  appearance: {
                    elements: {
                      card: 'shadow-xl',
                    },
                  },
                }}
              />
            ) : (
              // User is not logged in, show sign in button
              <Link href="/auth">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-roboto_slab">
                  Sign In
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <div className="mr-4">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-8 w-8',
                    },
                  }}
                />
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
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

      {/* Mobile menu */}
      <div
        className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}
        id="mobile-menu"
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

          {!user && (
            <Link href="/auth">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center mt-4 px-4 py-2 rounded-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 font-roboto_slab"
              >
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
