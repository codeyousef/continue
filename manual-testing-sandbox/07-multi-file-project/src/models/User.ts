// User model - core entity used across the application

export type UserRole = "customer" | "admin" | "vendor";

export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: "credit_card" | "paypal" | "bank_account";
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  loyaltyPoints: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
}

export function getFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export function isActiveUser(user: User): boolean {
  return user.status === "active";
}

export function canPurchase(user: User): boolean {
  return user.status === "active" && user.role !== "vendor";
}

export function getDefaultAddress(user: User): Address | undefined {
  return user.addresses.find((addr) => addr.isDefault);
}

export function getDefaultPaymentMethod(user: User): PaymentMethod | undefined {
  return user.paymentMethods.find((pm) => pm.isDefault);
}
