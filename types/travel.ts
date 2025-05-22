// types/travel.ts
export interface TravelSchedule {
  id: string;
  profile_id: string;
  start_date: string;
  end_date: string;
  city: string;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface TravelScheduleFormData {
  start_date: string;
  end_date: string;
  city: string;
  country: string;
}

export interface CountryOption {
  code: string;
  name: string;
}

export interface CreatorWithTravel {
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
  is_collaborated: boolean;
  is_public: boolean;
  user_type: string;
  bio: string | null;
  travel_schedules?: TravelSchedule[];
  is_traveling?: boolean;
  travel_city?: string;
  travel_country?: string;
  travel_start_date?: string;
  travel_end_date?: string;
}
