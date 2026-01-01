// Order model - purchase transactions

import { Address, PaymentMethod } from "./User";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDiscount {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  appliedAmount: number;
}

export interface ShippingInfo {
  method: "standard" | "express" | "overnight";
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  shipping: ShippingInfo;
  discount?: OrderDiscount;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  userId: string;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethodId: string;
  shippingMethod: ShippingInfo["method"];
  discountCode?: string;
  notes?: string;
}

export interface OrderSummary {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

export function calculateOrderSummary(
  items: OrderItem[],
  shippingMethod: ShippingInfo["method"],
  discount?: OrderDiscount,
): OrderSummary {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Shipping costs
  const shippingCosts: Record<ShippingInfo["method"], number> = {
    standard: 5.99,
    express: 14.99,
    overnight: 29.99,
  };
  const shippingCost = subtotal >= 100 ? 0 : shippingCosts[shippingMethod];

  // Tax (simplified - 8%)
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;

  // Discount
  let discountAmount = 0;
  if (discount) {
    if (discount.type === "percentage") {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = Math.min(discount.value, subtotal);
    }
  }

  const total = subtotal + shippingCost + taxAmount - discountAmount;

  return {
    subtotal,
    shippingCost,
    taxAmount,
    discountAmount,
    total: Math.max(0, total),
  };
}

export function canCancel(order: Order): boolean {
  return ["pending", "confirmed"].includes(order.status);
}

export function canRefund(order: Order): boolean {
  return order.paymentStatus === "paid" && order.status !== "refunded";
}

export function getOrderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
