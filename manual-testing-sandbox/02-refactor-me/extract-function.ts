// REFACTOR ME: This function does too many things and should be split up

interface Order {
  id: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: {
    type: "credit_card" | "paypal" | "bank_transfer";
    details: Record<string, string>;
  };
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: Date;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  loyaltyPoints: number;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

// GOD FUNCTION: Does validation, inventory, payment, notifications, logging, analytics - ALL IN ONE
async function processOrder(
  order: Order,
): Promise<{ success: boolean; message: string }> {
  console.log(
    `[${new Date().toISOString()}] Starting order processing for order ${order.id}`,
  );

  // ========== VALIDATION SECTION (should be its own function) ==========
  if (!order.id || order.id.trim() === "") {
    console.log(
      `[${new Date().toISOString()}] Validation failed: Missing order ID`,
    );
    return { success: false, message: "Order ID is required" };
  }

  if (!order.customerId || order.customerId.trim() === "") {
    console.log(
      `[${new Date().toISOString()}] Validation failed: Missing customer ID`,
    );
    return { success: false, message: "Customer ID is required" };
  }

  if (!order.items || order.items.length === 0) {
    console.log(
      `[${new Date().toISOString()}] Validation failed: No items in order`,
    );
    return { success: false, message: "Order must have at least one item" };
  }

  for (const item of order.items) {
    if (!item.productId) {
      console.log(
        `[${new Date().toISOString()}] Validation failed: Item missing product ID`,
      );
      return { success: false, message: "All items must have a product ID" };
    }
    if (item.quantity <= 0) {
      console.log(
        `[${new Date().toISOString()}] Validation failed: Invalid quantity`,
      );
      return { success: false, message: "Item quantity must be positive" };
    }
    if (item.price < 0) {
      console.log(
        `[${new Date().toISOString()}] Validation failed: Invalid price`,
      );
      return { success: false, message: "Item price cannot be negative" };
    }
  }

  if (!order.shippingAddress) {
    console.log(
      `[${new Date().toISOString()}] Validation failed: Missing shipping address`,
    );
    return { success: false, message: "Shipping address is required" };
  }

  if (
    !order.shippingAddress.street ||
    !order.shippingAddress.city ||
    !order.shippingAddress.state ||
    !order.shippingAddress.zip
  ) {
    console.log(
      `[${new Date().toISOString()}] Validation failed: Incomplete shipping address`,
    );
    return { success: false, message: "Shipping address is incomplete" };
  }

  const validCountries = ["US", "CA", "UK", "AU", "DE", "FR"];
  if (!validCountries.includes(order.shippingAddress.country)) {
    console.log(
      `[${new Date().toISOString()}] Validation failed: Invalid country`,
    );
    return {
      success: false,
      message: `Shipping not available to ${order.shippingAddress.country}`,
    };
  }

  // ========== CUSTOMER LOOKUP SECTION (should be its own function) ==========
  console.log(
    `[${new Date().toISOString()}] Looking up customer ${order.customerId}`,
  );
  let customer: Customer;
  try {
    const response = await fetch(
      `https://api.example.com/customers/${order.customerId}`,
    );
    if (!response.ok) {
      console.log(
        `[${new Date().toISOString()}] Customer lookup failed: ${response.status}`,
      );
      return { success: false, message: "Customer not found" };
    }
    customer = await response.json();
  } catch (error) {
    console.log(
      `[${new Date().toISOString()}] Customer lookup error: ${error}`,
    );
    return { success: false, message: "Failed to fetch customer data" };
  }

  // ========== INVENTORY CHECK SECTION (should be its own function) ==========
  console.log(
    `[${new Date().toISOString()}] Checking inventory for ${order.items.length} items`,
  );
  const inventoryIssues: string[] = [];

  for (const item of order.items) {
    try {
      const response = await fetch(
        `https://api.example.com/products/${item.productId}`,
      );
      if (!response.ok) {
        inventoryIssues.push(`Product ${item.productId} not found`);
        continue;
      }
      const product: Product = await response.json();

      if (product.stock < item.quantity) {
        inventoryIssues.push(
          `Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock}`,
        );
      }
    } catch (error) {
      console.log(
        `[${new Date().toISOString()}] Inventory check error: ${error}`,
      );
      inventoryIssues.push(`Failed to check inventory for ${item.productId}`);
    }
  }

  if (inventoryIssues.length > 0) {
    console.log(
      `[${new Date().toISOString()}] Inventory issues: ${inventoryIssues.join(", ")}`,
    );
    return {
      success: false,
      message: `Inventory issues: ${inventoryIssues.join("; ")}`,
    };
  }

  // ========== PRICE CALCULATION SECTION (should be its own function) ==========
  console.log(`[${new Date().toISOString()}] Calculating order total`);
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }

  // Apply loyalty discount
  let discount = 0;
  if (customer.loyaltyPoints >= 1000) {
    discount = subtotal * 0.15; // 15% discount for premium
  } else if (customer.loyaltyPoints >= 500) {
    discount = subtotal * 0.1; // 10% discount for gold
  } else if (customer.loyaltyPoints >= 100) {
    discount = subtotal * 0.05; // 5% discount for silver
  }

  // Calculate shipping
  let shippingCost = 0;
  if (order.shippingAddress.country === "US") {
    if (subtotal >= 100) {
      shippingCost = 0; // Free shipping over $100
    } else {
      shippingCost = 9.99;
    }
  } else if (order.shippingAddress.country === "CA") {
    shippingCost = 14.99;
  } else {
    shippingCost = 29.99; // International
  }

