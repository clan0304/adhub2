/* eslint-disable @typescript-eslint/no-explicit-any */
// components/TravelScheduleManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getData } from 'country-list';
import {
  TravelSchedule,
  TravelScheduleFormData,
  CountryOption,
} from '@/types/travel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Calendar,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Plane,
  Loader2,
  Clock,
  Info,
} from 'lucide-react';

export default function TravelScheduleManagement() {
  const { profile } = useAuth();
  const [travelSchedules, setTravelSchedules] = useState<TravelSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TravelSchedule | null>(
    null
  );
  const [formData, setFormData] = useState<TravelScheduleFormData>({
    start_date: '',
    end_date: '',
    city: '',
    country: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  // Load countries
  useEffect(() => {
    try {
      const countryData = getData();
      const modifiedCountries = countryData.map((country) => {
        if (country.code === 'TW') {
          return { ...country, name: 'Taiwan' };
        }
        return country;
      });
      modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));
      setCountries(modifiedCountries);
    } catch (error) {
      console.error('Error loading countries:', error);
      setCountries([]);
    }
  }, []);

  // Fetch travel schedules
  useEffect(() => {
    const fetchTravelSchedules = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('travel_schedules')
          .select('*')
          .eq('profile_id', profile.id)
          .order('start_date', { ascending: true });

        if (error) throw error;
        setTravelSchedules(data || []);
      } catch (err: any) {
        console.error('Error fetching travel schedules:', err);
        setError(err.message || 'Failed to load travel schedules');
      } finally {
        setLoading(false);
      }
    };

    fetchTravelSchedules();
  }, [profile?.id, supabase]);

  // Cleanup expired schedules on component mount
  useEffect(() => {
    const cleanupExpiredSchedules = async () => {
      if (!profile?.id) return;

      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { error } = await supabase
          .from('travel_schedules')
          .delete()
          .eq('profile_id', profile.id)
          .lt('end_date', yesterday.toISOString().split('T')[0]);

        if (error) {
          console.error('Error cleaning up expired schedules:', error);
        }
      } catch (err) {
        console.error('Error in cleanup:', err);
      }
    };

    cleanupExpiredSchedules();
  }, [profile?.id, supabase]);

  const handleInputChange = (
    field: keyof TravelScheduleFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    setError(null);

    if (
      !formData.start_date ||
      !formData.end_date ||
      !formData.city ||
      !formData.country
    ) {
      setError('All fields are required');
      return false;
    }

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      setError('Start date cannot be in the past');
      return false;
    }

    if (endDate < startDate) {
      setError('End date must be after start date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !validateForm()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingSchedule) {
        // Update existing schedule
        const { error } = await supabase
          .from('travel_schedules')
          .update({
            start_date: formData.start_date,
            end_date: formData.end_date,
            city: formData.city,
            country: formData.country,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchedule.id);

        if (error) throw error;

        setTravelSchedules((prev) =>
          prev.map((schedule) =>
            schedule.id === editingSchedule.id
              ? {
                  ...schedule,
                  ...formData,
                  updated_at: new Date().toISOString(),
                }
              : schedule
          )
        );
        setSuccess('Travel schedule updated successfully!');
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from('travel_schedules')
          .insert({
            profile_id: profile.id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            city: formData.city,
            country: formData.country,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setTravelSchedules((prev) =>
            [...prev, data].sort(
              (a, b) =>
                new Date(a.start_date).getTime() -
                new Date(b.start_date).getTime()
            )
          );
          setSuccess('Travel schedule added successfully!');
        }
      }

      handleCancelForm();
    } catch (err: any) {
      console.error('Error saving travel schedule:', err);
      setError(err.message || 'Failed to save travel schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (schedule: TravelSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      city: schedule.city,
      country: schedule.country,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this travel schedule?'))
      return;

    try {
      const { error } = await supabase
        .from('travel_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      setTravelSchedules((prev) =>
        prev.filter((schedule) => schedule.id !== scheduleId)
      );
      setSuccess('Travel schedule deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting travel schedule:', err);
      setError(err.message || 'Failed to delete travel schedule');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData({
      start_date: '',
      end_date: '',
      city: '',
      country: '',
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isActive = (schedule: TravelSchedule) => {
    const today = new Date();
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);

    // Show as active from 30 days before start date until end date
    const showFromDate = new Date(startDate);
    showFromDate.setDate(showFromDate.getDate() - 30);

    return today >= showFromDate && today <= endDate;
  };

  const getScheduleStatus = (schedule: TravelSchedule) => {
    const today = new Date();
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);
    const showFromDate = new Date(startDate);
    showFromDate.setDate(showFromDate.getDate() - 30);

    if (today < showFromDate) {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        color: 'text-blue-600 bg-blue-50',
      };
    } else if (today >= showFromDate && today < startDate) {
      return {
        status: 'visible',
        label: 'Visible in Search',
        color: 'text-green-600 bg-green-50',
      };
    } else if (today >= startDate && today <= endDate) {
      return {
        status: 'active',
        label: 'Currently Traveling',
        color: 'text-orange-600 bg-orange-50',
      };
    } else {
      return {
        status: 'expired',
        label: 'Completed',
        color: 'text-gray-600 bg-gray-50',
      };
    }
  };

  if (!profile || profile.user_type !== 'content_creator') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Travel schedule management is only available for content creators.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-indigo-600" />
            Travel Schedule Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your travel plans to appear in location-based searches
          </p>
        </div>

        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Travel Plan
          </Button>
        )}
      </div>

      {/* Info Alert */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Your profile will be highlighted in location searches from{' '}
          <strong>one month before</strong> your trip starts until your trip
          ends. Travel data is automatically removed one day after your trip
          ends.
        </AlertDescription>
      </Alert>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingSchedule
                ? 'Edit Travel Schedule'
                : 'Add New Travel Schedule'}
            </CardTitle>
            <CardDescription>
              Add your travel plans to be discovered by users searching in your
              destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      handleInputChange('start_date', e.target.value)
                    }
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      handleInputChange('end_date', e.target.value)
                    }
                    min={
                      formData.start_date ||
                      new Date().toISOString().split('T')[0]
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Paris, Tokyo, New York"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingSchedule ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>{editingSchedule ? 'Update Schedule' : 'Add Schedule'}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Travel Schedules List */}
      {travelSchedules.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No travel plans yet
            </h3>
            <p className="text-gray-600 mb-4">
              Add your first travel schedule to appear in location-based
              searches
            </p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Trip
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {travelSchedules.map((schedule) => {
            const scheduleStatus = getScheduleStatus(schedule);
            return (
              <Card
                key={schedule.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-indigo-600" />
                          <h3 className="text-lg font-semibold">
                            {schedule.city}, {schedule.country}
                          </h3>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${scheduleStatus.color}`}
                        >
                          {scheduleStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {formatDate(schedule.start_date)} -{' '}
                            {formatDate(schedule.end_date)}
                          </span>
                        </div>
                        {isActive(schedule) && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Clock className="h-4 w-4" />
                            <span>Visible in search results</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
