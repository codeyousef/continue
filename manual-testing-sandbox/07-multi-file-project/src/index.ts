// E-Commerce Application Entry Point
// Demonstrates module exports and application bootstrap

import * as api from "./controllers/api";
import { orderService } from "./services/OrderService";
import { productService } from "./services/ProductService";
import { userService } from "./services/UserService";
import { formatCurrency } from "./utils/formatters";

// Re-export all services for external use
export { orderService, productService, userService };

// Re-export models
export * from "./models/Order";
export * from "./models/Product";
export * from "./models/User";

// Re-export utilities
export * from "./utils/formatters";
export * from "./utils/validators";

// Application configuration
export interface AppConfig {
  port: number;
  env: "development" | "staging" | "production";
  database: {
    host: string;
    port: number;
    name: string;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
}

const defaultConfig: AppConfig = {
  port: 3000,
  env: "development",
  database: {
    host: "localhost",
    port: 5432,
    name: "ecommerce_dev",
  },
  cache: {
    ttl: 3600,
    enabled: true,
  },
};

// Demo function to show the system working
export async function runDemo(): Promise<void> {
  console.log("=== E-Commerce System Demo ===\n");

  // Create a user
  console.log("1. Creating user...");
  const user = await userService.create({
    email: "john.doe@example.com",
    password: "SecurePass123!",
    firstName: "John",
    lastName: "Doe",
    phone: "+1-555-0123",
  });
  console.log(
    `   Created user: ${user.firstName} ${user.lastName} (${user.email})`,
  );

  // Add an address
  console.log("\n2. Adding shipping address...");
  await userService.addAddress(user.id, {
    type: "shipping",
    isDefault: true,
    street: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94102",
    country: "USA",
  });
  console.log("   Address added successfully");

  // Add payment method
  console.log("\n3. Adding payment method...");
  await userService.addPaymentMethod(user.id, {
    type: "credit_card",
    lastFour: "4242",
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  });
  console.log("   Payment method added successfully");

  // Create some products
  console.log("\n4. Creating products...");
  const laptop = await productService.create({
    name: 'MacBook Pro 16"',
    description: "Apple M3 Max chip, 36GB RAM, 512GB SSD",
    category: "electronics",
    brand: "Apple",
    variants: [
      {
        name: "Space Black",
        sku: "MBP16-BLK-001",
        price: 3499.0,
        stock: 10,
        attributes: { color: "Space Black", storage: "512GB" },
      },
      {
        name: "Silver",
        sku: "MBP16-SIL-001",
        price: 3499.0,
        stock: 15,
        attributes: { color: "Silver", storage: "512GB" },
      },
    ],
    images: ["/images/macbook-pro-16.jpg"],
    tags: ["laptop", "apple", "pro", "m3"],
  });
  console.log(
    `   Created: ${laptop.name} - ${formatCurrency(laptop.variants[0].price)}`,
  );

  const headphones = await productService.create({
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling wireless headphones",
    category: "electronics",
    brand: "Sony",
    variants: [
      {
        name: "Black",
        sku: "SONY-XM5-BLK",
        price: 399.99,
        stock: 50,
        attributes: { color: "Black" },
      },
      {
        name: "Silver",
        sku: "SONY-XM5-SIL",
        price: 399.99,
        stock: 30,
        attributes: { color: "Silver" },
      },
    ],
    images: ["/images/sony-xm5.jpg"],
    tags: ["headphones", "sony", "noise-canceling", "wireless"],
  });
  console.log(
    `   Created: ${headphones.name} - ${formatCurrency(headphones.variants[0].price)}`,
  );

  // Get updated user (with address and payment)
  const updatedUser = await userService.findById(user.id);
  if (!updatedUser) throw new Error("User not found");

  // Create an order
  console.log("\n5. Creating order...");
  const order = await orderService.create({
    userId: user.id,
    items: [
      { productId: laptop.id, variantId: laptop.variants[0].id, quantity: 1 },
      {
        productId: headphones.id,
        variantId: headphones.variants[0].id,
        quantity: 2,
      },
    ],
    shippingAddressId: "0",
    billingAddressId: "0",
    paymentMethodId: updatedUser.paymentMethods[0].id,
    shippingMethod: "express",
    discountCode: "SAVE10",
  });

  console.log(`   Order created: ${order.id}`);
  console.log(`   Items: ${order.items.length}`);
  console.log(`   Subtotal: ${formatCurrency(order.subtotal)}`);
  console.log(`   Discount: -${formatCurrency(order.discountAmount)}`);
  console.log(`   Shipping: ${formatCurrency(order.shippingCost)}`);
  console.log(`   Tax: ${formatCurrency(order.taxAmount)}`);
  console.log(`   Total: ${formatCurrency(order.total)}`);

  // Update order status
  console.log("\n6. Processing order...");
  await orderService.updateStatus(order.id, "confirmed");
  console.log("   Status: confirmed");
  await orderService.updateStatus(order.id, "processing");
  console.log("   Status: processing");
  await orderService.updateStatus(order.id, "shipped");
  console.log("   Status: shipped (tracking number generated)");

  // Check user's loyalty points
  const finalUser = await userService.findById(user.id);
  console.log(`\n7. Loyalty points earned: ${finalUser?.loyaltyPoints || 0}`);

  console.log("\n=== Demo Complete ===");
}

// Main entry point
export async function main(config: Partial<AppConfig> = {}): Promise<void> {
  const finalConfig = { ...defaultConfig, ...config };

  console.log(`Starting E-Commerce API Server...`);
  console.log(`Environment: ${finalConfig.env}`);
  console.log(`Port: ${finalConfig.port}`);
  console.log(
    `Database: ${finalConfig.database.host}:${finalConfig.database.port}/${finalConfig.database.name}`,
  );
  console.log(
    `Cache: ${finalConfig.cache.enabled ? "enabled" : "disabled"} (TTL: ${finalConfig.cache.ttl}s)`,
  );
  console.log();

  // Register routes
  console.log("Registered routes:");
  Object.keys(api.routes).forEach((route) => {
    console.log(`  ${route}`);
  });

  console.log();
  console.log(`Server running at http://localhost:${finalConfig.port}`);
}

// Run if executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}
