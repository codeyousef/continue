// Product model - items available for purchase

export type ProductCategory =
  | "electronics"
  | "clothing"
  | "home"
  | "books"
  | "sports"
  | "toys"
  | "food"
  | "other";

export type ProductStatus =
  | "draft"
  | "active"
  | "out_of_stock"
  | "discontinued";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>; // e.g., { color: "red", size: "M" }
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  tags: string[];
  status: ProductStatus;
  variants: ProductVariant[];
  images: ProductImage[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  vendorId: string;
  name: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  tags?: string[];
  variants: Omit<ProductVariant, "id">[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  category?: ProductCategory;
  tags?: string[];
  status?: ProductStatus;
}

export interface ProductSearchFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  vendorId?: string;
  tags?: string[];
  search?: string;
}

export function getLowestPrice(product: Product): number {
  if (product.variants.length === 0) return 0;
  return Math.min(...product.variants.map((v) => v.price));
}

export function getHighestPrice(product: Product): number {
  if (product.variants.length === 0) return 0;
  return Math.max(...product.variants.map((v) => v.price));
}

export function getPrimaryImage(product: Product): ProductImage | undefined {
  return product.images.find((img) => img.isPrimary) || product.images[0];
}

export function getTotalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function isInStock(product: Product): boolean {
  return getTotalStock(product) > 0;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
