export type UserType = 'content_creator' | 'business_owner';

export type ProfileFormData = {
  username: string;
  firstName: string;
  lastName: string;
  profilePhoto?: File;
  phoneNumber?: string;
  city?: string;
  country?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  isPublic?: boolean;
  isCollaborated?: boolean;
  bio?: string;
};
