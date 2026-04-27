const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const toPositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
};

export const parsePagination = (query, options = {}) => {
  const defaultPage = options.defaultPage ?? DEFAULT_PAGE;
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT;
  const maxLimit = options.maxLimit ?? MAX_LIMIT;

  const rawPage = query?.page;
  const rawLimit = query?.limit;

  const parsedPage = rawPage === undefined ? defaultPage : toPositiveInt(rawPage);
  const parsedLimit =
    rawLimit === undefined ? defaultLimit : toPositiveInt(rawLimit);

  if (!parsedPage || !parsedLimit) {
    const error = new Error("Invalid pagination params");
    error.status = 400;
    error.code = "INVALID_PAGINATION";
    error.details = {
      page: rawPage ?? null,
      limit: rawLimit ?? null,
    };
    throw error;
  }

  const limit = Math.min(parsedLimit, maxLimit);
  const page = parsedPage;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
};

