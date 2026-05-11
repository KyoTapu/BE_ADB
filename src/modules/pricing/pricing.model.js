export const pricingModel = {
  moduleName: "pricing",
  routePath: "/api/pricing",
};

export const enumerateStayDates = (checkIn, checkOut) => {
  const dates = [];
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  while (startDate < endDate) {
    dates.push(startDate.toISOString().slice(0, 10));
    startDate.setUTCDate(startDate.getUTCDate() + 1);
  }

  return dates;
};

export const getWeekendFactor = (dates = []) => {
  const hasWeekend = dates.some((value) => {
    const day = new Date(value).getUTCDay();
    return day === 5 || day === 6;
  });

  return hasWeekend ? 1.05 : 1;
};

export const getOccupancyFactor = (occupancyPercent = 0) => {
  if (occupancyPercent >= 90) return 1.2;
  if (occupancyPercent >= 75) return 1.1;
  if (occupancyPercent >= 60) return 1.05;
  return 1;
};

export const getLosDiscount = (nightCount = 0, subtotal = 0) => {
  if (nightCount >= 7) return subtotal * 0.1;
  if (nightCount >= 4) return subtotal * 0.05;
  return 0;
};