  // Calculate tax
  let taxRate = 0;
  const stateTaxRates: Record<string, number> = {
    CA: 0.0725,
    NY: 0.08,
    TX: 0.0625,
    FL: 0.06,
    WA: 0.065,
  };
  if (
    order.shippingAddress.country === "US" &&
    stateTaxRates[order.shippingAddress.state]
  ) {
    taxRate = stateTaxRates[order.shippingAddress.state];
  }
  const tax = (subtotal - discount) * taxRate;

  const total = subtotal - discount + shippingCost + tax;
  console.log(
    `[${new Date().toISOString()}] Order total: $${total.toFixed(2)} (subtotal: $${subtotal}, discount: $${discount}, shipping: $${shippingCost}, tax: $${tax.toFixed(2)})`,
  );

  // ========== PAYMENT PROCESSING SECTION (should be its own function) ==========
  console.log(
    `[${new Date().toISOString()}] Processing payment via ${order.paymentMethod.type}`,
  );
  let paymentResult: {
    success: boolean;
    transactionId?: string;
    error?: string;
  };

  if (order.paymentMethod.type === "credit_card") {
    try {
      const response = await fetch("https://payment.example.com/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "USD",
          cardNumber: order.paymentMethod.details.cardNumber,
          expiry: order.paymentMethod.details.expiry,
          cvv: order.paymentMethod.details.cvv,
          orderId: order.id,
        }),
      });
      paymentResult = await response.json();
    } catch (error) {
      console.log(`[${new Date().toISOString()}] Payment error: ${error}`);
      paymentResult = { success: false, error: "Payment processing failed" };
    }
  } else if (order.paymentMethod.type === "paypal") {
    try {
      const response = await fetch("https://paypal.example.com/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          paypalEmail: order.paymentMethod.details.email,
          orderId: order.id,
        }),
      });
      paymentResult = await response.json();
    } catch (error) {
      console.log(`[${new Date().toISOString()}] PayPal error: ${error}`);
      paymentResult = { success: false, error: "PayPal processing failed" };
    }
  } else if (order.paymentMethod.type === "bank_transfer") {
    // Bank transfer is always pending
    paymentResult = { success: true, transactionId: `BT-${Date.now()}` };
  } else {
    paymentResult = { success: false, error: "Unknown payment method" };
  }

  if (!paymentResult.success) {
    console.log(
      `[${new Date().toISOString()}] Payment failed: ${paymentResult.error}`,
    );
    return { success: false, message: paymentResult.error || "Payment failed" };
  }

  // ========== INVENTORY UPDATE SECTION (should be its own function) ==========
  console.log(`[${new Date().toISOString()}] Updating inventory`);
  for (const item of order.items) {
    try {
      await fetch(`https://api.example.com/products/${item.productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decrement: item.quantity }),
      });
    } catch (error) {
      console.log(
        `[${new Date().toISOString()}] Inventory update error for ${item.productId}: ${error}`,
      );
      // Continue anyway - will reconcile later
    }
  }

  // ========== NOTIFICATION SECTION (should be its own function) ==========
  console.log(`[${new Date().toISOString()}] Sending notifications`);

  // Send confirmation email
  try {
    await fetch("https://email.example.com/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: customer.email,
        template: "order_confirmation",
        data: {
          customerName: customer.name,
          orderId: order.id,
          total: total.toFixed(2),
          items: order.items.length,
          shippingAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
        },
      }),
    });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Email send error: ${error}`);
  }

  // Send SMS if phone available
  if (order.paymentMethod.details.phone) {
    try {
      await fetch("https://sms.example.com/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: order.paymentMethod.details.phone,
          message: `Your order ${order.id} has been confirmed! Total: $${total.toFixed(2)}`,
        }),
      });
    } catch (error) {
      console.log(`[${new Date().toISOString()}] SMS send error: ${error}`);
    }
  }

  // ========== LOYALTY POINTS SECTION (should be its own function) ==========
  console.log(`[${new Date().toISOString()}] Updating loyalty points`);
  const pointsEarned = Math.floor(total); // 1 point per dollar
  try {
    await fetch(
      `https://api.example.com/customers/${order.customerId}/loyalty`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addPoints: pointsEarned }),
      },
    );
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Loyalty update error: ${error}`);
  }

  // ========== ANALYTICS SECTION (should be its own function) ==========
  console.log(`[${new Date().toISOString()}] Recording analytics`);
  try {
    await fetch("https://analytics.example.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "order_completed",
        properties: {
          orderId: order.id,
          customerId: order.customerId,
          total: total,
          itemCount: order.items.length,
          paymentMethod: order.paymentMethod.type,
          country: order.shippingAddress.country,
          discount: discount,
          loyaltyTier:
            customer.loyaltyPoints >= 1000
              ? "premium"
              : customer.loyaltyPoints >= 500
                ? "gold"
                : customer.loyaltyPoints >= 100
                  ? "silver"
                  : "bronze",
        },
      }),
    });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] Analytics error: ${error}`);
  }

  console.log(
    `[${new Date().toISOString()}] Order ${order.id} processed successfully`,
  );
  return {
    success: true,
    message: `Order processed successfully. Total: $${total.toFixed(2)}. Points earned: ${pointsEarned}`,
  };
}

export { processOrder };
