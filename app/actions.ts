/* eslint-disable @typescript-eslint/no-explicit-any */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Delete a user profile and associated data
 * Note: This requires admin privileges in Supabase. Make sure your service role key
 * has the necessary permissions if you want to use this action.
 */
export async function deleteProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to delete your profile');
  }

  try {
    // Delete profile from the database
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Delete storage files associated with the user
    const { error: storageError } = await supabase.storage
      .from('profile_photos')
      .remove([`${user.id}`]);

    if (storageError)
      console.error('Error deleting profile photos:', storageError);

    // Delete auth user (requires admin privileges)
    // Uncomment this if you have admin privileges:
    // const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    // if (authError) throw authError;

    // Sign out
    await supabase.auth.signOut();

    // Revalidate and redirect
    revalidatePath('/');
    redirect('/');
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/**
 * Update profile visibility settings
 */
export async function updateProfileVisibility(
  isPublic: boolean,
  isCollaborated: boolean
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to update your profile');
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_public: isPublic,
        is_collaborated: isCollaborated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    // Revalidate the profile page
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile visibility:', error);
    throw error;
  }
}

/**
 * Update basic profile information
 */
export async function updateProfileBasicInfo(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to update your profile');
  }

  try {
    // Get user profile to verify the user type
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const city = formData.get('city') as string;
    const country = formData.get('country') as string;
    const bio = formData.get('bio') as string;

    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }

    // Validate bio length for content creators
    if (profile.user_type === 'content_creator' && bio && bio.length > 500) {
      throw new Error('Bio must be less than 500 characters');
    }

    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber || null,
      city: city || null,
      country: country || null,
      updated_at: new Date().toISOString(),
    };

    // Only add bio field for content creators
    if (profile.user_type === 'content_creator') {
      updateData.bio = bio || null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (error) throw error;

    // Revalidate the profile page
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error updating profile basic info:', error);
    throw error;
  }
}

/**
 * Update social media links (for content creators)
 */
export async function updateSocialMediaLinks(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to update your profile');
  }

  try {
    // Get user profile to verify the user type
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Only content creators can update social media links
    if (profile.user_type !== 'content_creator') {
      throw new Error('Only content creators can update social media links');
    }

    const youtubeUrl = formData.get('youtubeUrl') as string;
    const instagramUrl = formData.get('instagramUrl') as string;
    const tiktokUrl = formData.get('tiktokUrl') as string;

    // Process URLs to ensure they have https:// prefix
    const processUrl = (url: string): string | null => {
      if (!url || url.trim() === '') return null;
      return url.startsWith('http') ? url : `https://${url}`;
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        youtube_url: processUrl(youtubeUrl),
        instagram_url: processUrl(instagramUrl),
        tiktok_url: processUrl(tiktokUrl),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;

    // Revalidate the profile page
    revalidatePath('/profile');

    return { success: true };
  } catch (error) {
    console.error('Error updating social media links:', error);
    throw error;
  }
}

/**
 * Update profile photo
 * Note: This action does not use FormData since it's designed to be called from client component
 * with a File object.
 */
export async function updateProfilePhoto(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file || !userId) {
    return { success: false, error: 'File and user ID are required' };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'Profile photo must be less than 5MB' };
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Profile photo must be JPG, PNG, or GIF' };
  }

  try {
    const supabase = await createClient();

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('profile_photos')
      .upload(filePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('profile_photos')
      .getPublicUrl(filePath);

    const profilePhotoUrl = urlData.publicUrl;

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_photo_url: profilePhotoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    // Revalidate the profile page
    revalidatePath('/profile');

    return { success: true, url: profilePhotoUrl };
  } catch (error: any) {
    console.error('Error updating profile photo:', error);
    return {
      success: false,
      error: error.message || 'Failed to update profile photo',
    };
  }
}

/* TEMPORARILY DISABLED - Password reset functions
export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address' };
  }

  try {
    const supabase = await createClient();
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error in forgotPassword action:', error);
    return { error: error.message || 'An error occurred. Please try again.' };
  }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    return { error: 'Password should be at least 8 characters long' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) throw error;

    redirect('/auth?reset=success');
  } catch (error: any) {
    console.error('Error in resetPassword action:', error);
    return { error: error.message || 'An error occurred. Please try again.' };
  }
}
END TEMPORARILY DISABLED */
