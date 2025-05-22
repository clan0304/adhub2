/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { JobPosting } from '@/types/findwork';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookmarkIcon,
  BookmarkCheck,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
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
      <div
        className="flex items-center justify-center my-12"
        role="status"
        aria-live="polite"
      >
        <div
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        ></div>
        <span className="sr-only">Loading job postings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm"
        role="alert"
        aria-live="assertive"
      >
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (activeJobPostings.length === 0) {
    return (
      <div
        className="text-center py-16 px-6 bg-white rounded-xl shadow-sm border border-gray-100"
        role="status"
        aria-live="polite"
      >
        {activeAllJobPostings.length === 0 ? (
          <>
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-10 w-10 text-gray-400"
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
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No job postings available
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              {isBusinessOwner
                ? 'Be the first to post a job opportunity for content creators!'
                : 'Check back later for new opportunities.'}
            </p>
            {isBusinessOwner && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Create a new job posting"
              >
                Create a Job Posting
              </button>
            )}
          </>
        ) : showMyPostingsOnly && myPostingsCount === 0 ? (
          <>
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-10 w-10 text-gray-400"
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
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              You haven&apos;t created any job postings yet
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Create your first job posting"
            >
              Create Your First Job Posting
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="h-10 w-10 text-gray-400"
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
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No matching job postings
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search filters to see more results.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" role="feed" aria-label="Job postings">
      {activeJobPostings.map((job) => (
        <article
          key={job.id}
          className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all ${
            isDeadlinePassed(job) ? 'opacity-75' : ''
          }`}
        >
          <div className="p-6">
            {/* Header with title and actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/findwork/${job.slug}`}
                    className="text-xl font-bold text-primary hover:text-primary/90 hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label={`View details for ${
                      job.title || 'Untitled Job Posting'
                    }`}
                  >
                    {job.title || 'Untitled Job Posting'}
                  </Link>
                  {/* Show expired badge for business owners viewing their own posts */}
                  {isBusinessOwner &&
                    job.profile_id === session?.user?.id &&
                    isDeadlinePassed(job) && (
                      <span
                        className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full"
                        aria-label="Expired job posting"
                      >
                        Expired
                      </span>
                    )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-start">
                {/* For content creators: Save button (only for non-expired jobs) */}
                {session && !isBusinessOwner && !isDeadlinePassed(job) && (
                  <button
                    onClick={() => handleSaveJob(job.id, job.is_saved)}
                    className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    aria-label={
                      job.is_saved
                        ? `Unsave job: ${job.title}`
                        : `Save job: ${job.title}`
                    }
                  >
                    {job.is_saved ? (
                      <BookmarkCheck
                        className="h-5 w-5 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <BookmarkIcon
                        className="h-5 w-5 text-gray-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )}

                {/* For business owners: Edit & Delete buttons for their own jobs */}
                {isBusinessOwner && job.profile_id === session?.user?.id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditJobPosting(job)}
                      className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label={`Edit job: ${job.title}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJobPosting(job.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete job: ${job.title}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Company/User info */}
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                {job.owner_profile_photo_url ? (
                  <Image
                    src={job.owner_profile_photo_url || '/placeholder.svg'}
                    alt={`Profile photo of ${job.owner_username || 'User'}`}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                    <span className="font-bold text-xs" aria-hidden="true">
                      {job.owner_first_name?.[0] || '?'}
                      {job.owner_last_name?.[0] || '?'}
                    </span>
                    <span className="sr-only">
                      {job.owner_username || 'User profile'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">
                  {job.owner_username || 'user'}
                </div>
                <div className="flex items-center text-sm text-gray-600 mt-0.5">
                  <MapPin
                    className="h-3.5 w-3.5 mr-1 text-gray-400"
                    aria-hidden="true"
                  />
                  <span>
                    {job.owner_city && job.owner_country
                      ? `${job.owner_city}, ${job.owner_country}`
                      : job.owner_city ||
                        job.owner_country ||
                        'Location not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Job description */}
            <div className="mb-5">
              <p className="text-gray-700 line-clamp-3">
                {job.description && job.description.length > 200
                  ? `${job.description.substring(0, 200)}...`
                  : job.description || 'No description provided.'}
              </p>
            </div>

            {/* Metadata and actions */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Posted date */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar
                      className="h-4 w-4 mr-1.5 text-gray-400"
                      aria-hidden="true"
                    />
                    <span>Posted: {formatDate(job.created_at)}</span>
                  </div>

                  {/* Deadline */}
                  {job.has_deadline && (
                    <div
                      className={`flex items-center text-sm ${
                        isDeadlinePassed(job) ? 'text-red-700' : 'text-primary'
                      }`}
                    >
                      <Clock
                        className="h-4 w-4 mr-1.5 text-gray-400"
                        aria-hidden="true"
                      />
                      <span className="font-medium">
                        Deadline:{' '}
                        {formatDeadline(job.deadline_date, job.deadline_time)}
                        {isDeadlinePassed(job) && (
                          <span className="ml-1 text-red-700 font-bold">
                            (Expired)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* View details button */}
                <Link href={`/findwork/${job.slug}`}>
                  <button
                    className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isDeadlinePassed(job)
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary'
                    }`}
                    disabled={isDeadlinePassed(job)}
                    aria-label={`View details for ${job.title}${
                      isDeadlinePassed(job) ? ' (Expired)' : ''
                    }`}
                  >
                    <span>View Details</span>
                    <ExternalLink
                      className="ml-1.5 h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
