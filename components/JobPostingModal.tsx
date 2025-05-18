/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { JobPosting } from '@/types/findwork';
import { X } from 'lucide-react';

export interface JobPostingFormData {
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
}

interface JobPostingModalProps {
  onClose: () => void;
  onCreate: (jobData: JobPostingFormData) => Promise<void>;
  initialData: JobPosting | null;
}

export default function JobPostingModal({
  onClose,
  onCreate,
  initialData,
}: JobPostingModalProps) {
  const [formData, setFormData] = useState<JobPostingFormData>({
    title: '',
    description: '',
    has_deadline: false,
    deadline_date: null,
    deadline_time: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If initialData is provided, we're in edit mode
  const isEditMode = !!initialData;

  // Initialize form with existing data if in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        has_deadline: initialData.has_deadline,
        deadline_date: initialData.deadline_date,
        deadline_time: initialData.deadline_time,
      });
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate form
    if (!formData.title.trim()) {
      setError('Job title is required');
      setIsSubmitting(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Job description is required');
      setIsSubmitting(false);
      return;
    }

    // If has_deadline is true, validate deadline fields
    if (formData.has_deadline) {
      if (!formData.deadline_date) {
        setError('Deadline date is required');
        setIsSubmitting(false);
        return;
      }

      // Check if deadline is in the past
      const deadlineDate = new Date(formData.deadline_date);

      if (formData.deadline_time) {
        const [hours, minutes] = formData.deadline_time.split(':').map(Number);
        deadlineDate.setHours(hours, minutes);
      } else {
        deadlineDate.setHours(23, 59, 59);
      }

      if (deadlineDate < new Date()) {
        setError('Deadline cannot be in the past');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await onCreate(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Edit Job Posting' : 'Create Job Posting'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title field */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Looking for a YouTube content creator"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Description field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              placeholder="Describe what you're looking for, requirements, compensation details, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            ></textarea>
          </div>

          {/* Deadline toggle */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="has_deadline"
                name="has_deadline"
                checked={formData.has_deadline}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label
                htmlFor="has_deadline"
                className="font-medium text-gray-700"
              >
                Set a deadline for applications
              </label>
              <p className="text-gray-500">
                Specify when creators should apply by
              </p>
            </div>
          </div>

          {/* Deadline fields - only show if has_deadline is true */}
          {formData.has_deadline && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="deadline_date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deadline Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="deadline_date"
                  name="deadline_date"
                  value={formData.deadline_date || ''}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]} // Today's date as minimum
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required={formData.has_deadline}
                />
              </div>
              <div>
                <label
                  htmlFor="deadline_time"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Deadline Time{' '}
                  <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="time"
                  id="deadline_time"
                  name="deadline_time"
                  value={formData.deadline_time || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
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
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : isEditMode ? (
                'Update Job Posting'
              ) : (
                'Create Job Posting'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
