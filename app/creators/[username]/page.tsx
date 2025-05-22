/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Youtube from '@/public/assets/youtube.png';
import Instagram from '@/public/assets/instagram.png';
import Tiktok from '@/public/assets/tiktok.png';

interface Creator {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  city: string | null;
  country: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  bio: string | null; // Added bio field
  is_collaborated: boolean;
  is_public: boolean;
  user_type: string;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        // Fetch the creator by username
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .eq('user_type', 'content_creator')
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // PGRST116 means no rows returned
            throw new Error('Creator not found');
          }
          throw error;
        }

        // Check if the profile is public
        if (!data.is_public) {
          throw new Error('This creator profile is private');
        }

        setCreator(data);
      } catch (err: any) {
        console.error('Error fetching creator:', err);
        setError(err.message || 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchCreator();
    }
  }, [username, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
            <p>
              {error ||
                'This creator does not exist or their profile is private.'}
            </p>
            <Link
              href="/creators"
              className="mt-4 inline-block text-indigo-600 underline"
            >
              Back to creators
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with back button */}
          <div className="p-4 bg-gray-50 border-b">
            <Link href="/creators">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  ></path>
                </svg>
                Back to Creators
              </button>
            </Link>
          </div>

          {/* Creator header */}
          <div className="p-8 border-b">
            <div className="flex flex-col sm:flex-row items-center sm:items-start">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 mb-4 sm:mb-0 sm:mr-6 flex-shrink-0">
                {creator.profile_photo_url ? (
                  <Image
                    src={creator.profile_photo_url}
                    alt={creator.username}
                    className="h-full w-full object-cover"
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                    <span className="text-3xl font-bold">
                      {creator.first_name?.charAt(0) || ''}
                      {creator.last_name?.charAt(0) || ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {creator.username}
                </h1>
                <h2 className="text-xl text-gray-700 mb-2">
                  {creator.first_name} {creator.last_name}
                </h2>

                {creator.city || creator.country ? (
                  <p className="text-gray-600 mb-4">
                    {creator.city && creator.country
                      ? `${creator.city}, ${creator.country}`
                      : creator.city || creator.country}
                  </p>
                ) : null}

                {creator.is_collaborated && (
                  <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
                    Open to collaborate
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Creator Bio */}
          {creator.bio && (
            <div className="p-8 border-b">
              <h2 className="text-xl font-semibold mb-4">About Me</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {creator.bio}
                </p>
              </div>
            </div>
          )}

          {/* Social links */}
          <div className="p-8 border-b">
            <h2 className="text-lg font-medium mb-4">
              Connect With <span className="font-bold">{creator.username}</span>
            </h2>
            <div className="flex flex-wrap gap-4">
              {creator.instagram_url && (
                <a
                  href={creator.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={Instagram}
                    alt="Instagram"
                    width={50}
                    height={50}
                    className="hover:scale-110"
                  />
                </a>
              )}

              {creator.youtube_url && (
                <a
                  href={creator.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={Youtube}
                    alt="Youtube"
                    width={50}
                    height={50}
                    className="hover:scale-110"
                  />
                </a>
              )}

              {creator.tiktok_url && (
                <a
                  href={creator.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={Tiktok}
                    alt="Tiktok"
                    width={50}
                    height={50}
                    className="hover:scale-110"
                  />
                </a>
              )}

              {!creator.instagram_url &&
                !creator.youtube_url &&
                !creator.tiktok_url && (
                  <p className="text-gray-500">
                    No social media profiles available.
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
