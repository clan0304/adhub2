/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserType, ProfileFormData } from '@/types';
import Image from 'next/image';

interface ProfileFormProps {
  userType: UserType;
  userId: string;
  initialUsername?: string;
}

export default function ProfileForm({
  userType,
  userId,
  initialUsername = '',
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    username: initialUsername, // Use the initialUsername here
    firstName: '',
    lastName: '',
    phoneNumber: '',
    city: '',
    country: '',
    youtubeUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    isPublic: false,
    isCollaborated: false,
  });

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createClient();

  // Fetch initial profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'username, first_name, last_name, phone_number, city, country'
          )
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // If profile not found, just use initialUsername
          setFormData((prev) => ({
            ...prev,
            username: initialUsername || '',
          }));
          return;
        }

        if (data) {
          setFormData((prev) => ({
            ...prev,
            username: initialUsername || data.username || '',
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phoneNumber: data.phone_number || '',
            city: data.city || '',
            country: data.country || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [userId, supabase, initialUsername]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Check username availability
    if (name === 'username') {
      // Clear any existing timeout
      if (usernameTimeoutRef.current) {
        clearTimeout(usernameTimeoutRef.current);
      }

      // Set a timeout to check username availability
      if (value.length > 2) {
        setCheckingUsername(true);
        usernameTimeoutRef.current = setTimeout(async () => {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('username')
              .eq('username', value)
              .neq('id', userId) // Exclude current user
              .maybeSingle();

            setUsernameAvailable(!data);
          } catch (error) {
            console.error('Error checking username:', error);
          } finally {
            setCheckingUsername(false);
          }
        }, 500);
      } else {
        setUsernameAvailable(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Profile photo must be JPG, PNG, or GIF');
      return;
    }

    setProfilePhoto(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    // Reset error state
    setError(null);

    // Required fields
    if (!formData.username || !formData.firstName || !formData.lastName) {
      setError('Username, first name, and last name are required');
      return false;
    }

    // Username format validation
    if (!/^[a-z0-9_]{3,20}$/.test(formData.username)) {
      setError(
        'Username must be 3-20 characters and can only contain lowercase letters, numbers, and underscores'
      );
      return false;
    }

    // Username availability
    if (usernameAvailable === false) {
      setError('Username is already taken');
      return false;
    }

    // Validate URL formats if provided
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/;

    if (formData.youtubeUrl && !urlRegex.test(formData.youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return false;
    }

    if (formData.instagramUrl && !urlRegex.test(formData.instagramUrl)) {
      setError('Please enter a valid Instagram URL');
      return false;
    }

    if (formData.tiktokUrl && !urlRegex.test(formData.tiktokUrl)) {
      setError('Please enter a valid TikTok URL');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let profilePhotoUrl = null;

      // Upload profile photo if provided
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${userId}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile_photos')
          .upload(filePath, profilePhoto);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile_photos')
          .getPublicUrl(filePath);

        profilePhotoUrl = urlData.publicUrl;
      }

      // Process social media URLs to ensure they have https:// prefix
      const processUrl = (url: string | undefined): string | null => {
        if (!url || url.trim() === '') return null;
        return url.startsWith('http') ? url : `https://${url}`;
      };

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName,
          profile_photo_url: profilePhotoUrl,
          phone_number: formData.phoneNumber || null,
          city: formData.city || null,
          country: formData.country || null,
          user_type: userType,
          youtube_url:
            userType === 'content_creator'
              ? processUrl(formData.youtubeUrl)
              : null,
          instagram_url:
            userType === 'content_creator'
              ? processUrl(formData.instagramUrl)
              : null,
          tiktok_url:
            userType === 'content_creator'
              ? processUrl(formData.tiktokUrl)
              : null,
          is_public: userType === 'content_creator' ? formData.isPublic : false,
          is_collaborated:
            userType === 'content_creator' ? formData.isCollaborated : false,
          is_profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Complete your profile</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile photo */}
        <div className="flex flex-col items-center">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {profilePhotoPreview ? (
              <div className="w-full h-full">
                <Image
                  src={profilePhotoPreview}
                  alt="Profile preview"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full rounded-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}

            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          <span className="mt-2 text-sm text-gray-500">
            Click to upload a profile picture
          </span>
        </div>

        {/* Username */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            Username <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="username123"
            />
            {checkingUsername && (
              <div className="absolute right-2 top-2">
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
            {usernameAvailable === true && formData.username.length > 2 && (
              <div className="absolute right-2 top-2 text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            {usernameAvailable === false && (
              <div className="absolute right-2 top-2 text-red-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            3-20 characters, lowercase letters, numbers, and underscores only
          </p>
          {usernameAvailable === false && (
            <p className="mt-1 text-sm text-red-600">
              This username is already taken
            </p>
          )}
        </div>

        {/* First and Last Name */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700"
            >
              City
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700"
            >
              Country
            </label>
            <input
              type="text"
              name="country"
              id="country"
              value={formData.country}
              onChange={handleInputChange}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Content Creator Specific Fields */}
        {userType === 'content_creator' && (
          <>
            <div className="space-y-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Social Media Links
              </h3>

              <div>
                <label
                  htmlFor="youtubeUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  YouTube Channel
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="youtubeUrl"
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder="youtube.com/channel/..."
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="instagramUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  Instagram Profile
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="instagramUrl"
                    id="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleInputChange}
                    placeholder="instagram.com/..."
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tiktokUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  TikTok Profile
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="tiktokUrl"
                    id="tiktokUrl"
                    value={formData.tiktokUrl}
                    onChange={handleInputChange}
                    placeholder="tiktok.com/@..."
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Profile Settings
              </h3>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="isPublic"
                    className="font-medium text-gray-700"
                  >
                    Public Profile
                  </label>
                  <p className="text-gray-500">
                    Make your profile visible to everyone
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isCollaborated"
                    name="isCollaborated"
                    type="checkbox"
                    checked={formData.isCollaborated}
                    onChange={handleInputChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="isCollaborated"
                    className="font-medium text-gray-700"
                  >
                    Open to Collaboration
                  </label>
                  <p className="text-gray-500">
                    Allow businesses to contact you for potential collaborations
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || checkingUsername}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
