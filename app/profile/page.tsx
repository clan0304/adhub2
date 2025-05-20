/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ProfileFormData } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Edit,
  Loader2,
  Check,
  AlertCircle,
  Save,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
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
    bio: '',
  });
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Initialize form with user profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        phoneNumber: profile.phone_number || '',
        city: profile.city || '',
        country: profile.country || '',
        youtubeUrl: profile.youtube_url || '',
        instagramUrl: profile.instagram_url || '',
        tiktokUrl: profile.tiktok_url || '',
        isPublic: profile.is_public || false,
        isCollaborated: profile.is_collaborated || false,
        bio: profile.bio || '',
      });

      if (profile.profile_photo_url) {
        setProfilePhotoPreview(profile.profile_photo_url);
      }
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    if (!formData.firstName || !formData.lastName) {
      setError('First name and last name are required');
      return false;
    }

    // Validate bio length for content creators
    if (
      profile?.user_type === 'content_creator' &&
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

    if (!user || !profile) {
      setError('You must be logged in to update your profile');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let profilePhotoUrl = profile.profile_photo_url;

      // Upload profile photo if provided
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

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
          first_name: formData.firstName,
          last_name: formData.lastName,
          profile_photo_url: profilePhotoUrl,
          phone_number: formData.phoneNumber || null,
          city: formData.city || null,
          country: formData.country || null,
          youtube_url:
            profile.user_type === 'content_creator'
              ? processUrl(formData.youtubeUrl)
              : null,
          instagram_url:
            profile.user_type === 'content_creator'
              ? processUrl(formData.instagramUrl)
              : null,
          tiktok_url:
            profile.user_type === 'content_creator'
              ? processUrl(formData.tiktokUrl)
              : null,
          bio:
            profile.user_type === 'content_creator'
              ? formData.bio || null
              : null,
          is_public:
            profile.user_type === 'content_creator' ? formData.isPublic : false,
          is_collaborated:
            profile.user_type === 'content_creator'
              ? formData.isCollaborated
              : false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh profile data in context
      await refreshProfile();

      setSuccess('Profile updated successfully');

      // Exit edit mode
      setIsEditing(false);

      // Optional: Refresh the page to show updated data
      router.refresh();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="mt-2 text-gray-600">
            View and manage your profile information
          </p>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column - Profile summary */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <CardHeader className="bg-indigo-50 pb-0">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar className="w-24 h-24 border-4 border-white">
                      {profilePhotoPreview ? (
                        <AvatarImage
                          src={profilePhotoPreview}
                          alt="Profile"
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xl">
                          {profile.first_name?.[0]}
                          {profile.last_name?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isEditing && (
                      <label
                        htmlFor="profile-photo"
                        className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>
                  <CardTitle className="text-center text-xl">
                    {`${profile.first_name} ${profile.last_name}`}
                  </CardTitle>
                  <CardDescription className="text-center mb-4">
                    {profile.username}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Account Type
                    </h3>
                    <p className="mt-1 capitalize">
                      {profile.user_type?.replace('_', ' ') || 'User'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{user.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Location
                    </h3>
                    <p className="mt-1">
                      {profile.city && profile.country
                        ? `${profile.city}, ${profile.country}`
                        : profile.city || profile.country || 'Not specified'}
                    </p>
                  </div>

                  {profile.user_type === 'content_creator' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Profile Status
                      </h3>
                      <div className="mt-1 space-y-1">
                        {profile.is_public && (
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            <span>Public Profile</span>
                          </div>
                        )}
                        {profile.is_collaborated && (
                          <div className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            <span>Open to Collaborations</span>
                          </div>
                        )}
                        {!profile.is_public && !profile.is_collaborated && (
                          <span className="text-gray-500">Private profile</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data to profile values
                        if (profile) {
                          setFormData({
                            username: profile.username || '',
                            firstName: profile.first_name || '',
                            lastName: profile.last_name || '',
                            phoneNumber: profile.phone_number || '',
                            city: profile.city || '',
                            country: profile.country || '',
                            youtubeUrl: profile.youtube_url || '',
                            instagramUrl: profile.instagram_url || '',
                            tiktokUrl: profile.tiktok_url || '',
                            isPublic: profile.is_public || false,
                            isCollaborated: profile.is_collaborated || false,
                            bio: profile.bio || '',
                          });
                          setProfilePhotoPreview(
                            profile.profile_photo_url || null
                          );
                          setProfilePhoto(null);
                        }
                        setError(null);
                        setSuccess(null);
                      }}
                      className="w-full"
                      variant="outline"
                    >
                      Cancel Editing
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {profile.user_type === 'content_creator' && !isEditing && (
              <div className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Public Profile</CardTitle>
                    <CardDescription>
                      View how your profile appears to others
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link
                      href={`/creators/${profile.username}`}
                      className="w-full"
                    >
                      <Button variant="secondary" className="w-full">
                        View Public Profile
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/settings" className="w-full">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* Settings card for business owners */}
            {profile.user_type === 'business_owner' && !isEditing && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Settings</CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/settings" className="w-full">
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>

          {/* Right column - Edit form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditing ? 'Edit Profile' : 'Profile Details'}
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? 'Update your personal information and preferences'
                    : 'Your personal information and preferences'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {profile.first_name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {profile.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      ) : (
                        <p className="text-gray-900 py-2">
                          {profile.phone_number || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Location */}
                  <div>
                    <h3 className="text-lg font-medium">Location</h3>
                    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {profile.city || 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        {isEditing ? (
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                          />
                        ) : (
                          <p className="text-gray-900 py-2">
                            {profile.country || 'Not provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Creator Specific Fields */}
                  {profile.user_type === 'content_creator' && (
                    <>
                      <Separator />

                      {/* Bio Section */}
                      <div>
                        <h3 className="text-lg font-medium">Bio</h3>
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="bio">About You</Label>
                          {isEditing ? (
                            <Textarea
                              id="bio"
                              name="bio"
                              value={formData.bio || ''}
                              onChange={handleInputChange}
                              placeholder="Tell visitors about yourself, your content, and what you do..."
                              className="h-32"
                            />
                          ) : (
                            <div className="rounded-md bg-gray-50 p-3">
                              {profile.bio ? (
                                <p className="text-gray-900 whitespace-pre-wrap">
                                  {profile.bio}
                                </p>
                              ) : (
                                <p className="text-gray-500 italic">
                                  No bio provided. Add one to tell people about
                                  yourself.
                                </p>
                              )}
                            </div>
                          )}
                          {isEditing && (
                            <p className="text-xs text-gray-500">
                              Your bio helps potential collaborators understand
                              your style and content. Maximum 500 characters.{' '}
                              {formData.bio
                                ? `(${formData.bio.length}/500)`
                                : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium">Social Media</h3>
                        <div className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="youtubeUrl">YouTube Channel</Label>
                            {isEditing ? (
                              <div className="flex rounded-md">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                  https://
                                </span>
                                <Input
                                  id="youtubeUrl"
                                  name="youtubeUrl"
                                  value={formData.youtubeUrl?.replace(
                                    /^https?:\/\//,
                                    ''
                                  )}
                                  onChange={handleInputChange}
                                  placeholder="youtube.com/channel/..."
                                  className="rounded-l-none"
                                />
                              </div>
                            ) : (
                              <p className="text-gray-900 py-2">
                                {profile.youtube_url ? (
                                  <a
                                    href={profile.youtube_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                  >
                                    {profile.youtube_url}
                                  </a>
                                ) : (
                                  'Not provided'
                                )}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="instagramUrl">
                              Instagram Profile
                            </Label>
                            {isEditing ? (
                              <div className="flex rounded-md">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                  https://
                                </span>
                                <Input
                                  id="instagramUrl"
                                  name="instagramUrl"
                                  value={formData.instagramUrl?.replace(
                                    /^https?:\/\//,
                                    ''
                                  )}
                                  onChange={handleInputChange}
                                  placeholder="instagram.com/..."
                                  className="rounded-l-none"
                                />
                              </div>
                            ) : (
                              <p className="text-gray-900 py-2">
                                {profile.instagram_url ? (
                                  <a
                                    href={profile.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                  >
                                    {profile.instagram_url}
                                  </a>
                                ) : (
                                  'Not provided'
                                )}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="tiktokUrl">TikTok Profile</Label>
                            {isEditing ? (
                              <div className="flex rounded-md">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                  https://
                                </span>
                                <Input
                                  id="tiktokUrl"
                                  name="tiktokUrl"
                                  value={formData.tiktokUrl?.replace(
                                    /^https?:\/\//,
                                    ''
                                  )}
                                  onChange={handleInputChange}
                                  placeholder="tiktok.com/@..."
                                  className="rounded-l-none"
                                />
                              </div>
                            ) : (
                              <p className="text-gray-900 py-2">
                                {profile.tiktok_url ? (
                                  <a
                                    href={profile.tiktok_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                  >
                                    {profile.tiktok_url}
                                  </a>
                                ) : (
                                  'Not provided'
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium">
                          Profile Settings
                        </h3>
                        <div className="mt-4 space-y-4">
                          <div className="flex items-start space-x-3">
                            {isEditing ? (
                              <Checkbox
                                id="isPublic"
                                checked={formData.isPublic}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(
                                    'isPublic',
                                    checked as boolean
                                  )
                                }
                              />
                            ) : (
                              <div
                                className={`w-4 h-4 mt-1 rounded-sm border ${
                                  profile.is_public
                                    ? 'bg-primary border-primary'
                                    : 'border-input'
                                }`}
                              >
                                {profile.is_public && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label
                                htmlFor="isPublic"
                                className="font-medium cursor-pointer"
                              >
                                Public Profile
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Make your profile visible to everyone
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            {isEditing ? (
                              <Checkbox
                                id="isCollaborated"
                                checked={formData.isCollaborated}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(
                                    'isCollaborated',
                                    checked as boolean
                                  )
                                }
                              />
                            ) : (
                              <div
                                className={`w-4 h-4 mt-1 rounded-sm border ${
                                  profile.is_collaborated
                                    ? 'bg-primary border-primary'
                                    : 'border-input'
                                }`}
                              >
                                {profile.is_collaborated && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label
                                htmlFor="isCollaborated"
                                className="font-medium cursor-pointer"
                              >
                                Open to Collaboration
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                Allow businesses to contact you for potential
                                collaborations
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isEditing && (
                    <>
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
