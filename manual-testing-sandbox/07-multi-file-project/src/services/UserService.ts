// UserService - business logic for user operations

import {
  Address,
  CreateUserInput,
  PaymentMethod,
  UpdateUserInput,
  User,
  isActiveUser,
} from "../models/User";
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
  verifyPassword,
} from "../utils/validators";

// Simulated database
const users: Map<string, User> = new Map();

export class UserService {
  async create(input: CreateUserInput): Promise<User> {
    // Validation
    if (!isValidEmail(input.email)) {
      throw new Error("Invalid email format");
    }
    if (!isValidPassword(input.password)) {
      throw new Error(
        "Password must be at least 8 characters with a number and special character",
      );
    }

    // Check for existing user
    const existing = await this.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const now = new Date();
    const user: User = {
      id: `user_${Date.now()}`,
      email: input.email.toLowerCase(),
      passwordHash: hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role || "customer",
      status: "pending_verification",
      addresses: [],
      paymentMethods: [],
      loyaltyPoints: 0,
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
    for (const user of users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    if (!verifyPassword(password, user.passwordHash)) {
      return null;
    }

    if (!isActiveUser(user)) {
      throw new Error("Account is not active");
    }

    // Update last login
    user.lastLoginAt = new Date();
    users.set(user.id, user);

    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.status !== undefined) user.status = input.status;

    user.updatedAt = new Date();
    users.set(id, user);

    return user;
  }

  async addAddress(
    userId: string,
    address: Omit<Address, "isDefault">,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isFirst = user.addresses.length === 0;
    user.addresses.push({ ...address, isDefault: isFirst });
    user.updatedAt = new Date();
    users.set(userId, user);

    return user;
  }

  async setDefaultAddress(userId: string, addressIndex: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (addressIndex < 0 || addressIndex >= user.addresses.length) {
      throw new Error("Invalid address index");
    }

    user.addresses.forEach((addr, i) => {
      addr.isDefault = i === addressIndex;
    });
    user.updatedAt = new Date();
    users.set(userId, user);

    return user;
  }

  async addPaymentMethod(
    userId: string,
    payment: Omit<PaymentMethod, "id" | "isDefault">,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isFirst = user.paymentMethods.length === 0;
    user.paymentMethods.push({
      ...payment,
      id: `pm_${Date.now()}`,
      isDefault: isFirst,
    });
    user.updatedAt = new Date();
    users.set(userId, user);

    return user;
  }

  async addLoyaltyPoints(userId: string, points: number): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.loyaltyPoints += points;
    user.updatedAt = new Date();
    users.set(userId, user);

    return user;
  }

  async delete(id: string): Promise<boolean> {
    return users.delete(id);
  }
}

export const userService = new UserService();
