// Formatters - shared formatting utilities

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date,
  style: "short" | "medium" | "long" = "medium",
): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  }[style];

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatOrderId(id: string): string {
  // Format: ORD-XXXX-XXXX
  const clean = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `ORD-${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

export function formatAddress(address: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}): string {
  return `${address.street}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function formatCreditCard(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return `**** **** **** ${digits.slice(-4)}`;
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = "...",
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length).trim() + suffix;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string,
): string {
  const pluralForm = plural || `${singular}s`;
  return count === 1 ? `${count} ${singular}` : `${count} ${pluralForm}`;
}
