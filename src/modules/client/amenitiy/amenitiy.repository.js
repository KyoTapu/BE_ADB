class AmenitiyRepository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "amenitiy",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const amenitiyRepository = new AmenitiyRepository();
