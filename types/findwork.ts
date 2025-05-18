// Updated types/findwork.ts to reflect the new schema with owner_ fields

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  profile_id: string;
  slug: string;

  // Owner info fields (directly in job_postings table)
  owner_username: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_city: string | null;
  owner_country: string | null;
  owner_profile_photo_url: string | null;

  // Fields for client-side usage (not stored in the database)
  username?: string; // For backwards compatibility
  profile_photo_url?: string | null;
  city?: string | null;
  country?: string | null;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
  is_saved: boolean;
}

export interface JobPostingFormData {
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
}

export interface CountryOption {
  code: string;
  name: string;
}

export interface Applicant {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo_url: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}
