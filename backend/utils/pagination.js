export const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const formatPaginatedResponse = (data, total, page, limit) => {
  const pages = Math.ceil(total / limit) || 1;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  };
};
