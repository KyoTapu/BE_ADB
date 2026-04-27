class FacilitiesRepository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "facilities",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const facilitiesRepository = new FacilitiesRepository();
