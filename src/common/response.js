export const sendSuccess = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

export const sendError = (res, error) => {
  const status = error?.status || 500;
  const message = error?.message || "Internal server error";

  return res.status(status).json({
    success: false,
    error: {
      message,
      code: error?.code || null,
      details: error?.details || null,
    },
  });
};
