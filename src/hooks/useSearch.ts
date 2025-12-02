/**
 * useSearch Hook
 * Reusable search and filter logic
 */

import { useState, useMemo, useCallback } from 'react';

interface UseSearchOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  initialQuery?: string;
  caseSensitive?: boolean;
}

interface UseFilterOptions<T> {
  data: T[];
  filters: Record<string, (item: T) => boolean>;
}

/**
 * Hook untuk search dengan multiple fields
 */
export function useSearch<T extends Record<string, any>>({
  data,
  searchFields,
  initialQuery = '',
  caseSensitive = false,
}: UseSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const fieldsToSearch = searchFields || (Object.keys(data[0] || {}) as (keyof T)[]);

    return data.filter((item) => {
      return fieldsToSearch.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        
        const stringValue = String(value);
        const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase();
        return searchValue.includes(query);
      });
    });
  }, [data, searchQuery, searchFields, caseSensitive]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    clearSearch,
    resultCount: filteredData.length,
  };
}

/**
 * Hook untuk multiple filters
 */
export function useFilters<T>({
  data,
  filters,
}: UseFilterOptions<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({});

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, filterFn]) => {
        // If filter is not active, include item
        if (!activeFilters[key]) return true;
        
        // Apply filter function
        return filterFn(item);
      });
    });
  }, [data, filters, activeFilters]);

  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  }, []);

  const setFilter = useCallback((filterKey: string, value: boolean) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return {
    filteredData,
    activeFilters,
    toggleFilter,
    setFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  };
}

/**
 * Combined search and filter hook
 */
export function useSearchAndFilter<T extends Record<string, any>>({
  data,
  searchFields,
  initialQuery = '',
  filters = {},
}: UseSearchOptions<T> & { filters?: Record<string, (item: T) => boolean> }) {
  const search = useSearch({ data, searchFields, initialQuery });
  const filter = useFilters({ data: search.filteredData, filters });

  return {
    ...search,
    ...filter,
    // Final filtered data (search then filter)
    finalData: filter.filteredData,
  };
}

