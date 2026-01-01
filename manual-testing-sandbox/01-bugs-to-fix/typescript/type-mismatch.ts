// BUG FILE: Intentional type mismatch errors for testing

interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// BUG 1: Wrong return type
function getProductName(product: Product): number {
  return product.name; // Returns string, declared as number
}

// BUG 2: Wrong parameter type
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, "0"); // Initial value should be number, not string
}

// BUG 3: Assigning wrong type to variable
function processProduct(product: Product) {
  const price: string = product.price; // price is number
  const inStock: number = product.inStock; // inStock is boolean
  console.log(price, inStock);
}

// BUG 4: Array type mismatch
function getProductIds(products: Product[]): string[] {
  return products.map((p) => p.id); // Returns number[], declared string[]
}

// BUG 5: Object literal with wrong types
const sampleProduct: Product = {
  id: "123", // Should be number
  name: 456, // Should be string
  price: "29.99", // Should be number
  inStock: "yes", // Should be boolean
};

// BUG 6: Function parameter count mismatch
function formatPrice(
  price: number,
  currency: string,
  decimals: number,
): string {
  return `${currency}${price.toFixed(decimals)}`;
}

const formatted = formatPrice(29.99, "$"); // Missing third argument

// BUG 7: Union type not handled
type Status = "pending" | "completed" | "cancelled";

function getStatusColor(status: Status): string {
  if (status === "pending") return "yellow";
  if (status === "completed") return "green";
  // BUG: Missing handler for "cancelled"
}

// BUG 8: Generic type mismatch
function firstElement<T>(arr: T[]): T {
  return arr[0];
}

const num: string = firstElement([1, 2, 3]); // Returns number, assigned to string
