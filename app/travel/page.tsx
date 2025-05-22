// app/travel/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TravelScheduleManagement from '@/components/TravelScheduleManagement';

export default function TravelPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth');
      } else if (profile && profile.user_type !== 'content_creator') {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile || profile.user_type !== 'content_creator') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TravelScheduleManagement />
    </div>
  );
}
