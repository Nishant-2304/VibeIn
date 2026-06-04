/**
 * Pagination Utility
 * Handles pagination logic and calculations
 */

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  skip: number;
}

/**
 * Calculate pagination
 */
export function calculatePagination(
  page: number = 1,
  limit: number = 10,
  total: number = 0
): PaginationResult {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    total,
    totalPages,
    skip,
  };
}

/**
 * Validate pagination params
 */
export function validatePaginationParams(page: any, limit: any) {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 10;

  page = Math.max(1, page);
  limit = Math.max(1, Math.min(100, limit));

  return { page, limit };
}
