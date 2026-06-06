export interface ParsedQuery {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  filters: Record<string, any>;
}

/**
 * Utility to parse standard Express query parameters into Prisma query parameters.
 */
export const parseQueryParams = (query: any, allowedFilters: string[] = []): ParsedQuery => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const search = query.search ? String(query.search).trim() : undefined;

  const filters: Record<string, any> = {};
  allowedFilters.forEach((key) => {
    if (query[key] !== undefined && query[key] !== '') {
      let val = query[key];
      // Convert boolean strings
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      // Convert number strings if numeric
      if (!isNaN(Number(val)) && typeof val === 'string' && val.trim() !== '') {
        val = Number(val);
      }
      filters[key] = val;
    }
  });

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
    filters,
  };
};

/**
 * Standard pagination response wrapper
 */
export const formatPaginatedResponse = <T>(
  data: T[],
  total: number,
  parsedQuery: ParsedQuery
) => {
  const totalPages = Math.ceil(total / parsedQuery.limit);
  return {
    items: data,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: parsedQuery.page,
      limit: parsedQuery.limit,
      hasNextPage: parsedQuery.page < totalPages,
      hasPrevPage: parsedQuery.page > 1,
    },
  };
};
