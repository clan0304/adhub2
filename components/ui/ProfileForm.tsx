/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { UserType, ProfileFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Check, Loader2, Upload, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  // Store the initial username in a ref to use it for backend operations
  // but don't display it in the form
  const initialUsernameRef = useRef<string>(initialUsername);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: '', // Start with empty username in the form
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
    bio: '', // Add bio field
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
            'username, first_name, last_name, phone_number, city, country, bio'
          )
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          // Store the initialUsername in the ref but don't show it in the form
          initialUsernameRef.current = initialUsername;
          return;
        }

        if (data) {
          // Store backend username in ref
          initialUsernameRef.current = data.username || initialUsername;

          // Only populate non-username fields in the form
          setFormData((prev) => ({
            ...prev,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phoneNumber: data.phone_number || '',
            city: data.city || '',
            country: data.country || '',
            bio: data.bio || '',
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

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
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

    // Validate bio length if provided
    if (
      userType === 'content_creator' &&
      formData.bio &&
      formData.bio.length > 500
    ) {
      setError('Bio must be less than 500 characters');
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

      // If username is empty in the form but we have an initial username, use that instead
      const usernameToSave = formData.username || initialUsernameRef.current;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: usernameToSave,
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
          bio: userType === 'content_creator' ? formData.bio || null : null,
          is_public: userType === 'content_creator' ? formData.isPublic : false,
          is_collaborated:
            userType === 'content_creator' ? formData.isCollaborated : false,
          is_profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription>
          Fill in your information to personalize your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile photo */}
          <div className="flex flex-col items-center space-y-3">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Upload profile picture"
            >
              <Avatar className="w-24 h-24 border-2 border-muted">
                {profilePhotoPreview ? (
                  <AvatarImage
                    src={profilePhotoPreview || '/placeholder.svg'}
                    alt="Profile preview"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-muted">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="sr-only"
              accept="image/*"
              onChange={handleFileChange}
              aria-label="Upload profile picture"
            />

            <span className="text-sm text-muted-foreground">
              Click to upload a profile picture
            </span>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">
              Username <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="username"
                className="pr-10"
                aria-describedby="username-description username-availability"
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                </div>
              )}
              {usernameAvailable === true && formData.username.length > 2 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                  <Check className="h-4 w-4" />
                </div>
              )}
              {usernameAvailable === false && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
            </div>
            <p
              id="username-description"
              className="text-xs text-muted-foreground"
            >
              3-20 characters, lowercase letters, numbers, and underscores only
            </p>
            {usernameAvailable === false && (
              <p
                id="username-availability"
                className="text-sm text-destructive"
              >
                This username is already taken
              </p>
            )}
          </div>

          {/* First and Last Name */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                aria-required="true"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
              aria-describedby="phone-description"
            />
            <p id="phone-description" className="text-xs text-muted-foreground">
              Optional: Include country code for international numbers
            </p>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                City
              </Label>
              <Input
                type="text"
                name="city"
                id="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Input
                type="text"
                name="country"
                id="country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Content Creator Specific Fields */}
          {userType === 'content_creator' && (
            <>
              <Separator className="my-6" />

              {/* Bio section */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  placeholder="Tell visitors about yourself, your content, and what you do..."
                  className="h-32"
                />
                <p className="text-xs text-muted-foreground">
                  Your bio helps potential collaborators understand your style
                  and content. Maximum 500 characters.{' '}
                  {formData.bio ? `(${formData.bio.length}/500)` : ''}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media Links</h3>

                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl" className="text-sm font-medium">
                    YouTube Channel
                  </Label>
                  <div className="flex rounded-md">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      https://
                    </span>
                    <Input
                      type="text"
                      name="youtubeUrl"
                      id="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleInputChange}
                      placeholder="youtube.com/channel/..."
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl" className="text-sm font-medium">
                    Instagram Profile
                  </Label>
                  <div className="flex rounded-md">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      https://
                    </span>
                    <Input
                      type="text"
                      name="instagramUrl"
                      id="instagramUrl"
                      value={formData.instagramUrl}
                      onChange={handleInputChange}
                      placeholder="instagram.com/..."
                      className="rounded-l-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktokUrl" className="text-sm font-medium">
                    TikTok Profile
                  </Label>
                  <div className="flex rounded-md">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                      https://
                    </span>
                    <Input
                      type="text"
                      name="tiktokUrl"
                      id="tiktokUrl"
                      value={formData.tiktokUrl}
                      onChange={handleInputChange}
                      placeholder="tiktok.com/@..."
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Settings</h3>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('isPublic', checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isPublic" className="font-medium">
                      Public Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Make your profile visible to everyone
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="isCollaborated"
                    checked={formData.isCollaborated}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange('isCollaborated', checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="isCollaborated" className="font-medium">
                      Open to Collaboration
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow businesses to contact you for potential
                      collaborations
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || checkingUsername}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
