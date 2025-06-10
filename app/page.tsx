// app/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const fullText = 'Creators and Business Grow Together';

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLetters((prev) => {
        if (prev < fullText.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 20); // Adjust speed here (80ms = 0.08 second per letter)

    return () => clearInterval(timer);
  }, []);

  const renderAnimatedText = () => {
    return fullText.split('').map((char, index) => (
      <span
        key={index}
        className={`inline-block transition-all duration-300 ${
          index < visibleLetters
            ? 'opacity-100 transform translate-y-0'
            : 'opacity-0 transform translate-y-4'
        }`}
        style={{
          transitionDelay: `${index * 50}ms`, // Stagger the fade-in effect
        }}
      >
        {char === ' ' ? '\u00A0' : char} {/* Non-breaking space for spaces */}
      </span>
    ));
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl tracking-normal min-h-[4rem] sm:min-h-[6rem] flex flex-wrap justify-center">
            {renderAnimatedText()}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 opacity-0 animate-fade-in-delayed">
            Find talented content creators, promote your brand with their work,
            and grow together.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-12 opacity-0 animate-fade-in-more-delayed">
            <Link
              href="/creators"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 hover:scale-110 transition-transform duration-200"
            >
              Discover Creators
            </Link>
            <Link
              href="/findwork"
              className="text-sm font-semibold leading-6 text-gray-900 hover:opacity-70 hover:scale-110 transition-all duration-200"
            >
              Find Work <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-delayed {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-delayed {
          animation: fade-in-delayed 0.8s ease-out 2.5s forwards;
        }

        .animate-fade-in-more-delayed {
          animation: fade-in-delayed 0.8s ease-out 3s forwards;
        }
      `}</style>
    </div>
  );
}
