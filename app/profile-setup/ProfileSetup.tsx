'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UserTypeSelection from '@/components/ui/UserTypeSelection';
import ProfileForm from '@/components/ui/ProfileForm';
import { UserType } from '@/types';

interface ProfileSetupProps {
  userId: string;
  initialUsername?: string;
}

export default function ProfileSetup({
  userId,
  initialUsername = '',
}: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const router = useRouter();

  const handleUserTypeSelected = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleProfileComplete = () => {
    // Redirect to home page after successful profile completion
    router.push('/');
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-center mb-6">
        Complete Your Profile
      </h1>

      {step === 1 && <UserTypeSelection onSelect={handleUserTypeSelected} />}

      {step === 2 && userType && (
        <ProfileForm
          userType={userType}
          userId={userId}
          initialUsername={initialUsername}
          onComplete={handleProfileComplete}
        />
      )}

      <div className="flex justify-center">
        <div className="flex space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${
              step === 1 ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          />
          <div
            className={`h-2 w-2 rounded-full ${
              step === 2 ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
