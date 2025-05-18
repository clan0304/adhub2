// File: /app/profile-setup/ProfileSetup.tsx
'use client';

import { useState } from 'react';
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

  const handleUserTypeSelected = (type: UserType) => {
    setUserType(type);
    setStep(2);
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
        />
      )}

      <div className="flex justify-center">
        <div className="flex space-x-2">
          <div
            className={`h-2 w-2 rounded-full ${
              step === 1 ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          ></div>
          <div
            className={`h-2 w-2 rounded-full ${
              step === 2 ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
