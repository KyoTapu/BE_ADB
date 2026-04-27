class AmenitiesRepository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "amenities",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const amenitiesRepository = new AmenitiesRepository();
