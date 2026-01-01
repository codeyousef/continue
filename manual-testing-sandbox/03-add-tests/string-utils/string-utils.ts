// String utilities - needs tests generated from scratch

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

export function camelCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^./, (char) => char.toLowerCase());
}

export function kebabCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

export function snakeCase(str: string): string {
  if (!str) return str;
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

export function truncate(
  str: string,
  maxLength: number,
  suffix: string = "...",
): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function padLeft(
  str: string,
  length: number,
  char: string = " ",
): string {
  if (str.length >= length) return str;
  return char.repeat(length - str.length) + str;
}

export function padRight(
  str: string,
  length: number,
  char: string = " ",
): string {
  if (str.length >= length) return str;
  return str + char.repeat(length - str.length);
}

export function reverse(str: string): string {
  return str.split("").reverse().join("");
}

export function isPalindrome(str: string): boolean {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned === reverse(cleaned);
}

export function countOccurrences(str: string, substring: string): number {
  if (!substring) return 0;
  let count = 0;
  let position = 0;
  while ((position = str.indexOf(substring, position)) !== -1) {
    count++;
    position += substring.length;
  }
  return count;
}

export function wordCount(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).length;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractEmails(str: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return str.match(emailRegex) || [];
}

export function extractUrls(str: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return str.match(urlRegex) || [];
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + "***" + local.charAt(local.length - 1);
  return maskedLocal + "@" + domain;
}

export function maskCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return cardNumber;
  return "*".repeat(digits.length - 4) + digits.slice(-4);
}
