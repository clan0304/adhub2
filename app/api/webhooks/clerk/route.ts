import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  // Create Supabase client with SERVICE ROLE key (not anon key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    if (eventType === 'user.created') {
      const { email_addresses, first_name, last_name, image_url } = evt.data;

      const primaryEmail = email_addresses?.[0]?.email_address;
      if (!primaryEmail) {
        console.error('No email found for user');
        return new Response('No email found', { status: 400 });
      }

      // Generate a safe username
      const emailUsername = primaryEmail.split('@')[0] || 'user';
      const baseUsername = emailUsername
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .substring(0, 15); // Limit length

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeUsername = `${baseUsername}_${randomSuffix}`;

      console.log('Creating profile for user:', id);
      console.log('Generated username:', safeUsername);

      // Insert profile into Supabase using service role
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id, // Clerk user ID
          username: safeUsername,
          first_name: first_name || '',
          last_name: last_name || '',
          email: primaryEmail,
          profile_photo_url: image_url || null,
          is_profile_completed: false,
          user_type: 'content_creator', // Default
          is_public: false,
          is_collaborated: false,
        })
        .select();

      if (error) {
        console.error('Error creating profile:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return new Response(`Error creating profile: ${error.message}`, {
          status: 500,
        });
      }

      console.log('Profile created successfully:', data);
    }

    if (eventType === 'user.updated') {
      const { email_addresses, first_name, last_name, image_url } = evt.data;

      console.log('Updating profile for user:', id);

      // Define proper interface for update data
      interface ProfileUpdateData {
        updated_at: string;
        first_name?: string;
        last_name?: string;
        profile_photo_url?: string | null;
        email?: string;
      }

      const updateData: ProfileUpdateData = {
        updated_at: new Date().toISOString(),
      };

      if (first_name !== undefined) updateData.first_name = first_name || '';
      if (last_name !== undefined) updateData.last_name = last_name || '';
      if (image_url !== undefined) updateData.profile_photo_url = image_url;
      if (email_addresses?.[0]?.email_address) {
        updateData.email = email_addresses[0].email_address;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating profile:', error);
        return new Response(`Error updating profile: ${error.message}`, {
          status: 500,
        });
      }

      console.log('Profile updated successfully');
    }

    if (eventType === 'user.deleted') {
      console.log('Deleting profile for user:', id);

      const { error } = await supabase.from('profiles').delete().eq('id', id);

      if (error) {
        console.error('Error deleting profile:', error);
        return new Response(`Error deleting profile: ${error.message}`, {
          status: 500,
        });
      }

      console.log('Profile deleted successfully');
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(`Internal server error: ${error}`, { status: 500 });
  }
}
