class HotelsRepository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "hotels",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const hotelsRepository = new HotelsRepository();
