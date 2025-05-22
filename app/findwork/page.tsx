/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import JobPostingModal, {
  JobPostingFormData,
} from '@/components/JobPostingModal';
import { JobPostingsList } from '@/components/findwork/JobPostingList';
import { FilterSection } from '@/components/findwork/FilterSection';
import { JobPosting, CountryOption } from '@/types/findwork';
import { getData } from 'country-list';

export default function FindWorkPage() {
  const { user, profile, session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allJobPostings, setAllJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPosting[]>(
    []
  );
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlySaved, setShowOnlySaved] = useState(false);
  const [showMyPostingsOnly, setShowMyPostingsOnly] = useState(false);
  const [currentEditJob, setCurrentEditJob] = useState<JobPosting | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Redirect to profile setup if user hasn't completed profile
  useEffect(() => {
    if (profile && !profile.is_profile_completed && session) {
      router.push('/profile-setup');
    }
  }, [profile, session, router]);

  // Load country list
  useEffect(() => {
    try {
      const countryData = getData();

      // Modify the list to ensure Taiwan is displayed correctly
      const modifiedCountries = countryData.map((country) => {
        if (country.code === 'TW') {
          return { ...country, name: 'Taiwan' };
        }
        return country;
      });

      // Sort countries alphabetically
      modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));

      setCountries(modifiedCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      // Fallback if country-list package fails
      setCountries([]);
    }
  }, []);

  // Fetch job postings and saved jobs
  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);

        // Get all job postings - now using the owner_ fields directly from job_postings table
        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select('*, profile_id')
          .order('created_at', { ascending: false });

        if (jobsError) throw jobsError;

        if (!jobsData || jobsData.length === 0) {
          setAllJobPostings([]);
          setFilteredJobPostings([]);
          setLoading(false);
          return;
        }

        // Transform job postings with profile data from the new columns
        const transformedJobs = jobsData.map((posting) => {
          return {
            ...posting,
            // Now using the owner_ fields directly
            username: posting.owner_username || 'Unknown',
            profile_photo_url: posting.owner_profile_photo_url || null,
            city: posting.owner_city || null,
            country: posting.owner_country || null,
            user_id: posting.profile_id, // Use profile_id as user_id
            first_name: posting.owner_first_name || 'Unknown',
            last_name: posting.owner_last_name || 'User',
            user_type: 'business_owner', // Assume only business owners can post jobs
            is_saved: false, // Default to not saved
          };
        });

        setAllJobPostings(transformedJobs);
        setFilteredJobPostings(transformedJobs);

        // If user is logged in and is a content creator, fetch their saved jobs
        if (session?.user && profile?.user_type === 'content_creator') {
          const { data: savedJobsData, error: savedJobsError } = await supabase
            .from('saved_jobs')
            .select('job_posting_id')
            .eq('profile_id', profile.id);

          if (savedJobsError) throw savedJobsError;

          // Create a Set of saved job IDs for efficient lookup
          const savedIds = new Set(
            savedJobsData?.map((item) => item.job_posting_id) || []
          );
          setSavedJobIds(savedIds);

          // Mark jobs as saved
          const jobsWithSavedFlag = transformedJobs.map((job) => ({
            ...job,
            is_saved: savedIds.has(job.id),
          }));

          setAllJobPostings(jobsWithSavedFlag);
          setFilteredJobPostings(jobsWithSavedFlag);
        }
      } catch (err: any) {
        console.error('Error fetching job postings:', err);
        setError(err.message || 'Failed to load job postings');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, [session, profile, supabase]);

  // Apply filters when search, country, saved filter, or my postings filter changes
  useEffect(() => {
    if (!allJobPostings.length) return;

    let filtered = [...allJobPostings];

    // Apply saved jobs filter
    if (showOnlySaved) {
      filtered = filtered.filter((job) => job.is_saved);
    }

    // Apply my postings filter for business owners
    if (showMyPostingsOnly && user?.id) {
      filtered = filtered.filter((job) => job.profile_id === user.id);
    }

    // Apply country filter
    if (selectedCountry) {
      filtered = filtered.filter(
        (job) => job.owner_country === selectedCountry
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          (job.owner_city?.toLowerCase() || '').includes(query) ||
          (job.owner_country?.toLowerCase() || '').includes(query) ||
          `${job.owner_first_name || ''} ${job.owner_last_name || ''}`
            .toLowerCase()
            .includes(query) ||
          (job.owner_username?.toLowerCase() || '').includes(query)
      );
    }

    setFilteredJobPostings(filtered);
  }, [
    selectedCountry,
    searchQuery,
    showOnlySaved,
    showMyPostingsOnly,
    allJobPostings,
    user,
  ]);

  // Helper function to generate a slug from title
  const generateSlug = (title: string): string => {
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    const baseSlug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    // Add random characters to ensure uniqueness
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomStr}`;
  };

  const handleCreateJobPosting = async (jobData: JobPostingFormData) => {
    if (!session?.user || !profile) return;

    try {
      if (currentEditJob) {
        // Update existing job posting
        const { error } = await supabase
          .from('job_postings')
          .update({
            title: jobData.title,
            description: jobData.description,
            has_deadline: jobData.has_deadline,
            deadline_date: jobData.deadline_date,
            deadline_time: jobData.deadline_time,
          })
          .eq('id', currentEditJob.id);

        if (error) throw error;

        // Update job listings in state
        const updatedJobPostings = allJobPostings.map((job) =>
          job.id === currentEditJob.id
            ? {
                ...job,
                title: jobData.title,
                description: jobData.description,
                has_deadline: jobData.has_deadline,
                deadline_date: jobData.deadline_date,
                deadline_time: jobData.deadline_time,
              }
            : job
        );

        setAllJobPostings(updatedJobPostings);
        setFilteredJobPostings(
          filteredJobPostings.map((job) =>
            job.id === currentEditJob.id
              ? {
                  ...job,
                  title: jobData.title,
                  description: jobData.description,
                  has_deadline: jobData.has_deadline,
                  deadline_date: jobData.deadline_date,
                  deadline_time: jobData.deadline_time,
                }
              : job
          )
        );
      } else {
        // Create new job posting
        // Generate slug from title
        const slug = generateSlug(jobData.title);

        // Use the profile's id column as the foreign key and include owner info
        const { data, error } = await supabase
          .from('job_postings')
          .insert({
            profile_id: profile.id, // This uses the id from profiles table
            title: jobData.title,
            description: jobData.description,
            has_deadline: jobData.has_deadline,
            deadline_date: jobData.deadline_date,
            deadline_time: jobData.deadline_time,
            slug: slug,
            // Store owner information directly
            owner_username: profile.username,
            owner_first_name: profile.first_name,
            owner_last_name: profile.last_name,
            owner_city: profile.city,
            owner_country: profile.country,
            owner_profile_photo_url: profile.profile_photo_url,
          })
          .select();

        if (error) throw error;

        if (data && data[0]) {
          // Create a complete job posting object with owner data
          const newJobPosting = {
            ...data[0],
            username: profile.username || 'Unknown',
            profile_photo_url: profile.profile_photo_url || null,
            city: profile.city || null,
            country: profile.country || null,
            user_id: profile.id, // This should match the business owner's id
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            user_type: profile.user_type || 'unknown',
            is_saved: false,
          };

          // Add the new job posting to the state
          const updatedJobPostings = [
            newJobPosting as JobPosting,
            ...allJobPostings,
          ];
          setAllJobPostings(updatedJobPostings);

          // Re-apply filters
          let filtered = [...updatedJobPostings];
          if (showOnlySaved) {
            filtered = filtered.filter((job) => job.is_saved);
          }
          if (showMyPostingsOnly && user?.id) {
            filtered = filtered.filter((job) => job.profile_id === user.id);
          }
          if (selectedCountry) {
            filtered = filtered.filter(
              (job) => job.owner_country === selectedCountry
            );
          }
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (job) =>
                job.title.toLowerCase().includes(query) ||
                job.description.toLowerCase().includes(query)
            );
          }
          setFilteredJobPostings(filtered);
        }
      }

      setIsModalOpen(false);
      setCurrentEditJob(null);
    } catch (err: any) {
      console.error('Error creating/updating job posting:', err);
      alert(
        `Failed to ${currentEditJob ? 'update' : 'create'} job posting: ${
          err.message
        }`
      );
    }
  };

  const handleDeleteJobPosting = async (id: string) => {
    try {
      const confirm = window.confirm(
        'Are you sure you want to delete this job posting?'
      );
      if (!confirm) return;

      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update both job posting lists
      const updatedJobPostings = allJobPostings.filter((job) => job.id !== id);
      setAllJobPostings(updatedJobPostings);
      setFilteredJobPostings(
        filteredJobPostings.filter((job) => job.id !== id)
      );
    } catch (err: any) {
      console.error('Error deleting job posting:', err);
      alert(`Failed to delete job posting: ${err.message}`);
    }
  };

  const handleEditJobPosting = (job: JobPosting) => {
    setCurrentEditJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditJob(null);
  };

  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    if (!profile) return;

    try {
      if (isSaved) {
        // Unsave the job
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('profile_id', profile.id)
          .eq('job_posting_id', jobId);

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.delete(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: false } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) => {
          // If we're showing only saved, remove this job from the filtered list
          if (showOnlySaved) {
            return prevFiltered.filter((job) => job.id !== jobId);
          }
          // Otherwise, update it to show as not saved
          return prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: false } : job
          );
        });
      } else {
        // Save the job
        const { error } = await supabase.from('saved_jobs').insert({
          profile_id: profile.id,
          job_posting_id: jobId,
        });

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.add(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: true } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) =>
          prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: true } : job
          )
        );
      }
    } catch (err: any) {
      console.error('Error saving/unsaving job:', err);
      alert(`Failed to save/unsave job: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setShowOnlySaved(false);
    setShowMyPostingsOnly(false);
    setFilteredJobPostings(allJobPostings);
  };

  const toggleSavedFilter = () => {
    setShowOnlySaved(!showOnlySaved);
    // Turn off "My Postings" filter if turning on "Saved" filter
    if (!showOnlySaved) {
      setShowMyPostingsOnly(false);
    }
  };

  const toggleMyPostingsFilter = () => {
    setShowMyPostingsOnly(!showMyPostingsOnly);
    // Turn off "Saved" filter if turning on "My Postings" filter
    if (!showMyPostingsOnly) {
      setShowOnlySaved(false);
    }
  };

  const isBusinessOwner = profile?.user_type === 'business_owner';
  const isContentCreator = profile?.user_type === 'content_creator';

  // Count how many postings are created by the business owner
  const myPostingsCount = user?.id
    ? allJobPostings.filter((job) => job.profile_id === user.id).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Work</h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover collaboration opportunities with businesses
            </p>
          </div>

          {/* Show "Join as a Business Owner" button for non-signed-in users */}
          {!user && (
            <Link
              href="/auth"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Join as a Business Owner
            </Link>
          )}

          {/* Show "Create Job Posting" button for signed-in business owners */}
          {isBusinessOwner && (
            <button
              onClick={() => {
                setCurrentEditJob(null); // Ensure we're creating a new job
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Job Posting
            </button>
          )}
        </div>

        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          countries={countries}
          showOnlySaved={showOnlySaved}
          toggleSavedFilter={toggleSavedFilter}
          showMyPostingsOnly={showMyPostingsOnly}
          toggleMyPostingsFilter={toggleMyPostingsFilter}
          clearFilters={clearFilters}
          isContentCreator={isContentCreator}
          isBusinessOwner={isBusinessOwner}
          myPostingsCount={myPostingsCount}
          filteredCount={filteredJobPostings.length}
          totalCount={allJobPostings.length}
        />

        <JobPostingsList
          loading={loading}
          error={error}
          filteredJobPostings={filteredJobPostings}
          allJobPostings={allJobPostings}
          session={session}
          isBusinessOwner={isBusinessOwner}
          showMyPostingsOnly={showMyPostingsOnly}
          myPostingsCount={myPostingsCount}
          setIsModalOpen={setIsModalOpen}
          handleDeleteJobPosting={handleDeleteJobPosting}
          handleSaveJob={handleSaveJob}
          handleEditJobPosting={handleEditJobPosting}
        />
      </div>

      {isModalOpen && (
        <JobPostingModal
          onClose={handleCloseModal}
          onCreate={handleCreateJobPosting}
          initialData={currentEditJob}
        />
      )}
    </div>
  );
}
