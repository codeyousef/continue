// OrderService - business logic for order operations

import {
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  calculateOrderSummary,
  canCancel,
  canRefund,
} from "../models/Order";
import { isValidQuantity } from "../utils/validators";
import { productService } from "./ProductService";
import { userService } from "./UserService";

// Simulated database
const orders: Map<string, Order> = new Map();

// Discount codes
const discountCodes: Map<
  string,
  { type: "percentage" | "fixed"; value: number }
> = new Map([
  ["SAVE10", { type: "percentage", value: 10 }],
  ["SAVE20", { type: "percentage", value: 20 }],
  ["FLAT50", { type: "fixed", value: 50 }],
]);

export class OrderService {
  async create(input: CreateOrderInput): Promise<Order> {
    // Get user
    const user = await userService.findById(input.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get addresses
    const shippingAddress = user.addresses.find(
      (_, i) =>
        `addr_${i}` === input.shippingAddressId ||
        i === parseInt(input.shippingAddressId),
    );
    if (!shippingAddress) {
      throw new Error("Shipping address not found");
    }

    const billingAddress =
      user.addresses.find(
        (_, i) =>
          `addr_${i}` === input.billingAddressId ||
          i === parseInt(input.billingAddressId),
      ) || shippingAddress;

    // Get payment method
    const paymentMethod = user.paymentMethods.find(
      (pm) => pm.id === input.paymentMethodId,
    );
    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    // Build order items
    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      if (!isValidQuantity(item.quantity)) {
        throw new Error(`Invalid quantity for product ${item.productId}`);
      }

      const product = await productService.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name} - ${variant.name}`,
        );
      }

      orderItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        unitPrice: variant.price,
        totalPrice: variant.price * item.quantity,
      });
    }

    // Apply discount
    let discount = undefined;
    if (input.discountCode) {
      const discountConfig = discountCodes.get(
        input.discountCode.toUpperCase(),
      );
      if (!discountConfig) {
        throw new Error("Invalid discount code");
      }
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
      const appliedAmount =
        discountConfig.type === "percentage"
          ? subtotal * (discountConfig.value / 100)
          : Math.min(discountConfig.value, subtotal);

      discount = {
        code: input.discountCode.toUpperCase(),
        type: discountConfig.type,
        value: discountConfig.value,
        appliedAmount,
      };
    }

    // Calculate totals
    const summary = calculateOrderSummary(
      orderItems,
      input.shippingMethod,
      discount,
    );

    const now = new Date();
    const order: Order = {
      id: `order_${Date.now()}`,
      userId: input.userId,
      items: orderItems,
      status: "pending",
      paymentStatus: "pending",
      shippingAddress,
      billingAddress,
      paymentMethod,
      shipping: {
        method: input.shippingMethod,
      },
      discount,
      subtotal: summary.subtotal,
      shippingCost: summary.shippingCost,
      taxAmount: summary.taxAmount,
      discountAmount: summary.discountAmount,
      total: summary.total,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    orders.set(order.id, order);

    // Deduct stock
    for (const item of input.items) {
      await productService.updateStock(
        item.productId,
        item.variantId,
        -item.quantity,
      );
    }

    // Award loyalty points (1 point per dollar spent)
    const pointsEarned = Math.floor(summary.total);
    await userService.addLoyaltyPoints(input.userId, pointsEarned);

    return order;
  }

  async findById(id: string): Promise<Order | null> {
    return orders.get(id) || null;
  }

  async findByUser(userId: string): Promise<Order[]> {
    return Array.from(orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new Error(`Cannot transition from ${order.status} to ${status}`);
    }

    order.status = status;
    order.updatedAt = new Date();

    // Update shipping info
    if (status === "shipped") {
      order.shipping.shippedAt = new Date();
      order.shipping.trackingNumber = `TRK${Date.now()}`;
    }
    if (status === "delivered") {
      order.shipping.deliveredAt = new Date();
    }

    orders.set(id, order);
    return order;
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!canCancel(order)) {
      throw new Error("Order cannot be cancelled");
    }

    // Restore stock
    for (const item of order.items) {
      await productService.updateStock(
        item.productId,
        item.variantId,
        item.quantity,
      );
    }

    return this.updateStatus(id, "cancelled");
  }

  async refund(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }

    if (!canRefund(order)) {
      throw new Error("Order cannot be refunded");
    }

    order.paymentStatus = "refunded";
    return this.updateStatus(id, "refunded");
  }
}

export const orderService = new OrderService();
