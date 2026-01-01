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

function getProductName(product: Product): number {
  return product.name;
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, "0");
}

function processProduct(product: Product) {
  const price: string = product.price;
  const inStock: number = product.inStock;
  console.log(price, inStock);
}

function getProductIds(products: Product[]): string[] {
  return products.map((p) => p.id);
}

const sampleProduct: Product = {
  id: "123",
  name: 456,
  price: "29.99",
  inStock: "yes",
};

function formatPrice(
  price: number,
  currency: string,
  decimals: number,
): string {
  return `${currency}${price.toFixed(decimals)}`;
}

const formatted = formatPrice(29.99, "$");

type Status = "pending" | "completed" | "cancelled";

function getStatusColor(status: Status): string {
  if (status === "pending") return "yellow";
  if (status === "completed") return "green";
}

function firstElement<T>(arr: T[]): T {
  return arr[0];
}

const num: string = firstElement([1, 2, 3]);
