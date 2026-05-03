const normalizeDateKey = (dateValue) => new Date(dateValue).toISOString().split("T")[0];

export const generateStayDates = (checkIn, checkOut) => {
  const dates = [];
  const current = new Date(checkIn);
  const last = new Date(checkOut);

  while (current < last) {
    dates.push(normalizeDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const getServiceQuantity = (pricingType, nights, guestCount) => {
  switch (pricingType) {
    case "per_guest_per_night":
      return nights * guestCount;
    case "per_guest":
    case "per_person":
      return guestCount;
    case "per_night":
      return nights;
    case "per_use":
    case "per_stay":
    default:
      return 1;
  }
};

export const buildRoomTypeNightlyRates = ({
  roomType,
  stayDates,
  seasonalPricing = [],
  specialDatePricing = [],
}) => {
  const basePrice = Number(roomType.basePrice ?? roomType.room_type_base_price ?? 0);
  const seasonalMap = seasonalPricing.map((rule) => ({
    startDate: normalizeDateKey(rule.start_date ?? rule.startDate),
    endDate: normalizeDateKey(rule.end_date ?? rule.endDate),
    multiplier: Number(rule.multiplier) || 1,
  }));
  const specialMap = new Map(
    specialDatePricing.map((rule) => [
      normalizeDateKey(rule.specific_date ?? rule.specificDate),
      Number(rule.specific_rate ?? rule.specificRate) || 0,
    ]),
  );

  return stayDates.map((date) => {
    const specialRate = specialMap.get(date);
    if (specialRate) {
      return {
        date,
        rate: specialRate,
        source: "special_date",
      };
    }

    const seasonalRule = seasonalMap.find(
      (rule) => date >= rule.startDate && date <= rule.endDate,
    );
    const multiplier = seasonalRule?.multiplier || 1;

    return {
      date,
      rate: Math.round(basePrice * multiplier),
      source: seasonalRule ? "seasonal" : "base",
    };
  });
};

export const buildServiceQuote = (service, nights, guestCount) => {
  const unitPrice = Number(service.price ?? service.service_price ?? service.facility_price ?? 0);
  const pricingType = String(service.pricingType ?? service.pricing_type ?? "per_use");
  const quantity = getServiceQuantity(pricingType, nights, guestCount);

  return {
    id: service.id ?? service.service_id,
    name: service.name ?? service.service_name ?? service.facility_name,
    pricingType,
    unitPrice,
    quantity,
    total: unitPrice * quantity,
  };
};
