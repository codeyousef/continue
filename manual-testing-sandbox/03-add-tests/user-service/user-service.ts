// User service implementation - needs full test coverage

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "moderator";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role?: "admin" | "user" | "moderator";
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: "admin" | "user" | "moderator";
  isActive?: boolean;
}

export interface UserFilters {
  role?: "admin" | "user" | "moderator";
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Simulated database
const users: Map<string, User> = new Map();

export class UserService {
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async create(input: CreateUserInput): Promise<User> {
    // Validation
    if (!input.email || !input.email.trim()) {
      throw new Error("Email is required");
    }
    if (!this.validateEmail(input.email)) {
      throw new Error("Invalid email format");
    }
    if (!input.name || !input.name.trim()) {
      throw new Error("Name is required");
    }
    if (input.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    // Check for duplicate email
    const existingUser = Array.from(users.values()).find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const now = new Date();
    const user: User = {
      id: this.generateId(),
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      role: input.role || "user",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      Array.from(users.values()).find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      ) || null
    );
  }

  async findAll(
    filters?: UserFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    let result = Array.from(users.values());

    // Apply filters
    if (filters) {
      if (filters.role) {
        result = result.filter((u) => u.role === filters.role);
      }
      if (filters.isActive !== undefined) {
        result = result.filter((u) => u.isActive === filters.isActive);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(
          (u) =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search),
        );
      }
    }

    const total = result.length;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);

    return { data: result, total, page, totalPages };
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = users.get(id);
    if (!user) {
      throw new Error("User not found");
    }

    if (input.email !== undefined) {
      if (!input.email.trim()) {
        throw new Error("Email cannot be empty");
      }
      if (!this.validateEmail(input.email)) {
        throw new Error("Invalid email format");
      }
      // Check for duplicate (excluding current user)
      const existingUser = Array.from(users.values()).find(
        (u) =>
          u.email.toLowerCase() === input.email!.toLowerCase() && u.id !== id,
      );
      if (existingUser) {
        throw new Error("Email already exists");
      }
      user.email = input.email.toLowerCase().trim();
    }

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new Error("Name cannot be empty");
      }
      if (input.name.length < 2) {
        throw new Error("Name must be at least 2 characters");
      }
      user.name = input.name.trim();
    }

    if (input.role !== undefined) {
      user.role = input.role;
    }

    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    user.updatedAt = new Date();
    users.set(id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const user = users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    return users.delete(id);
  }

  async softDelete(id: string): Promise<User> {
    return this.update(id, { isActive: false });
  }

  async count(filters?: UserFilters): Promise<number> {
    const result = await this.findAll(filters);
    return result.total;
  }

  // For testing - clear all users
  async _clearAll(): Promise<void> {
    users.clear();
  }
}
