class PricingRepository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "pricing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const pricingRepository = new PricingRepository();
