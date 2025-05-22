/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { JobPosting } from '@/types/findwork';
import Link from 'next/link';
import Image from 'next/image';
import { BookmarkIcon, BookmarkCheck } from 'lucide-react';
import { useMemo } from 'react';

interface JobPostingsListProps {
  loading: boolean;
  error: string | null;
  filteredJobPostings: JobPosting[];
  allJobPostings: JobPosting[];
  session: any; // Changed from Session | null to any
  isBusinessOwner: boolean;
  showMyPostingsOnly: boolean;
  myPostingsCount: number;
  setIsModalOpen: (isOpen: boolean) => void;
  handleDeleteJobPosting: (id: string) => Promise<void>;
  handleSaveJob: (id: string, isSaved: boolean) => Promise<void>;
  handleEditJobPosting: (job: JobPosting) => void;
}

export function JobPostingsList({
  loading,
  error,
  filteredJobPostings,
  allJobPostings,
  session,
  isBusinessOwner,
  showMyPostingsOnly,
  myPostingsCount,
  setIsModalOpen,
  handleDeleteJobPosting,
  handleSaveJob,
  handleEditJobPosting,
}: JobPostingsListProps) {
  // Format date helper function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Unknown date';
    }
  };

  // Format deadline helper function - Modified to show only hours and minutes
  const formatDeadline = (
    dateString: string | null,
    timeString: string | null
  ) => {
    if (!dateString) return 'No deadline';

    try {
      const date = new Date(dateString);
      // Format the date part
      let formattedDate = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);

      // Format the time part (if provided)
      if (timeString) {
        // Parse hours and minutes from the timeString (HH:MM:SS format)
        const [hours, minutes] = timeString.split(':').map(Number);

        // Create time string in 12-hour format with AM/PM
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        const displayMinutes = minutes.toString().padStart(2, '0');

        formattedDate += ` at ${displayHours}:${displayMinutes} ${period}`;
      }

      return formattedDate;
    } catch (e) {
      console.error('Error formatting deadline:', e);
      return 'No deadline';
    }
  };

  // Check if deadline has passed
  const isDeadlinePassed = (job: JobPosting) => {
    if (!job || !job.has_deadline || !job.deadline_date) return false;

    try {
      const today = new Date();
      const deadline = new Date(job.deadline_date);

      if (job.deadline_time) {
        const [hours, minutes] = job.deadline_time.split(':').map(Number);
        deadline.setHours(hours, minutes);
      } else {
        deadline.setHours(23, 59, 59);
      }

      return today > deadline;
    } catch (e) {
      console.error('Error checking deadline:', e);
      return false;
    }
  };

  // Filter out expired job postings from display
  const activeJobPostings = useMemo(() => {
    const safeFilteredJobPostings = Array.isArray(filteredJobPostings)
      ? filteredJobPostings
      : [];

    return safeFilteredJobPostings.filter((job) => {
      // Always show jobs without deadlines
      if (!job.has_deadline) return true;

      // For business owners viewing their own postings, show all jobs (including expired)
      if (
        isBusinessOwner &&
        showMyPostingsOnly &&
        job.profile_id === session?.user?.id
      ) {
        return true;
      }

      // For all other cases, hide expired jobs
      return !isDeadlinePassed(job);
    });
  }, [
    filteredJobPostings,
    isBusinessOwner,
    showMyPostingsOnly,
    session?.user?.id,
  ]);

  // Calculate active job count for the all jobs array
  const activeAllJobPostings = useMemo(() => {
    const safeAllJobPostings = Array.isArray(allJobPostings)
      ? allJobPostings
      : [];

    return safeAllJobPostings.filter((job) => {
      if (!job.has_deadline) return true;

      // For business owners viewing their own postings, count all jobs
      if (
        isBusinessOwner &&
        showMyPostingsOnly &&
        job.profile_id === session?.user?.id
      ) {
        return true;
      }

      return !isDeadlinePassed(job);
    });
  }, [allJobPostings, isBusinessOwner, showMyPostingsOnly, session?.user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center my-12">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (activeJobPostings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        {activeAllJobPostings.length === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No job postings available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isBusinessOwner
                ? 'Be the first to post a job opportunity for content creators!'
                : 'Check back later for new opportunities.'}
            </p>
            {isBusinessOwner && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create a Job Posting
              </button>
            )}
          </>
        ) : showMyPostingsOnly && myPostingsCount === 0 ? (
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              You haven&apos;t created any job postings yet
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Your First Job Posting
            </button>
          </>
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
              No matching job postings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search filters to see more results.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeJobPostings.map((job) => (
        <div
          key={job.id}
          className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow ${
            isDeadlinePassed(job) ? 'opacity-60' : ''
          }`}
        >
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/findwork/${job.slug}`}
                    className="text-xl font-bold text-indigo-600 hover:underline"
                  >
                    {job.title || 'Untitled Job Posting'}
                  </Link>
                  {/* Show expired badge for business owners viewing their own posts */}
                  {isBusinessOwner &&
                    job.profile_id === session?.user?.id &&
                    isDeadlinePassed(job) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Expired
                      </span>
                    )}
                </div>

                <div className="flex items-center mt-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {job.owner_profile_photo_url ? (
                      <Image
                        src={job.owner_profile_photo_url}
                        alt={job.owner_username || 'User'}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                        <span className="font-bold text-xs">
                          {job.owner_first_name?.[0] || '?'}
                          {job.owner_last_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-2 text-sm text-gray-600">
                    <span className="font-medium">
                      {job.owner_username || 'user'}
                    </span>{' '}
                    •{' '}
                    {job.owner_city && job.owner_country
                      ? `${job.owner_city}, ${job.owner_country}`
                      : job.owner_city ||
                        job.owner_country ||
                        'Location not specified'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                {/* For content creators: Save button (only for non-expired jobs) */}
                {session && !isBusinessOwner && !isDeadlinePassed(job) && (
                  <button
                    onClick={() => handleSaveJob(job.id, job.is_saved)}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none transition-colors"
                    aria-label={job.is_saved ? 'Unsave job' : 'Save job'}
                  >
                    {job.is_saved ? (
                      <BookmarkCheck className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <BookmarkIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                )}

                {/* For business owners: Edit & Delete buttons for their own jobs */}
                {isBusinessOwner && job.profile_id === session?.user?.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditJobPosting(job)}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJobPosting(job.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-gray-700 line-clamp-3">
                {job.description && job.description.length > 200
                  ? `${job.description.substring(0, 200)}...`
                  : job.description || 'No description provided.'}
              </p>
            </div>

            <div className="mt-4 flex justify-between items-center text-sm">
              <div className="text-gray-500">
                Posted on {formatDate(job.created_at)}
              </div>

              {job.has_deadline && (
                <div className="font-medium text-red-600">
                  Date and Time:{' '}
                  {formatDeadline(job.deadline_date, job.deadline_time)}
                  {isDeadlinePassed(job) && (
                    <span className="ml-2 text-red-600 font-bold">
                      (Expired)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Link href={`/findwork/${job.slug}`}>
                <button
                  className={`px-4 py-2 rounded-md transition-colors ${
                    isDeadlinePassed(job)
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                  disabled={isDeadlinePassed(job)}
                >
                  View Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
