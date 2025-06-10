'use client';

import { useState } from 'react';
import { UserType } from '@/types';

interface UserTypeSelectionProps {
  onSelect: (type: UserType) => void;
}

export default function UserTypeSelection({
  onSelect,
}: UserTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);

  // This function ONLY sets the selected type, does NOT call onSelect
  const handleOptionClick = (type: UserType) => {
    setSelectedType(type);
  };

  // This function is called ONLY when Continue button is clicked
  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        Choose your account type
      </h2>

      <div className="space-y-4">
        <div
          onClick={() => handleOptionClick('content_creator')}
          className={`p-6 border rounded-lg cursor-pointer transition ${
            selectedType === 'content_creator'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'content_creator'
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-gray-300'
              }`}
            >
              {selectedType === 'content_creator' && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">Content Creator</h3>
              <p className="text-gray-500 text-sm">
                For creators who want to share their content and collaborate.
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleOptionClick('business_owner')}
          className={`p-6 border rounded-lg cursor-pointer transition ${
            selectedType === 'business_owner'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          <div className="flex items-center">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedType === 'business_owner'
                  ? 'border-indigo-600 bg-indigo-600'
                  : 'border-gray-300'
              }`}
            >
              {selectedType === 'business_owner' && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium">Business Owner</h3>
              <p className="text-gray-500 text-sm">
                For businesses looking to grow their online presence.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            selectedType
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
