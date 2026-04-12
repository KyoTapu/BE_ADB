class UserRepository {
  constructor() {
    this.users = [
      {
        id: 1,
        email: "admin1@example.com",
        full_name: "Admin One",
        role: "admin",
        status: "active",
        created_at: "2026-01-10T08:00:00.000Z",
        updated_at: "2026-04-01T09:00:00.000Z",
      },
      {
        id: 2,
        email: "admin2@example.com",
        full_name: "Admin Two",
        role: "admin",
        status: "inactive",
        created_at: "2026-02-12T10:00:00.000Z",
        updated_at: "2026-04-05T10:15:00.000Z",
      },
    ];
  }

  async findById(id) {
    // TODO: Replace with real DB query (SELECT ... WHERE id = ?).
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findAll() {
    return this.users;
  }
}

export const userRepository = new UserRepository();
