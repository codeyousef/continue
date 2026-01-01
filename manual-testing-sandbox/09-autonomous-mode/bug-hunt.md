# Bug Hunt: Find and Fix All Issues

## Task Description

The following module contains multiple bugs. Your task is to identify and fix all of them.

## Target File: `buggy-module.ts`

Create this file first, then find and fix all bugs:

```typescript
// WARNING: This file contains intentional bugs!
// Find and fix them all.

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Cart {
  items: CartItem[];
  userId: string;
  createdAt: Date;
}

interface Discount {
  code: string;
  percentage: number;
  minPurchase: number;
  maxDiscount: number;
  expiresAt: Date;
}

// Bug #1: Off-by-one error in loop
function calculateTotal(cart: Cart): number {
  let total = 0;
  for (let i = 0; i <= cart.items.length; i++) {
    total += cart.items[i].product.price * cart.items[i].quantity;
  }
  return total;
}

// Bug #2: Incorrect discount calculation
function applyDiscount(total: number, discount: Discount): number {
  // Should check if discount is expired
  const discountAmount = total * discount.percentage;

  // Should respect maxDiscount limit
  return total - discountAmount;
}

// Bug #3: Mutation of input parameter
function addToCart(cart: Cart, product: Product, quantity: number): Cart {
  const existingItem = cart.items.find(
    (item) => item.product.id === product.id,
  );

  if (existingItem) {
    existingItem.quantity += quantity; // Mutates original
  } else {
    cart.items.push({ product, quantity }); // Mutates original
  }

  return cart;
}

// Bug #4: Incorrect null/undefined handling
function getProductById(products: Product[], id: string): Product {
  return products.find((p) => p.id === id); // Can return undefined
}

// Bug #5: Race condition in async operation
let inventory: Map<string, number> = new Map();

async function reserveStock(
  productId: string,
  quantity: number,
): Promise<boolean> {
  const current = inventory.get(productId) || 0;

  // Simulated async operation
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (current >= quantity) {
    inventory.set(productId, current - quantity);
    return true;
  }
  return false;
}

// Bug #6: Floating point precision issue
function formatPrice(price: number): string {
  return "$" + price;
}

function addPrices(a: number, b: number): number {
  return a + b; // 0.1 + 0.2 !== 0.3
}

// Bug #7: Array reference instead of copy
function getTopProducts(products: Product[], count: number): Product[] {
  return products.sort((a, b) => b.price - a.price).slice(0, count);
  // Sorts the original array!
}

// Bug #8: Missing await
async function processOrder(cart: Cart): Promise<string> {
  for (const item of cart.items) {
    reserveStock(item.product.id, item.quantity); // Missing await!
  }
  return "Order processed";
}

// Bug #9: Type coercion issue
function findByCategory(products: Product[], category: string): Product[] {
  return products.filter((p) => p.category == category); // Should be ===
}

// Bug #10: Incorrect date comparison
function isDiscountValid(discount: Discount): boolean {
  return discount.expiresAt > Date.now(); // Comparing Date to number
}

// Bug #11: Integer overflow potential
function calculateLoyaltyPoints(purchaseAmount: number): number {
  return Math.floor(purchaseAmount * 1000000); // Could overflow
}

// Bug #12: Memory leak - event listeners not cleaned up
class CartManager {
  private listeners: Array<() => void> = [];

  onChange(callback: () => void) {
    this.listeners.push(callback);
  }

  // Missing: removeListener method
  // Missing: cleanup method
}

// Export everything
export {
  calculateTotal,
  applyDiscount,
  addToCart,
  getProductById,
  reserveStock,
  formatPrice,
  addPrices,
  getTopProducts,
  processOrder,
  findByCategory,
  isDiscountValid,
  calculateLoyaltyPoints,
  CartManager,
};
```

## Requirements

### 1. Identify All Bugs

List each bug you find with:

- Line number
- Description of the issue
- Potential impact

### 2. Fix Each Bug

Apply fixes that:

- Solve the root cause, not symptoms
- Maintain the function's intended behavior
- Don't introduce new issues

### 3. Add Defensive Code

Where appropriate, add:

- Input validation
- Null checks
- Error handling

### 4. Document Fixes

Add comments explaining what was fixed and why.

## Known Bugs (Spoiler!)

1. **Off-by-one**: `i <= length` should be `i < length`
2. **Discount logic**: Missing expiry check and max discount cap
3. **Mutation**: Should return new cart object
4. **Type safety**: Return type should be `Product | undefined`
5. **Race condition**: Need to lock or use transactions
6. **Floating point**: Need `toFixed(2)` or integer cents
7. **Array mutation**: Sort mutates original, need to copy first
8. **Missing await**: Async operations not awaited
9. **Type coercion**: Use `===` for strict equality
10. **Date comparison**: Compare dates properly
11. **Overflow**: Add bounds checking
12. **Memory leak**: Need cleanup mechanism

## Acceptance Criteria

- [ ] All 12 bugs identified
- [ ] All bugs fixed correctly
- [ ] No new bugs introduced
- [ ] Code still compiles
- [ ] Functions maintain their intended purpose
- [ ] Fixes are documented

## Hints for the Agent

1. Read each function carefully
2. Think about edge cases
3. Consider async behavior
4. Check type safety
5. Look for common JavaScript pitfalls
6. Test mentally with example data
