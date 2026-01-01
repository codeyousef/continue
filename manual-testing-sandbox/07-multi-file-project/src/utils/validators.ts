// Validators - shared validation utilities

import * as crypto from "crypto";

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, one number, one special character
  if (password.length < 8) return false;
  if (!/\d/.test(password)) return false;
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
  return true;
}

export function hashPassword(password: string): string {
  // In production, use bcrypt
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === originalHash;
}

export function isValidCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const digits = cardNumber.replace(/[\s-]/g, "");

  // Check length and digits only
  if (!/^\d{13,19}$/.test(digits)) return false;

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export function isValidZipCode(zipCode: string, country: string): boolean {
  const patterns: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
  };

  const pattern = patterns[country];
  return pattern ? pattern.test(zipCode) : zipCode.length > 0;
}

export function isValidPhoneNumber(phone: string): boolean {
  // Remove common formatting characters
  const digits = phone.replace(/[\s()-]/g, "");
  // Should be 10-15 digits, optionally starting with +
  return /^\+?\d{10,15}$/.test(digits);
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - in production use a library like DOMPurify
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 100;
}
