/* eslint-disable @typescript-eslint/no-explicit-any */
// app/actions/travel.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTravelSchedule(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to create travel schedules');
  }

  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;

  if (!startDate || !endDate || !city || !country) {
    throw new Error('All fields are required');
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }

  if (end < start) {
    throw new Error('End date must be after start date');
  }

  try {
    const { data, error } = await supabase
      .from('travel_schedules')
      .insert({
        profile_id: user.id,
        start_date: startDate,
        end_date: endDate,
        city: city,
        country: country,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/travel');
    revalidatePath('/creators');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating travel schedule:', error);
    throw new Error(error.message || 'Failed to create travel schedule');
  }
}

export async function updateTravelSchedule(
  scheduleId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to update travel schedules');
  }

  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;
  const city = formData.get('city') as string;
  const country = formData.get('country') as string;

  if (!startDate || !endDate || !city || !country) {
    throw new Error('All fields are required');
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    throw new Error('Start date cannot be in the past');
  }

  if (end < start) {
    throw new Error('End date must be after start date');
  }

  try {
    const { data, error } = await supabase
      .from('travel_schedules')
      .update({
        start_date: startDate,
        end_date: endDate,
        city: city,
        country: country,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .eq('profile_id', user.id) // Ensure user can only update their own schedules
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/travel');
    revalidatePath('/creators');
    return { success: true, data };
  } catch (error: any) {
    console.error('Error updating travel schedule:', error);
    throw new Error(error.message || 'Failed to update travel schedule');
  }
}

export async function deleteTravelSchedule(scheduleId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error('You must be logged in to delete travel schedules');
  }

  try {
    const { error } = await supabase
      .from('travel_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('profile_id', user.id); // Ensure user can only delete their own schedules

    if (error) throw error;

    revalidatePath('/travel');
    revalidatePath('/creators');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting travel schedule:', error);
    throw new Error(error.message || 'Failed to delete travel schedule');
  }
}

export async function cleanupExpiredTravelSchedules() {
  const supabase = await createClient();

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { error } = await supabase
      .from('travel_schedules')
      .delete()
      .lt('end_date', yesterday.toISOString().split('T')[0]);

    if (error) throw error;

    revalidatePath('/creators');
    return { success: true };
  } catch (error: any) {
    console.error('Error cleaning up expired travel schedules:', error);
    throw new Error(error.message || 'Failed to cleanup expired schedules');
  }
}
