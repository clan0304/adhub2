/* eslint-disable @typescript-eslint/no-explicit-any */
// app/creators/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { getData } from 'country-list';
import { Search, X, Plane, MapPin, Settings } from 'lucide-react';
import { CreatorWithTravel, CountryOption } from '@/types/travel';
import Youtube from '@/public/assets/youtube.png';
import Instagram from '@/public/assets/instagram.png';
import Tiktok from '@/public/assets/tiktok.png';

export default function CreatorsPage() {
  const { user, profile } = useAuth(); // Added profile to check user type
  const [allCreators, setAllCreators] = useState<CreatorWithTravel[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorWithTravel[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const supabase = createClient();

  // Check if current user is a content creator
  const isContentCreator = profile?.user_type === 'content_creator';

  // Load country list
  useEffect(() => {
    try {
      const countryData = getData();
      const modifiedCountries = countryData.map((country) => {
        if (country.code === 'TW') {
          return { ...country, name: 'Taiwan' };
        }
        return country;
      });
      modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(modifiedCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    }
  }, []);

  // Fetch creators with travel data
  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);

        // Get all public content creators
        const { data: creatorsData, error: creatorsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_public', true)
          .eq('user_type', 'content_creator')
          .order('username');

        if (creatorsError) throw creatorsError;

        if (!creatorsData || creatorsData.length === 0) {
          setAllCreators([]);
          setFilteredCreators([]);
          setLoading(false);
          return;
        }

        // Get active travel schedules
        const { data: travelData, error: travelError } = await supabase
          .from('travel_schedules')
          .select('*')
          .gte('end_date', new Date().toISOString().split('T')[0])
          .lte(
            'start_date',
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          );

        if (travelError) {
          console.error('Error fetching travel data:', travelError);
        }

        // Merge creator data with travel data
        const creatorsWithTravel = creatorsData.map((creator) => {
          const activeTravel = travelData?.find(
            (travel) =>
              travel.profile_id === creator.id &&
              new Date() >=
                new Date(
                  new Date(travel.start_date).getTime() -
                    30 * 24 * 60 * 60 * 1000
                ) &&
              new Date() <= new Date(travel.end_date)
          );

          return {
            ...creator,
            is_traveling: !!activeTravel,
            travel_city: activeTravel?.city || null,
            travel_country: activeTravel?.country || null,
            travel_start_date: activeTravel?.start_date || null,
            travel_end_date: activeTravel?.end_date || null,
          };
        });

        setAllCreators(creatorsWithTravel);
        setFilteredCreators(creatorsWithTravel);
      } catch (err: any) {
        console.error('Error fetching creators:', err);
        setError(err.message || 'Failed to load creators');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [supabase]);

  // Apply filters when search or country changes
  useEffect(() => {
    if (!allCreators.length) return;

    let filtered = [...allCreators];

    // Apply country filter
    if (selectedCountry) {
      filtered = filtered.filter(
        (creator) =>
          creator.country === selectedCountry ||
          creator.travel_country === selectedCountry
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (creator) =>
          creator.username?.toLowerCase().includes(query) ||
          creator.first_name?.toLowerCase().includes(query) ||
          creator.last_name?.toLowerCase().includes(query) ||
          `${creator.first_name || ''} ${creator.last_name || ''}`
            .toLowerCase()
            .includes(query) ||
          (creator.city?.toLowerCase() || '').includes(query) ||
          (creator.travel_city?.toLowerCase() || '').includes(query)
      );
    }

    // Sort creators - prioritize those who are traveling to the selected country
    if (selectedCountry) {
      filtered.sort((a, b) => {
        const aTraveling = a.travel_country === selectedCountry;
        const bTraveling = b.travel_country === selectedCountry;

        if (aTraveling && !bTraveling) return -1;
        if (!aTraveling && bTraveling) return 1;
        return a.username.localeCompare(b.username);
      });
    }

    setFilteredCreators(filtered);
  }, [selectedCountry, searchQuery, allCreators]);

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setFilteredCreators(allCreators);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Content Creators
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Discover amazing content creators ready to collaborate
          </p>

          {/* Action buttons section */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Join as Creator button - only show for non-signed-in users */}
            {!user && (
              <Link
                href="/auth"
                className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
              >
                Join as a Creator
              </Link>
            )}

            {/* Manage Travel button - only show for signed-in content creators */}
            {user && isContentCreator && (
              <Link
                href="/travel"
                className="inline-flex items-center px-6 py-2 border border-indigo-600 text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
              >
                <Plane className="h-5 w-5 mr-2" />
                Manage Travel
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, username, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
                />
              </div>
            </div>

            {/* Country filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button - only show if filters are active */}
            {(selectedCountry || searchQuery) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Filter stats */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredCreators.length} of {allCreators.length} creators
            {selectedCountry && ` in ${selectedCountry}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>

        {/* Content Creator Travel Management Notice */}
        {user && isContentCreator && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Plane className="h-5 w-5 text-blue-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  <strong>Planning to travel?</strong> Add your travel schedule
                  to appear in location-based searches and connect with
                  businesses in your destination.
                </p>
              </div>
              <Link
                href="/travel"
                className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                Manage
              </Link>
            </div>
          </div>
        )}

        {filteredCreators.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            {allCreators.length === 0 ? (
              <p className="text-gray-500">No content creators found.</p>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No matching creators
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search filters to see more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreatorCard({ creator }: { creator: CreatorWithTravel }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTravelStatus = () => {
    if (
      !creator.is_traveling ||
      !creator.travel_start_date ||
      !creator.travel_end_date
    ) {
      return null;
    }

    const today = new Date();
    const startDate = new Date(creator.travel_start_date);
    const endDate = new Date(creator.travel_end_date);

    if (today < startDate) {
      return {
        label: `Traveling soon to ${creator.travel_city}`,
        color: 'bg-blue-100 text-blue-800',
        icon: <Plane className="h-3 w-3" />,
      };
    } else if (today >= startDate && today <= endDate) {
      return {
        label: `Currently in ${creator.travel_city}`,
        color: 'bg-green-100 text-green-800',
        icon: <MapPin className="h-3 w-3" />,
      };
    }

    return null;
  };

  const travelStatus = getTravelStatus();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {creator.profile_photo_url ? (
              <Image
                src={creator.profile_photo_url}
                alt={creator.username}
                className="h-full w-full object-cover"
                width={60}
                height={60}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                <span className="text-xl font-bold">
                  {creator.first_name?.charAt(0) || ''}
                  {creator.last_name?.charAt(0) || ''}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-bold text-gray-900">
              {creator.username || 'User'}
            </h2>
          </div>
        </div>

        {/* Location */}
        <div className="mb-4">
          <p className="text-gray-600 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {creator.city && creator.country
              ? `${creator.city}, ${creator.country}`
              : creator.city || creator.country || 'Location not provided'}
          </p>
        </div>

        {/* Travel Status */}
        {travelStatus && (
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${travelStatus.color}`}
            >
              {travelStatus.icon}
              {travelStatus.label}
            </span>
            {creator.travel_start_date && creator.travel_end_date && (
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(creator.travel_start_date)} -{' '}
                {formatDate(creator.travel_end_date)}
              </p>
            )}
          </div>
        )}

        {/* Social Media */}
        <div className="flex space-x-2 mb-4">
          {creator.instagram_url && (
            <a
              href={creator.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700"
            >
              <Image
                src={Instagram}
                alt="Instagram"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </a>
          )}

          {creator.youtube_url && (
            <a
              href={creator.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-700"
            >
              <Image
                src={Youtube}
                alt="Youtube"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </a>
          )}

          {creator.tiktok_url && (
            <a
              href={creator.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-gray-800"
            >
              <Image
                src={Tiktok}
                alt="Tiktok"
                height={30}
                width={30}
                className="hover:scale-110"
              />
            </a>
          )}
        </div>

        {/* Collaboration Status */}
        {creator.is_collaborated && (
          <div className="bg-green-800 text-green-100 text-sm px-3 py-1 rounded-full inline-block mb-4">
            Open to collaborate
          </div>
        )}

        {/* View Profile Button */}
        <div className="mt-4">
          <Link
            href={`/creators/${creator.username}`}
            className="block w-full bg-indigo-600 text-white text-center py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
