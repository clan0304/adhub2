'use client';

import { CountryOption } from '@/types/findwork';
import { Search, X } from 'lucide-react';

interface FilterSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  countries: CountryOption[];
  showOnlySaved: boolean;
  toggleSavedFilter: () => void;
  showMyPostingsOnly: boolean;
  toggleMyPostingsFilter: () => void;
  clearFilters: () => void;
  isContentCreator: boolean;
  isBusinessOwner: boolean;
  myPostingsCount: number;
  filteredCount: number;
  totalCount: number;
}

export function FilterSection({
  searchQuery,
  setSearchQuery,
  selectedCountry,
  setSelectedCountry,
  countries,
  showOnlySaved,
  toggleSavedFilter,
  showMyPostingsOnly,
  toggleMyPostingsFilter,
  clearFilters,
  isContentCreator,
  isBusinessOwner,
  myPostingsCount,
  filteredCount,
  totalCount,
}: FilterSectionProps) {
  const hasActiveFilters =
    searchQuery || selectedCountry || showOnlySaved || showMyPostingsOnly;

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search bar */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
            />
          </div>
        </div>

        {/* Country filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
          >
            <option value="">All Countries</option>
            {countries.map((country) => (
              <option key={country.code} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle filters */}
        <div className="space-x-2 flex items-center">
          {isContentCreator && (
            <button
              onClick={toggleSavedFilter}
              className={`px-3 py-1 text-sm rounded-full ${
                showOnlySaved
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              Saved
            </button>
          )}

          {isBusinessOwner && myPostingsCount > 0 && (
            <button
              onClick={toggleMyPostingsFilter}
              className={`px-3 py-1 text-sm rounded-full ${
                showMyPostingsOnly
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              My Postings ({myPostingsCount})
            </button>
          )}
        </div>

        {/* Clear filters button - only show if filters are active */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter stats */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredCount} of {totalCount} job postings
        {selectedCountry && ` in ${selectedCountry}`}
        {searchQuery && ` matching "${searchQuery}"`}
        {showOnlySaved && ' that you saved'}
        {showMyPostingsOnly && ' that you posted'}
      </div>
    </div>
  );
}
