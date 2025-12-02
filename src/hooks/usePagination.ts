/**
 * usePagination Hook
 * Reusable pagination logic untuk lists
 */

import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions<T> {
  data: T[];
  itemsPerPage?: number;
  initialPage?: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
}

export function usePagination<T>({
  data,
  itemsPerPage = 10,
  initialPage = 1,
}: UsePaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Reset to first page when data changes
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Pagination info
  const paginationInfo: PaginationState = {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
  };

  // Range info
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  return {
    // Data
    paginatedData,
    
    // State
    ...paginationInfo,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    
    // Actions
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    reset,
    setCurrentPage,
  };
}

