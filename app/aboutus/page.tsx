'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Store,
  MapPin,
  Users2,
  ShoppingBag,
  Smartphone,
  Check,
} from 'lucide-react';

export default function AboutUs() {
  const { user } = useAuth();

  return (
    <main className="bg-white" id="main-content">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-heading"
        className="relative isolate overflow-hidden bg-gradient-to-b from-teal-50/20"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-3xl">
            <h1
              id="hero-heading"
              className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
            >
              Connecting Creators and Businesses
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-700">
              AdHub bridges the gap between content creators and local
              businesses, fostering authentic, in-person collaborations that
              drive real engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section
        aria-labelledby="mission-heading"
        className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8"
      >
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <h2
              id="mission-heading"
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Our Mission
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-700">
              We&apos;re building a community where local businesses can thrive
              through authentic promotion, and where content creators can find
              meaningful collaborations that resonate with their audience.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-700">
              By focusing on in-person interactions, we create genuine
              connections that go beyond digital-only relationships, leading to
              more authentic content and stronger business results.
            </p>
          </div>
          <div className="mt-12 lg:mt-0">
            <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/public/assets/aboutphoto.png"
                alt="Team members collaborating on content creation"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        aria-labelledby="how-it-works-heading"
        className="bg-gray-50 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how-it-works-heading"
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              How AdHub Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-700">
              A platform built for authentic, in-person collaborations
            </p>
          </div>
          <div className="mt-16 sm:mt-20">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-3">
              {/* For Content Creators */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="mb-6 rounded-full bg-teal-600 p-3 w-12 h-12 flex items-center justify-center">
                  <Smartphone
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  For Content Creators
                </h3>
                <ul className="space-y-3 text-gray-700">
                  {[
                    'Create a profile showcasing your content style and reach',
                    'Connect with other creators for collaborative projects',
                    'Find businesses looking for authentic promotion',
                    'Create in-person content that resonates with your audience',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check
                        className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* For Business Owners */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="mb-6 rounded-full bg-teal-600 p-3 w-12 h-12 flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  For Business Owners
                </h3>
                <ul className="space-y-3 text-gray-700">
                  {[
                    'Create a business profile highlighting your brand and values',
                    'Find ideal content creators who match your brand identity',
                    'Post collaboration opportunities and projects',
                    'Gain authentic promotion through in-store content creation',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check
                        className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* In-Person Focus */}
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 transition-all hover:shadow-md">
                <div className="mb-6 rounded-full bg-teal-600 p-3 w-12 h-12 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold mb-3">In-Person Focus</h3>
                <ul className="space-y-3 text-gray-700">
                  {[
                    'Create authentic content by visiting physical locations',
                    'Build real relationships beyond digital interactions',
                    'Showcase the real experience of visiting local businesses',
                    'Drive foot traffic and in-person engagement',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <Check
                        className="h-5 w-5 text-teal-600 mr-2 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        aria-labelledby="why-choose-heading"
        className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8"
      >
        <div className="text-center mb-16">
          <h2
            id="why-choose-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Why Choose AdHub
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-700 max-w-3xl mx-auto">
            We&apos;re more than just a platform – we&apos;re building a
            community focused on authentic connections
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="text-center group">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-teal-600 transition-transform group-hover:scale-110">
              <Users className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-lg font-semibold leading-7 tracking-tight text-gray-900">
              Community Focused
            </h3>
            <p className="mt-2 text-base leading-7 text-gray-700">
              We foster a supportive community where creators and businesses can
              grow and collaborate together.
            </p>
          </div>

          <div className="text-center group">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-teal-600 transition-transform group-hover:scale-110">
              <ShoppingBag className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-lg font-semibold leading-7 tracking-tight text-gray-900">
              Local Commerce Support
            </h3>
            <p className="mt-2 text-base leading-7 text-gray-700">
              We&apos;re passionate about helping local businesses thrive
              through authentic content-driven promotion.
            </p>
          </div>

          <div className="text-center group">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-teal-600 transition-transform group-hover:scale-110">
              <Users2 className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-lg font-semibold leading-7 tracking-tight text-gray-900">
              Authentic Content
            </h3>
            <p className="mt-2 text-base leading-7 text-gray-700">
              We prioritize genuine experiences over polished perfection,
              creating content that truly resonates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section aria-labelledby="cta-heading" className="bg-teal-700">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:flex lg:items-center">
          <div className="lg:w-0 lg:flex-1">
            <h2
              id="cta-heading"
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Ready to get started?
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-teal-100">
              Join our community of creators and business owners making real
              connections and creating authentic content.
            </p>
          </div>
          {!user && (
            <div className="mt-10 lg:mt-0 lg:ml-8 lg:flex-shrink-0">
              <Link
                href="/auth"
                className="inline-flex rounded-md bg-white px-6 py-3 text-base font-semibold text-teal-700 shadow-sm hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                aria-label="Sign up for AdHub"
              >
                Sign up today
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
